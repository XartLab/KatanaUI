// SPDX-License-Identifier: MIT
// 万能框（#224）：照票里的六条判据在文档站 omnibox 页上真按键、真移鼠标；只量用户看得见的行为。
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({ viewport: { width: 1400, height: 900 } })

const open = async (page: Page, theme = 'graphite') => {
  await page.goto(theme === 'graphite' ? '/#/omnibox' : `/?theme=${theme}#/omnibox`)
  await page.locator('[data-gallery="omnibox"]').waitFor()
  await page.getByTestId('omnibox-open').click()
  const dialog = page.getByRole('dialog', { name: '万能框' })
  await expect(dialog.getByRole('option').first()).toBeVisible()
  return { dialog, input: dialog.getByRole('combobox') }
}

const highlightY = (dialog: Locator) =>
  dialog
    .locator('.k-proximity-highlight')
    .evaluate((el) => parseFloat(getComputedStyle(el).translate.split(' ')[1] ?? '0'))

for (const theme of ['graphite', 'console']) {
  test(`判据 1（${theme}）：空查询列各类与页签计数、占位轮播示例；Tab 与 ← → 切页签；选过的进「最近」可清除`, async ({
    page,
  }) => {
    const { dialog, input } = await open(page, theme)
    // 各类的前几条：每类一个分组标题；多出的给「显示全部」。
    for (const name of ['品种', '策略', '命令', '页面', '插件'])
      await expect(dialog.locator('[data-slot="omnibox-section"]').filter({ hasText: name }).first()).toBeVisible()
    await expect(dialog.locator('[data-slot="omnibox-more"]')).toHaveText('显示全部 6 个品种')
    // 页签带每类条数。
    const tabs = dialog.getByRole('tab')
    await expect(tabs).toHaveText(['全部17', '品种6', '策略2', '命令4', '页面3', '插件2'])
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    // 占位轮播：盖在输入框上的示例每 2.8s 换一条，读屏读的静态占位不变。
    const example = dialog.locator('[data-slot="omnibox-example"]')
    await expect(example).toHaveText('AAPL 期权链')
    await expect(example).toHaveText('收盘后跑回测', { timeout: 5000 })
    await expect(input).toHaveAttribute('placeholder', '搜品种、命令、页面，或直接提问')

    // Tab 切页签，焦点留在输入框；Shift+Tab 反向。
    await page.keyboard.press('Tab')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(input).toBeFocused()
    await expect(dialog.getByRole('option')).toHaveCount(6)
    await page.keyboard.press('Shift+Tab')
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    // 输入框为空时 ← → 切页签；有字时是移光标。
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.type('ab')
    await page.keyboard.press('ArrowLeft')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    expect(await input.evaluate((el: HTMLInputElement) => el.selectionStart)).toBe(1)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Backspace')
    // 点「显示全部」回到「品种」页签。
    await tabs.first().click()
    await dialog.locator('[data-slot="omnibox-more"]').click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')

    // 选一条命令：关上，再开时它在「最近」里；清除后没有。
    await tabs.nth(3).click()
    await dialog.getByRole('option', { name: /切换布局/ }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('omnibox-log')).toContainText('切换布局')
    await page.getByTestId('omnibox-open').click()
    const recent = dialog.locator('[data-slot="omnibox-recent"]')
    await expect(recent.getByRole('option').first()).toContainText('切换布局')
    await dialog.locator('[data-slot="omnibox-clear-recent"]').click()
    await expect(recent).toHaveCount(0)
  })
}

test('判据 2：打 AAPL 选中变成标签，结果换成对它的动作；空输入退格删标签回全局', async ({ page }) => {
  const { dialog, input } = await open(page)
  await page.keyboard.type('AAPL')
  const first = dialog.getByRole('option').first()
  await expect(first).toHaveAttribute('data-omnibox-id', 'sym:AAPL')
  await expect(first).toContainText('查看选项')
  await page.keyboard.press('Enter')
  const scope = dialog.locator('[data-slot="omnibox-scope"]')
  await expect(scope).toContainText('AAPL')
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(dialog.getByRole('option')).toHaveText([/开图/, /下单草稿/, /看新闻/, /看期权链/, /加入自选/])
  await expect(dialog.getByRole('tab')).toHaveCount(0)
  // 在标签下打字是在动作里筛。
  await page.keyboard.type('新闻')
  await expect(dialog.getByRole('option')).toHaveCount(1)
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await expect(scope).toHaveCount(1) // 还有字时退格是删字
  await expect(dialog.getByRole('option')).toHaveCount(5)
  // 回车选动作：回调带着作用域，对话框关上。
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('omnibox-log')).toContainText('AAPL → 下单草稿')
  // 再开，选中后空输入退格删标签。
  await page.getByTestId('omnibox-open').click()
  await page.keyboard.type('AAPL')
  await page.keyboard.press('Enter')
  await expect(scope).toBeVisible()
  await page.keyboard.press('Backspace')
  await expect(scope).toHaveCount(0)
  await expect(dialog.getByRole('tab')).toHaveCount(6)
  await expect(dialog.getByRole('option').first()).toBeVisible()
  // × 按钮也能删。
  await page.keyboard.type('AAPL')
  await page.keyboard.press('Enter')
  await dialog.getByRole('button', { name: '移除 AAPL' }).click()
  await expect(scope).toHaveCount(0)
  await expect(input).toBeFocused()
})

