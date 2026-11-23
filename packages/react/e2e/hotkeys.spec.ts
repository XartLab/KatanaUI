// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// 快捷键注册表、快捷键总览、命令面板「最近」（#77 G9）：在文档站 hotkeys、shortcut-sheet、command-palette 三页上真按键。
// #87：总览的分节默认收起、搜索时命中的节展开；目录搜索的 Mod+K 走注册表，演示页上命令面板用 Mod+K 盖过它。
// Playwright 的 Chromium 跑在 Linux 上，Mod 是 Ctrl。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
  return page.locator(`[data-gallery="${id}"]`)
}

test('hotkeys：Alt+R 触发、输入框里不触发；Ctrl+/ 开总览，分节收起、冲突标出、可搜、关掉作用域变灰', async ({
  page,
}) => {
  const area = await open(page, 'hotkeys')
  const log = area.getByTestId('hotkey-log')
  await expect(log).toHaveText('最近触发：无')
  await area.getByRole('textbox', { name: '试着在这里按 Alt+R' }).focus()
  await page.keyboard.press('Alt+R')
  await expect(log).toHaveText('最近触发：无')
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Alt+R')
  await expect(log).toHaveText('最近触发：重置图表')

  await page.keyboard.press('Control+/')
  const dialog = page.getByRole('dialog', { name: '键盘快捷键' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: '图表' })).toBeVisible()
  // 分节默认收起（照 TradingView）：先没有行，点节名展开
  await expect(dialog.locator('[data-shortcut]')).toHaveCount(0)
  const chart = dialog.getByRole('button', { name: '图表', exact: true })
  await expect(chart).toHaveAttribute('aria-expanded', 'false')
  await chart.click()
  await expect(chart).toHaveAttribute('aria-expanded', 'true')
  await expect(dialog.locator('[data-shortcut="chart-alert"]')).toContainText('与「画线工具」冲突')
  await expect(dialog.locator('[data-shortcut="chart-drawing"]')).toHaveAttribute('data-conflict', '')
  // 搜索：命中的节自动展开（自选表的「插旗」原本收着）
  await dialog.getByRole('searchbox', { name: '查找快捷键' }).fill('插旗')
  await expect(dialog.locator('[data-shortcut]')).toHaveCount(1)
  await expect(dialog.locator('[data-shortcut="watch-flag"]')).toBeVisible()
  await dialog.getByRole('searchbox', { name: '查找快捷键' }).fill('截图')
  await expect(dialog.locator('[data-shortcut]')).toHaveCount(1)
  await dialog.getByRole('searchbox', { name: '查找快捷键' }).fill('')
  // 清空搜索回到用户展开过的样子：只有图表开着
  await expect(dialog.locator('[data-shortcut="watch-flag"]')).toHaveCount(0)
  await expect(dialog.locator('[data-shortcut="chart-reset"]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await area.getByRole('switch', { name: '自选表作用域' }).click()
  await page.keyboard.press('Control+/')
  await dialog.getByRole('button', { name: '自选表', exact: true }).click()
  await expect(dialog.locator('[data-shortcut="watch-flag"]')).toHaveAttribute('data-disabled', '')
})

test('command-palette：Ctrl+K 打开（盖过文档站目录的搜索），执行一条后它进「最近」，刷新后还在', async ({ page }) => {
  const area = await open(page, 'command-palette')
  await page.evaluate(() => localStorage.removeItem('katana-ui-gallery:command-recent'))
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+K')
  const palette = page.getByRole('dialog', { name: '命令面板' })
  await expect(palette).toBeVisible()
  // 目录搜索没接到这一下
  await expect(page.getByRole('searchbox', { name: '搜索组件与文档' })).not.toBeFocused()
  await expect(palette.getByRole('group', { name: '最近' })).toHaveCount(0)
  await page.keyboard.type('主题')
  await page.keyboard.press('Enter')
  await expect(palette).toBeHidden()
  await expect(area.getByTestId('palette-log')).toContainText('执行了：切换主题')

  await page.reload()
  await page.locator('[data-gallery="command-palette"]').waitFor()
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+K')
  const recent = palette.getByRole('group', { name: '最近' })
  await expect(recent.getByRole('option')).toHaveText(['切换主题'])
  // 一输入，最近就不出，同一条不会出现两次
  await page.keyboard.type('主题')
  await expect(palette.getByRole('option', { name: '切换主题' })).toHaveCount(1)
})

test('文档站目录：Ctrl+K 聚焦搜索（经注册表），Ctrl+Shift+K 不拦', async ({ page }) => {
  await open(page, 'button')
  const search = page.getByRole('searchbox', { name: '搜索组件与文档' })
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  const prevented = await page.evaluate(() => {
    const seen: boolean[] = []
    window.addEventListener('keydown', (event) => seen.push(event.defaultPrevented), { once: true })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', code: 'KeyK', ctrlKey: true, shiftKey: true }))
    return seen[0]
  })
  expect(prevented).toBe(false)
  await expect(search).not.toBeFocused()
  await page.keyboard.press('Control+K')
  await expect(search).toBeFocused()
})

test('shortcut-sheet：打开改键后录一个新组合，占用的组合提示冲突不写入', async ({ page }) => {
  const area = await open(page, 'shortcut-sheet')
  const sheet = area.getByTestId('sheet-inline')
  await area.getByRole('switch', { name: '改键' }).click()
  await sheet.getByRole('button', { name: '图表', exact: true }).click()
  const reset = sheet.getByRole('button', { name: '重置图表' })
  await reset.click()
  await page.keyboard.press('Alt+A')
  await expect(sheet.locator('[data-shortcut="chart-reset"]')).toContainText('已被')
  await page.keyboard.press('Alt+X')
  await expect(sheet.locator('[data-shortcut="chart-reset"] .k-rec-field')).toContainText('X')
  // 新键真的生效：页上按 Alt+X 不报错、旧的 Alt+R 不再属于重置图表
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await expect(sheet.locator('[data-shortcut="chart-reset"] .k-rec-field')).not.toContainText('R')
})

// 命令面板的多步命令与行内说明（#194）：「批量导出」带「2 步」徽标，选中后面板不关、进步骤页。
const openStepsPalette = async (page: Page) => {
  const area = await open(page, 'command-palette')
  await page.evaluate(() => localStorage.removeItem('katana-ui-gallery:command-recent'))
  const trigger = area.getByRole('button', { name: /命令面板/ })
  await trigger.click()
  const palette = page.getByRole('dialog', { name: '命令面板' })
  await expect(palette).toBeVisible()
  return { area, trigger, palette }
}
const enterBatchExport = async (page: Page, palette: ReturnType<Page['getByRole']>) => {
  const row = palette.getByRole('option', { name: /批量导出/ })
  for (let i = 0; i < 20 && (await row.getAttribute('aria-selected')) !== 'true'; i += 1) {
    await page.keyboard.press('ArrowDown')
  }
  await expect(row).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Enter')
}

test('command-palette：行带说明与「2 步」徽标，↑↓ Enter 选它进步骤页，面板不关', async ({ page }) => {
  const { palette } = await openStepsPalette(page)
  const row = palette.getByRole('option', { name: /批量导出/ })
  await expect(row).toContainText('按市场与字段导出')
  await expect(row.locator('[data-slot="command-meta"]')).toHaveText('2 步')
  await expect(palette.getByRole('option', { name: /重置图表/ })).toContainText('回到默认缩放与指标')
  await enterBatchExport(page, palette)
  await expect(palette).toBeVisible()
  await expect(palette.locator('[data-slot="command-steps"]')).toHaveAttribute('data-step', 'market')
  await expect(palette.getByRole('group', { name: '选择市场' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '搜索命令…' })).toBeFocused()
})

test('command-palette：勾选写进头部句子与脚栏，全选三态，Backspace 退回命令列表并清空选择', async ({ page }) => {
  const { palette } = await openStepsPalette(page)
  await enterBatchExport(page, palette)
  const tags = palette.locator('[data-slot="command-steps-tag"]')
  const count = palette.locator('[data-slot="command-steps-count"]')
  const all = palette.getByRole('checkbox', { name: '全选' })
  const primary = palette.getByRole('button', { name: '下一步' })
  await expect(count).toHaveText('已选 0 项')
  await expect(all).toHaveAttribute('aria-checked', 'false')
  await expect(primary).toBeDisabled()

  await palette.getByRole('checkbox', { name: /^美股/ }).click()
  await palette.getByRole('checkbox', { name: /^港股/ }).click()
  await expect(tags).toHaveText(['美股', '港股'])
  await expect(count).toHaveText('已选 2 项')
  await expect(all).toHaveAttribute('aria-checked', 'mixed')
  await expect(primary).toBeEnabled()
  // cmdk 的 aria-selected 是高亮，这一页的「已选」只用 aria-checked
  await expect(palette.getByRole('checkbox', { name: /^美股/ })).toHaveAttribute('aria-checked', 'true')

  await all.click()
  await expect(all).toHaveAttribute('aria-checked', 'true')
  await expect(palette.locator('[role="checkbox"][aria-checked="true"]')).toHaveCount(5)
  await expect(count).toHaveText('已选 4 项')
  await all.click()
  await expect(all).toHaveAttribute('aria-checked', 'false')
  await expect(count).toHaveText('已选 0 项')
  await expect(primary).toBeDisabled()

  await palette.getByRole('checkbox', { name: /^美股/ }).click()
  // 输入框为空时 Backspace 退回命令列表，选择清空
  await page.keyboard.press('Backspace')
  await expect(palette.locator('[data-slot="command-steps"]')).toHaveCount(0)
  await expect(palette.getByRole('option', { name: /批量导出/ })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '命令面板' })).toBeFocused()
  await enterBatchExport(page, palette)
  await expect(count).toHaveText('已选 0 项')
  await expect(tags).toHaveCount(0)
})

