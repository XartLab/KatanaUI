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