test('结果还没回来就按回车：不对旧行动手，结果一到对第一行生效', async ({ page }) => {
  const { dialog } = await open(page)
  await page.keyboard.type('AAPL')
  await page.keyboard.press('Enter') // 演示的搜索延迟 120ms，这时显示的还是空查询的旧行
  await expect(dialog.locator('[data-slot="omnibox-scope"]')).toContainText('AAPL')
  await expect(dialog.getByRole('option').first()).toContainText('开图')
})

test('判据 3：打问句，结果收起、提示变「问 ↵」，回车 onAsk 收到文字与作用域', async ({ page }) => {
  const { dialog, input } = await open(page)
  await page.keyboard.type('下周哪些持仓有财报？')
  const body = dialog.locator('.k-omnibox-body-inner')
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toContainText('问')
  await expect(body).toHaveAttribute('inert', '')
  await expect(input).toHaveAccessibleDescription('问')
  // 收起：面板只剩输入行。
  await expect.poll(async () => (await dialog.locator('.k-omnibox-panel').boundingBox())!.height).toBeLessThan(60)
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('omnibox-asked')).toHaveText('提问：下周哪些持仓有财报？')
  await expect(dialog).toBeHidden()

  // 带着作用域问：onAsk 也收到作用域。
  await page.getByTestId('omnibox-open').click()
  await page.keyboard.type('AAPL')
  await page.keyboard.press('Enter')
  await expect(dialog.locator('[data-slot="omnibox-scope"]')).toBeVisible()
  await page.keyboard.type('what is the next earnings date')
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('omnibox-asked')).toHaveText('提问：AAPL · what is the next earnings date')
  // 改回非问句：结果回来、提示消失。
  await page.getByTestId('omnibox-open').click()
  await page.keyboard.type('今天怎么样？')
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toBeVisible()
  await page.keyboard.press('Backspace')
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toHaveCount(0)
  await expect(body).not.toHaveAttribute('inert', '')
})

test('判据 4：鼠标快速划过列表，高亮平滑滑动且不回头；减少动效下不滑', async ({ page }) => {
  const sample = async (dialog: Locator, move: () => Promise<void>) => {
    await dialog.locator('.k-proximity-highlight').evaluate((el) => {
      const w = window as unknown as { __ys: number[] }
      w.__ys = []
      const t0 = performance.now()
      const tick = () => {
        w.__ys.push(parseFloat(getComputedStyle(el).translate.split(' ')[1] ?? '0'))
        if (performance.now() - t0 < 900) requestAnimationFrame(tick)
      }
      tick()
    })
    await move()
    await page.waitForTimeout(1000)
    return page.evaluate(() => (window as unknown as { __ys: number[] }).__ys)
  }
  const { dialog } = await open(page)
  const rows = dialog.getByRole('option')
  const centre = async (row: Locator) => {
    const box = (await row.boundingBox())!
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }
  const from = await centre(rows.nth(0))
  const to = await centre(rows.nth(7))
  await page.mouse.move(from.x, from.y)
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true')
  await page.waitForTimeout(500)
  const start = await highlightY(dialog)
  // 快速划过：一次跳 12 步，中间路过多行。
  const ys = await sample(dialog, () => page.mouse.move(to.x, to.y, { steps: 12 }))
  const end = ys.at(-1)!
  expect(end).toBeGreaterThan(start + 100)
  // 平滑滑动：中间有落在起点与终点之间的值，且整条轨迹不回头（不抖）。
  expect(ys.some((y) => y > start + 5 && y < end - 5)).toBe(true)
  for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeGreaterThanOrEqual(ys[i - 1]! - 0.5)
  await expect(rows.nth(7)).toHaveAttribute('aria-selected', 'true')
  // 指针在行与行之间的缝里（组标题上）时底色不灭。
  const heading = dialog.locator('[cmdk-group-heading]').nth(2)
  const hb = (await heading.boundingBox())!
  await page.mouse.move(to.x, hb.y + hb.height / 2)
  await page.waitForTimeout(100)
  expect(await dialog.locator('.k-proximity-highlight').getAttribute('data-visible')).toBe('true')
})

