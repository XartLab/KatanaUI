// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 表单与动作件（G2，2026-11-18）：原来没有专属 e2e 的六页——chip-group、shortcut-recorder、date-range-picker、hold-to-confirm、
// rendering-settings、range-histogram-slider。在文档站的页上真点真按，断言用户看到的值与 ARIA。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('ChipGroup：点芯片开关、单选再点取消、清除钮清空', async ({ page }) => {
  const area = await open(page, 'chip-group')
  const multi = area.getByRole('group', { name: '市场', exact: true })
  const out = area.locator('[data-gallery-chips]')
  await expect(out).toHaveText('cn,crypto')
  await multi.getByRole('button', { name: /港股/ }).click()
  await expect(multi.getByRole('button', { name: /港股/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(out).toHaveText('cn,crypto,hk')
  await expect(multi.getByRole('button', { name: /期货/ })).toBeDisabled()
  await multi.getByRole('button', { name: '清除筛选' }).click()
  await expect(out).toHaveText('无')
  await expect(multi.getByRole('button', { name: '清除筛选' })).toHaveCount(0)

  const single = area.getByRole('group', { name: '市场（单选）' })
  const one = area.locator('[data-gallery-chips-one]')
  await single.getByRole('button', { name: /美股/ }).click()
  await expect(one).toHaveText('us')
  await single.getByRole('button', { name: /美股/ }).click()
  await expect(one).toHaveText('无')
  // 方向键在芯片间走（组内只停一个）。
  await single.getByRole('button', { name: /A 股/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(single.getByRole('button', { name: /港股/ })).toBeFocused()
})

test('ShortcutRecorder：录下新组合、冲突不写入、要求修饰键、Backspace 清除', async ({ page }) => {
  const area = await open(page, 'shortcut-recorder')
  const field = area.getByRole('button', { name: '全部平仓快捷键' })
  const out = area.locator('[data-gallery-recorder]')
  await expect(out).toHaveText('Ctrl+Shift+F')
  await field.click()
  await page.keyboard.press('Control+Shift+K')
  await expect(area.getByRole('status').first()).toHaveText('已被「全部撤单」使用')
  await expect(out).toHaveText('Ctrl+Shift+F')
  await page.keyboard.press('Control+Alt+J')
  await expect(out).toHaveText('Ctrl+Alt+J')

  const bare = area.getByRole('button', { name: '切换品种快捷键' })
  const mod = area.locator('[data-gallery-recorder-mod]')
  await bare.click()
  await page.keyboard.press('J')
  await expect(mod).toHaveText('未设置')
  await expect(area.getByText('要带 Ctrl、Alt、Shift 或 Meta')).toBeVisible()
  await page.keyboard.press('Escape')

  await field.click()
  await page.keyboard.press('Backspace')
  await expect(out).toHaveText('未设置')
  await expect(area.getByRole('button', { name: '只读快捷键' })).toBeDisabled()
})

test('DateRangePicker：预设一键选区间、高亮当前预设，打字凑成合法区间才上报', async ({ page }) => {
  const area = await open(page, 'date-range-picker')
  const out = area.locator('[data-gallery-range]')
  await expect(out).toHaveText('2026-11-09 ~ 2026-11-14')
  await area.getByRole('button', { name: '选择区间' }).first().click()
  const presets = page.getByRole('group', { name: '常用区间' })
  await expect(presets.getByRole('button', { name: '本周' })).toHaveAttribute('aria-pressed', 'true')
  await presets.getByRole('button', { name: '本月' }).click()
  await expect(out).toHaveText('2026-11-01 ~ 2026-11-14')
  await expect(presets).toHaveCount(0)
  // 起点打成晚于终点（日打 20：先是合法的 02，再成 20）：20 不上报，框标红。
  const start = area.getByRole('group', { name: '起点' }).first()
  await start.getByRole('spinbutton').last().click()
  await page.keyboard.type('20')
  await expect(out).toHaveText('2026-11-02 ~ 2026-11-14')
  await expect(area.locator('.k-dt-input[data-invalid]').first()).toBeVisible()
})

test('DateRangePicker commit=apply：先挑再应用——状态字、悬停预览、Esc 丢草稿、应用才上报、键盘走全程', async ({
  page,
}) => {
  const area = await open(page, 'date-range-picker')
  const out = area.locator('[data-gallery-range-apply]')
  const row = area.locator('.k-dr').nth(2)
  const trigger = row.getByRole('button', { name: '选择区间' })
  const foot = page.locator('.k-dr-foot')
  // 看得见的状态字（跟着悬停走）与读屏播报的那份（role=status，只在点选后更新）是两个节点。
  const status = foot.locator('[data-slot="date-range-status"]')
  const spoken = foot.getByRole('status')
  const applyBtn = foot.getByRole('button', { name: '应用' })
  const day = (n: number, month = '12月') => page.getByRole('button', { name: new RegExp(`${month}${n}日`) }).first()
  await expect(out).toHaveText('未选')

  // 判据 1：打开，脚上「选第一天」，「应用」禁用。
  await trigger.click()
  await expect(status).toHaveText('选第一天')
  await expect(applyBtn).toBeDisabled()
  // 今天（演示固定 2026-11-14）的格子有标记。
  await expect(page.locator('.k-cal-cell[data-k-today]')).toHaveCount(1)

  // 判据 2：点 7 号，起点段落填好、终点仍是占位，脚上「已选 1 天」；悬停 18 号，预览区间、「已选 12 天」。
  await day(7).click()
  await expect(status).toHaveText('已选 1 天')
  const start = row.getByRole('group', { name: '起点' })
  const end = row.getByRole('group', { name: '终点' })
  await expect(start.getByRole('spinbutton', { name: /日/ })).toHaveText('07')
  await expect(end.getByRole('spinbutton', { name: /年/ })).toHaveAttribute('data-placeholder', 'true')
  await expect(spoken).toHaveText('已选 1 天')
  await day(18).hover()
  await expect(status).toHaveText('已选 12 天')
  // 悬停不播报：看得见的变成 12 天，读屏那份仍是点选时的「已选 1 天」，而且整个悬停过程里没被改写过。
  await expect(spoken).toHaveText('已选 1 天')
  await expect(page.locator('.k-rcal .k-cal-cell[data-selected]')).toHaveCount(12)
  await expect(applyBtn).toBeDisabled()

  // 判据 3：点 18 号，「应用」可点；Esc 收起，值没变（草稿丢掉）。
  await day(18).click()
  await expect(status).toHaveText('已选 12 天')
  await expect(spoken).toHaveText('已选 12 天')
  await expect(applyBtn).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(foot).toHaveCount(0)
  await expect(out).toHaveText('未选')
  await expect(trigger).toBeFocused()

  // 再开：草稿是重新来的（没有上次丢掉的 7–18），脚上又是「选第一天」。点外面收起同样丢草稿。
  await trigger.click()
  await expect(status).toHaveText('选第一天')
  await day(7).click()
  await day(18).click()
  await page.mouse.click(5, 5)
  await expect(foot).toHaveCount(0)
  await expect(out).toHaveText('未选')

  // 判据 4：再开、挑好、点「应用」——onChange 收到区间、弹层收起、焦点回触发器。
  await trigger.click()
  await day(7).click()
  await day(18).click()
  await applyBtn.click()
  await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')
  await expect(foot).toHaveCount(0)
  await expect(trigger).toBeFocused()

  // 有值时再开：草稿从当前值起，状态字是 12 天；「清除」清空草稿但不收起，应用禁用。
  await trigger.click()
  await expect(status).toHaveText('已选 12 天')
  await foot.getByRole('button', { name: '清除' }).click()
  await expect(status).toHaveText('选第一天')
  await expect(applyBtn).toBeDisabled()
  await expect(foot).toBeVisible()
  await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')
  await page.keyboard.press('Escape')

  // 预设在 apply 里也只改草稿：点「本周」不上报，点「应用」才上报。
  await trigger.click()
  await page.getByRole('group', { name: '常用区间' }).getByRole('button', { name: '本周' }).click()
  await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')
  await expect(status).toHaveText('已选 6 天')
  await applyBtn.click()
  await expect(out).toHaveText('2026-11-09 ~ 2026-11-14')
})

test('DateRangePicker commit=apply：键盘全程可走（方向键挑日、Enter 选、Tab 到脚上钮、Enter 应用）', async ({
  page,
}) => {
  const area = await open(page, 'date-range-picker')
  const out = area.locator('[data-gallery-range-apply]')
  const row = area.locator('.k-dr').nth(2)
  const trigger = row.getByRole('button', { name: '选择区间' })
  const foot = page.locator('.k-dr-foot')
  await trigger.focus()
  await page.keyboard.press('Enter')
  // 打开后焦点在日历里的聚焦日（没有值时是演示的今天 11 月 14 日）。
  await expect(page.locator('.k-cal-cell[data-focused]')).toHaveCount(1)
  // Enter 选起点；react-aria 键盘选完起点会把焦点挪到下一天，所以此时是 14–15 两天（鼠标点才是 1 天）。方向键再走两格到 17。
  await page.keyboard.press('Enter')
  await expect(foot.locator('[data-slot="date-range-status"]')).toHaveText('已选 2 天')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(foot.locator('[data-slot="date-range-status"]')).toHaveText('已选 4 天')
  await page.keyboard.press('Enter')
  await expect(foot.getByRole('button', { name: '应用' })).toBeEnabled()
  // Tab 出日历：翻月钮之后才是日历格，所以从格子往后 Tab 先到「清除」再到「应用」。
  await page.keyboard.press('Tab')
  await expect(foot.getByRole('button', { name: '清除' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(foot.getByRole('button', { name: '应用' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(out).toHaveText('2026-11-14 ~ 2026-11-17')
  await expect(foot).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('DateRangePicker commit=apply：弹层开着时外部改 value——没动过的草稿跟着变，动过的保留', async ({ page }) => {
  const area = await open(page, 'date-range-picker')
  const out = area.locator('[data-gallery-range-apply]')
  const row = area.locator('.k-dr').nth(2)
  const trigger = row.getByRole('button', { name: '选择区间' })
  const foot = page.locator('.k-dr-foot')
  const status = foot.locator('[data-slot="date-range-status"]')
  const applyBtn = foot.getByRole('button', { name: '应用' })
  const external = area.locator('[data-gallery-range-external]')
  // 点外部的钮会先触发「点外面收起」：用 el.click() 直接触发点击（不经 pointerdown），模拟 URL、别的面板在弹层开着时改了值。
  const changeOutside = () => external.evaluate((el) => (el as HTMLElement).click())
  const start = row.getByRole('group', { name: '起点' }).getByRole('spinbutton', { name: /日/ })
  const day = (n: number) => page.getByRole('button', { name: new RegExp(`12月${n}日`) }).first()

  // 先给一个初值 12-07 ~ 12-18。
  await trigger.click()
  await day(7).click()
  await day(18).click()
  await applyBtn.click()
  await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')

  // 没动过：打开后外部改成 11-02 ~ 11-06，框、状态字、应用都跟着变，点「应用」上报的是新值。
  await trigger.click()
  await expect(status).toHaveText('已选 12 天')
  await changeOutside()
  await expect(out).toHaveText('2026-11-02 ~ 2026-11-06')
  await expect(status).toHaveText('已选 5 天')
  await expect(start).toHaveText('02')
  await applyBtn.click()
  await expect(out).toHaveText('2026-11-02 ~ 2026-11-06')
  await expect(foot).toHaveCount(0)

  // 先把值换回 12-07 ~ 12-18，外部再改成 11-02 ~ 11-06 才是真的变化。
  await trigger.click()
  await day(7).click()
  await day(18).click()
  await applyBtn.click()
  await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')
  // 点了起点还没点终点时外部改值：算动过，日历不跳、焦点不挪，状态字只按草稿算（只有起点：「已选 1 天」），不会因新聚焦日出现「已选 36 天」。
  await trigger.click()
  await day(7).click()
  await expect(status).toHaveText('已选 1 天')
  await changeOutside()
  await expect(out).toHaveText('2026-11-02 ~ 2026-11-06')
  await expect(status).toHaveText('已选 1 天')
  await expect(page.locator('.k-rcal .k-cal-cell[data-selected]')).toHaveCount(1)
  await expect(start).toHaveText('07')
  await expect(applyBtn).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(foot).toHaveCount(0)

  // 动过：打开后用户先点了「今天」预设（草稿 11-14），这时外部改值，草稿保留，点「应用」上报草稿。
  await trigger.click()
  await page.getByRole('group', { name: '常用区间' }).getByRole('button', { name: '今天' }).click()
  await expect(status).toHaveText('已选 1 天')
  await area.locator('[data-gallery-range-external]').evaluate((el) => (el as HTMLElement).click())
  await expect(out).toHaveText('2026-11-02 ~ 2026-11-06')
  await expect(status).toHaveText('已选 1 天')
  await expect(start).toHaveText('14')
  await applyBtn.click()
  await expect(out).toHaveText('2026-11-14 ~ 2026-11-14')
})

test('DateRangePicker：点外面按实例判断，一次就收；弹层里面与里面再弹出的子浮层不收', async ({ page }) => {
  const area = await open(page, 'date-range-picker')
  const row = area.locator('.k-dr').nth(2)
  const trigger = row.getByRole('button', { name: '选择区间' })
  const foot = page.locator('.k-dr-foot')
  const day = (n: number) => page.getByRole('button', { name: new RegExp(`12月${n}日`) }).first()
  const pointerdownOn = (selector: string) =>
    page.evaluate((sel) => {
      document.querySelector(sel)!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
    }, selector)

  await trigger.click()
  await day(7).click()
  // 页面上另有一个带 .k-dr-pop 类的节点（别的实例、静态预览）：它不是这一份弹层，点它要收起。
  await page.evaluate(() => {
    const decoy = document.createElement('div')
    decoy.className = 'k-dr-pop'
    decoy.id = 'decoy-pop'
    document.body.append(decoy)
    const layer = document.createElement('div')
    layer.setAttribute('data-radix-popper-content-wrapper', '')
    layer.id = 'sub-layer'
    document.body.append(layer)
  })
  // 里面再 portal 出去的子浮层（Radix 的 popper 外壳，Tooltip、Select 等）算里面：不收。
  // 「还开着」看触发钮的 aria-expanded（状态一变就变），不看脚是否可见：收起有退场动画，脚会多留一会儿，会让「没收」的断言假通过。
  await pointerdownOn('#sub-layer')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  // 弹层自己里面：不收。
  await pointerdownOn('.k-dr-foot')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  // 别的实例的节点：一次就收。
  await pointerdownOn('#decoy-pop')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(foot).toHaveCount(0)

  // immediate 模式：翻月（react-aria 的按压）之后点外面，一次就收（以前要点两次）。
  const immediate = area.locator('.k-dr').nth(0).getByRole('button', { name: '选择区间' })
  await immediate.click()
  await page.getByRole('button', { name: '下个月' }).click()
  await page.mouse.click(900, 5)
  await expect(page.locator('.k-dr-presets')).toHaveCount(0)
})

test('DateRangePicker：预设受 min / max 约束，整段越界的禁用', async ({ page }) => {
  const area = await open(page, 'date-range-picker')
  // 第二行 min 是 2026-11-02：「本月」（11-01 起）与「年初至今」越界，「今天」「本周」（11-09 起）可点。
  await area.locator('.k-dr').nth(1).getByRole('button', { name: '选择区间' }).click()
  const presets = page.getByRole('group', { name: '常用区间' })
  await expect(presets.getByRole('button', { name: '今天' })).toBeEnabled()
  await expect(presets.getByRole('button', { name: '本周' })).toBeEnabled()
  await expect(presets.getByRole('button', { name: '本月' })).toBeDisabled()
  await expect(presets.getByRole('button', { name: '年初至今' })).toBeDisabled()
})

test('HoldToConfirm：单击不触发，按住填满才触发一次；键盘按住空格同样', async ({ page }) => {
  const area = await open(page, 'hold-to-confirm')
  const flatten = area.getByRole('button', { name: '全部平仓' })
  const count = area.locator('[data-gallery-hold]')
  await flatten.click()
  await expect(count).toHaveText('已触发 0 次')
  await expect(flatten).toHaveAccessibleDescription('按住 2 秒，全部平仓')

  const fast = area.getByRole('button', { name: '停止策略' })
  await expect(fast).toHaveAttribute('data-tone', 'neutral')
  const box = (await fast.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect(area.locator('[data-gallery-hold-fast]')).toHaveText('已触发 1 次', { timeout: 3000 })
  await page.mouse.up()
  await expect(fast).toHaveAttribute('data-phase', 'idle', { timeout: 2000 })

  await fast.focus()
  await page.keyboard.down(' ')
  await expect(area.locator('[data-gallery-hold-fast]')).toHaveText('已触发 2 次', { timeout: 3000 })
  await page.keyboard.up(' ')
  await expect(area.getByRole('button', { name: '全部撤单' })).toBeDisabled()
})

test('RenderingSettings：开关写到根节点、滑块走格、恢复默认清干净', async ({ page }) => {
  const area = await open(page, 'rendering-settings')
  const html = page.locator('html')
  const zero = area.getByRole('group', { name: '斜线零' }).first()
  await zero.getByRole('button', { name: '开' }).click()
  await expect(zero.getByRole('button', { name: '开' })).toHaveAttribute('aria-pressed', 'true')
  await expect(html).toHaveAttribute('data-numerals', 'slashed')
  const weight = area.getByRole('slider', { name: '字重补偿' }).first()
  await weight.focus()
  await page.keyboard.press('ArrowRight')
  await expect(weight).toHaveAttribute('aria-valuenow', '10')
  await expect(area.locator('.k-render-out').first()).toHaveText('+10')
  expect(await html.evaluate((el) => el.style.getPropertyValue('--k-weight-adjust'))).toBe('10')
  await area.getByRole('button', { name: '恢复默认' }).first().click()
  await expect(html).not.toHaveAttribute('data-numerals', /.*/)
  expect(await html.evaluate((el) => el.style.getPropertyValue('--k-weight-adjust'))).toBe('')
})

test('RangeHistogramSlider：两个 slider 按 APG 走键，不交叉，区间内的柱子亮', async ({ page }) => {
  const area = await open(page, 'range-histogram-slider')
  const demo = area.locator('[data-gallery-range="controlled"]')
  const low = demo.getByRole('slider', { name: '涨跌幅下限' })
  const high = demo.getByRole('slider', { name: '涨跌幅上限' })
  await expect(low).toHaveAttribute('aria-valuenow', '-2')
  await expect(low).toHaveAttribute('aria-valuetext', '-2.0%')
  await low.focus()
  await page.keyboard.press('ArrowRight')
  await expect(low).toHaveAttribute('aria-valuenow', '-1.5')
  await page.keyboard.press('PageUp')
  await expect(low).toHaveAttribute('aria-valuenow', '3')
  // 下限顶到上限就停，不交叉。
  await page.keyboard.press('End')
  await expect(low).toHaveAttribute('aria-valuenow', '3')
  await expect(high).toHaveAttribute('aria-valuemin', '3')
  await high.focus()
  await page.keyboard.press('End')
  await expect(high).toHaveAttribute('aria-valuenow', '10')
  await expect(demo.locator('output')).toContainText('3.0% 到 10.0%')
  const lit = await demo.locator('.k-range-hist-bar[data-in="true"]').count()
  expect(lit).toBeGreaterThan(0)
  expect(lit).toBeLessThan(40)
})