test('command-palette：筛选框过滤当前步，键盘 ↑↓ 与 Enter 勾选，Mod+Enter 走主操作', async ({ page }) => {
  const { palette } = await openStepsPalette(page)
  await enterBatchExport(page, palette)
  await page.keyboard.type('港')
  await expect(palette.getByRole('checkbox')).toHaveCount(2) // 全选 + 港股
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(palette.getByRole('checkbox', { name: /^港股/ })).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.type('zzz')
  await expect(palette.getByText('没有匹配的命令')).toBeVisible()
  // 有字时 Backspace 只删字，不退步
  await page.keyboard.press('Backspace')
  await expect(palette.locator('[data-slot="command-steps"]')).toHaveCount(1)
  await page.keyboard.press('Control+Enter')
  await expect(palette.locator('[data-slot="command-steps"]')).toHaveAttribute('data-step', 'fields')
})

test('command-palette：走完两步，onRun 收到各步的选择，面板关、焦点回触发处；Esc 直接关面板', async ({ page }) => {
  const { area, trigger, palette } = await openStepsPalette(page)
  await enterBatchExport(page, palette)
  await palette.getByRole('checkbox', { name: /^美股/ }).click()
  await palette.getByRole('checkbox', { name: /^港股/ }).click()
  await palette.getByRole('button', { name: '下一步' }).click()
  const step = palette.locator('[data-slot="command-steps"]')
  await expect(step).toHaveAttribute('data-step', 'fields')
  // 头部句子带着上一步的选择，当前步的写在后面
  const header = palette.locator('[data-slot="command-steps-header"]')
  await expect(header).toContainText('批量导出')
  await expect(header).toContainText('从')
  await expect(header.locator('[data-slot="command-steps-tag"]')).toHaveText(['美股', '港股'])
  await palette.getByRole('checkbox', { name: /^开高低收/ }).click()
  await expect(header.locator('[data-slot="command-steps-tag"]')).toHaveText(['美股', '港股', '开高低收'])
  // 返回：回第一步，第一步的选择还在，第二步的清掉
  await palette.getByRole('button', { name: '返回' }).click()
  await expect(step).toHaveAttribute('data-step', 'market')
  await expect(palette.getByRole('checkbox', { name: /^美股/ })).toHaveAttribute('aria-checked', 'true')
  await palette.getByRole('button', { name: '下一步' }).click()
  await expect(palette.getByRole('checkbox', { name: /^开高低收/ })).toHaveAttribute('aria-checked', 'false')
  await palette.getByRole('checkbox', { name: /^开高低收/ }).click()
  await palette.getByRole('checkbox', { name: /^成交量/ }).click()
  await palette.getByRole('button', { name: '导出' }).click()
  await expect(palette).toBeHidden()
  await expect(area.getByTestId('palette-log')).toContainText('执行了：batch-export：market=us,hk · fields=ohlc,volume')
  await expect(trigger).toBeFocused()

  // 再开：从命令列表开始，「批量导出」进了最近；Esc 在步骤页里直接关面板
  await trigger.click()
  await expect(palette.getByRole('group', { name: '最近' }).getByRole('option')).toContainText(['批量导出'])
  await palette
    .getByRole('option', { name: /批量导出/ })
    .first()
    .click()
  await expect(step).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()
  await expect(trigger).toBeFocused()
})

for (const theme of ['graphite', 'console'] as const)
  test(`command-palette：命令列表与步骤页在 ${theme} 下 axe 无违规（半选、已选、禁用都在页上）`, async ({
    browser,
  }) => {
    // axe 要求页面来自 browser.newContext()。
    const context = await browser.newContext({ viewport: { width: 1100, height: 1500 } })
    const page = await context.newPage()
    await page.goto(`/?theme=${theme}#/command-palette`)
    await page.locator('[data-gallery="command-palette"]').waitFor()
    await page.getByRole('button', { name: /命令面板/ }).click()
    const palette = page.getByRole('dialog', { name: '命令面板' })
    await expect(palette).toBeVisible()
    const scan = async () => {
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined))),
      )
      const result = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      return result.violations.flatMap((violation) =>
        violation.nodes.map((node) => `${violation.id} ${node.target.join(' >> ')}`),
      )
    }
    expect(await scan()).toEqual([])
    await page.keyboard.type('批量')
    await page.keyboard.press('Enter')
    await palette.getByRole('checkbox', { name: /^美股/ }).click()
    await expect(palette.getByRole('checkbox', { name: '全选' })).toHaveAttribute('aria-checked', 'mixed')
    expect(await scan()).toEqual([])
    await context.close()
  })