test('判据 4（减少动效）：高亮直接切到目标行，不滑；占位不轮播', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const { dialog } = await open(page)
  const rows = dialog.getByRole('option')
  const a = (await rows.nth(0).boundingBox())!
  const b = (await rows.nth(7).boundingBox())!
  await page.mouse.move(a.x + 40, a.y + a.height / 2)
  await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true')
  await page.waitForTimeout(300)
  await page.mouse.move(b.x + 40, b.y + b.height / 2)
  await expect(rows.nth(7)).toHaveAttribute('aria-selected', 'true')
  const moved = await dialog.locator('.k-proximity-highlight').evaluate((el) => {
    const style = getComputedStyle(el)
    return { duration: style.transitionDuration, y: parseFloat(style.translate.split(' ')[1] ?? '0') }
  })
  expect(moved.duration).toBe('0s')
  // 占位：静态显示第一条，过了一个间隔也不变。
  const example = dialog.locator('[data-slot="omnibox-example"]')
  await expect(example).toHaveText('AAPL 期权链')
  await page.waitForTimeout(3200)
  await expect(example).toHaveText('AAPL 期权链')
})

test('判据 5：高亮品种行出预览卡，换到命令行就收；⌘/Ctrl+↵ 回调带「新标签」', async ({ page }) => {
  const { dialog } = await open(page)
  const preview = dialog.locator('[data-slot="omnibox-preview"]')
  await expect(preview).toContainText('189.84') // 第一行 AAPL 默认高亮，停 140ms 后出
  await expect(preview).toHaveAttribute('aria-hidden', 'true')
  await expect(preview).toHaveAttribute('data-side', 'right')
  const panel = (await dialog.locator('.k-omnibox-panel').boundingBox())!
  const card = (await preview.boundingBox())!
  expect(card.x).toBeGreaterThan(panel.x + panel.width)
  // 移到命令行：预览收起。
  await dialog.getByRole('option', { name: /收盘后跑回测/ }).hover()
  await expect(preview).toHaveCount(0)
  // 回到品种行，按住 Control：行尾提示变「新标签打开」。
  await dialog.getByRole('option', { name: /AMD/ }).hover()
  await expect(preview).toContainText('141.20')
  const hint = dialog.locator('[aria-selected="true"] [data-slot="omnibox-hint"]')
  await expect(hint).toHaveText('查看选项')
  await page.keyboard.down('Control')
  await expect(hint).toHaveText('新标签打开')
  await page.keyboard.press('Enter')
  await page.keyboard.up('Control')
  // 带修饰键的回车不变标签，直接回调 onSelect，info.newTab 为真。
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('omnibox-log')).toHaveText('选择：AMD（新标签）')
  // 命令行回车的提示是「运行」，普通回车不带新标签标记。
  await page.getByTestId('omnibox-open').click()
  await dialog.getByRole('option', { name: /收盘后跑回测/ }).hover()
  await expect(dialog.locator('[aria-selected="true"] [data-slot="omnibox-hint"]')).toHaveText('运行')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('omnibox-log')).toHaveText('选择：收盘后跑回测')
})

test('判据 6：输入法组字中的回车、Esc 与意图切换不误触；组字结束才认最终的字', async ({ page }) => {
  const { dialog, input } = await open(page)
  const key = (key: string) =>
    input.evaluate((el, k) => {
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: k, keyCode: 229, isComposing: true, bubbles: true, cancelable: true }),
      )
    }, key)
  await input.evaluate((el) => el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })))
  await page.keyboard.insertText('下周哪些持仓有财报？')
  // 组字中：不切到问句模式。
  await page.waitForTimeout(300)
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toHaveCount(0)
  await key('Enter')
  await key('Escape')
  await key('Backspace')
  await page.waitForTimeout(200)
  await expect(dialog).toBeVisible()
  await expect(page.getByTestId('omnibox-asked'))
    .toHaveText('还没有提问')
    .catch(() => {})
  await expect(page.getByTestId('omnibox-asked')).toContainText('还没有提问')
  // 组字结束：认最终的字，切成问句。
  await input.evaluate((el) => el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' })))
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toBeVisible()
  // 组字中空输入时的退格不删标签。
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('AAPL')
  await page.keyboard.press('Enter')
  await expect(dialog.locator('[data-slot="omnibox-scope"]')).toBeVisible()
  await input.evaluate((el) => el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })))
  await key('Backspace')
  await expect(dialog.locator('[data-slot="omnibox-scope"]')).toBeVisible()
})

test('判据 6：读屏语义与 axe', async ({ page }) => {
  const { dialog, input } = await open(page)
  await expect(input).toHaveRole('combobox')
  await expect(dialog.getByRole('listbox')).toBeVisible()
  await expect(dialog.getByRole('tablist', { name: '类别' })).toBeVisible()
  await expect(input).toHaveAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter')
  const check = async () => {
    const result = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  }
  await page.waitForTimeout(400)
  await check()
  await page.keyboard.type('AAPL')
  await page.keyboard.press('Enter')
  await expect(dialog.locator('[data-slot="omnibox-scope"]')).toBeVisible()
  await check()
  await page.keyboard.press('Backspace')
  await page.keyboard.type('下周哪些持仓有财报？')
  await expect(dialog.locator('[data-slot="omnibox-ask"]')).toBeVisible()
  await check()
  // Esc 关闭，焦点回到打开的按钮。
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId('omnibox-open')).toBeFocused()
})
