// SPDX-License-Identifier: MIT
// #150 技术评级三联（rating-panel）与品种备注（symbol-note）：只量用户看得见的——切周期、悬停与聚焦出读数、窄栏换行；
// 备注的悬停预览、点开钉住、编辑保存、Esc 与点外面收起、点图标不选中行、浮层贴在图标右侧。
import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 1100, height: 900 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
}
const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity))

test('RatingPanel：切周期换数，悬停与 Tab 出读数，窄栏汇总独占一行', async ({ page }) => {
  await open(page, 'rating-panel')
  const panel = page.locator('[data-gallery-rating-panel]')
  const summary = panel.locator('[data-gauge="summary"]')
  await expect(panel.locator('[role="meter"]')).toHaveCount(3)
  await expect(summary).toHaveClass(/is-primary/)
  // 演示数据 1D：汇总 卖 2、中性 5、买 19 → (19 − 2) / 26 = +0.65，强烈买入。
  await expect(summary).toHaveAttribute('aria-valuetext', '强烈买入, +0.65; 卖出 2, 中性 5, 买入 19')

  await panel.getByRole('button', { name: '1m', exact: true }).click()
  await expect(page.getByTestId('rating-panel-frame')).toHaveText('1m')
  await expect(summary).toHaveAttribute('aria-valuetext', '强烈卖出, -0.58; 卖出 18, 中性 5, 买入 3')

  const readout = '[data-gallery-rating-panel] [data-gauge="summary"] [data-slot="rating-panel-readout"]'
  await expect.poll(() => opacity(page, readout)).toBe(0)
  await summary.hover()
  await expect.poll(() => opacity(page, readout)).toBe(1)
  await expect(page.locator(readout)).toHaveText('-0.58强烈卖出')
  await page.mouse.move(0, 0)
  await expect.poll(() => opacity(page, readout)).toBe(0)

  // 键盘：Tab 到摆动指标，它出读数。
  const oscReadout = '[data-gallery-rating-panel] [data-gauge="oscillators"] [data-slot="rating-panel-readout"]'
  await panel.locator('[data-gauge="oscillators"]').focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(panel.locator('[data-gauge="oscillators"]')).toBeFocused()
  await expect.poll(() => opacity(page, oscReadout)).toBe(1)

  // 窄栏 280px：汇总在上面独占一行，另两个并排在下。
  const narrow = page.locator('[data-gallery-rating-panel-narrow]')
  const box = async (key: string) => (await narrow.locator(`[data-gauge="${key}"]`).boundingBox())!
  const [osc, sum, ma] = [await box('oscillators'), await box('summary'), await box('ma')]
  expect(sum.y + sum.height).toBeLessThanOrEqual(osc.y + 1)
  expect(Math.abs(osc.y - ma.y)).toBeLessThan(1)
})

test.describe('SymbolNote', () => {
  const row = (page: Page, symbol: string) => page.locator(`[data-gallery-note-row="${symbol}"]`)
  const trigger = (page: Page, symbol: string) => row(page, symbol).locator('[data-slot="symbol-note-trigger"]')
  const popup = (page: Page, symbol: string) => row(page, symbol).locator('[data-slot="symbol-note-popup"]')
  const isOpen = (page: Page, symbol: string) => popup(page, symbol).evaluate((el) => el.matches(':popover-open'))

  test('悬停出全文、可以移进浮层、移开收起；浮层贴在图标右侧，不盖住下一行的图标', async ({ page }) => {
    await open(page, 'symbol-note')
    await trigger(page, 'AAPL').hover()
    await expect.poll(() => isOpen(page, 'AAPL')).toBe(true)
    await expect(popup(page, 'AAPL').locator('[data-slot="symbol-note-text"]')).toHaveText(
      '财报 11-28 盘后。\n守 220 不破就拿着，破了减半。',
    )
    const t = (await trigger(page, 'AAPL').boundingBox())!
    const p = (await popup(page, 'AAPL').boundingBox())!
    expect(p.x - (t.x + t.width)).toBeGreaterThanOrEqual(4)
    expect(p.x - (t.x + t.width)).toBeLessThan(10)
    expect(Math.abs(p.y - t.y)).toBeLessThan(2)
    // 下一行的图标没被盖住：指针能直接挪过去。
    const next = (await trigger(page, 'BTCUSDT').boundingBox())!
    expect(next.x + next.width).toBeLessThanOrEqual(p.x)
    // 指针挪进浮层不收；挪到页面空白处收起。
    await popup(page, 'AAPL').hover()
    await page.waitForTimeout(300)
    expect(await isOpen(page, 'AAPL')).toBe(true)
    await page.mouse.move(1000, 850)
    await expect.poll(() => isOpen(page, 'AAPL')).toBe(false)
    await expect(trigger(page, 'AAPL')).toHaveAttribute('aria-expanded', 'false')
  })

  test('点图标钉住且不选中行；编辑、Ctrl+Enter 保存交给调用方；Esc 收起焦点回图标', async ({ page }) => {
    await open(page, 'symbol-note')
    await trigger(page, 'BTCUSDT').click()
    await expect.poll(() => isOpen(page, 'BTCUSDT')).toBe(true)
    await expect(trigger(page, 'BTCUSDT')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('symbol-note-selected')).toHaveText('AAPL')
    // 钉住后移开指针不收。
    await page.mouse.move(1000, 850)
    await page.waitForTimeout(300)
    expect(await isOpen(page, 'BTCUSDT')).toBe(true)

    await popup(page, 'BTCUSDT').getByRole('button', { name: '编辑' }).click()
    const field = popup(page, 'BTCUSDT').getByRole('textbox', { name: '备注' })
    await expect(field).toBeFocused()
    await expect(field).toHaveValue('等回踩 95k 再看，别追。')
    await page.keyboard.type(' 跌破 90k 止损。')
    // 在编辑框里打空格不会冒泡到行（行没被选中）。
    await expect(page.getByTestId('symbol-note-selected')).toHaveText('AAPL')
    await page.keyboard.press('Control+Enter')
    await expect(page.getByTestId('symbol-note-saved')).toHaveText('BTCUSDT：等回踩 95k 再看，别追。 跌破 90k 止损。')
    await expect(popup(page, 'BTCUSDT').locator('[data-slot="symbol-note-text"]')).toHaveText(
      '等回踩 95k 再看，别追。 跌破 90k 止损。',
    )
    await expect(popup(page, 'BTCUSDT').getByRole('button', { name: '编辑' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect.poll(() => isOpen(page, 'BTCUSDT')).toBe(false)
    await expect(trigger(page, 'BTCUSDT')).toBeFocused()
  })

  test('没有备注：加号只在行悬停时出现，点开直接编辑；Esc 放弃草稿；点外面收起不保存', async ({ page }) => {
    await open(page, 'symbol-note')
    await page.mouse.move(1000, 850)
    const plus = trigger(page, 'NVDA')
    await expect(plus).toHaveAttribute('aria-label', '添加备注')
    await expect.poll(() => plus.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0)
    await row(page, 'NVDA').hover()
    await expect.poll(() => plus.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.9)

    await plus.click()
    const field = popup(page, 'NVDA').getByRole('textbox', { name: '备注' })
    await expect(field).toBeFocused()
    await page.keyboard.type('先观望')
    await page.keyboard.press('Escape')
    await expect.poll(() => isOpen(page, 'NVDA')).toBe(false)
    await expect(page.getByTestId('symbol-note-saved')).toHaveText('—')
    await expect(plus).toBeFocused()

    await plus.click()
    await page.keyboard.type('先观望')
    await page.mouse.click(1000, 850)
    await expect.poll(() => isOpen(page, 'NVDA')).toBe(false)
    await expect(page.getByTestId('symbol-note-saved')).toHaveText('—')

    await plus.click()
    await page.keyboard.type('  财报前不加仓  ')
    await popup(page, 'NVDA').getByRole('button', { name: '保存' }).click()
    await expect(page.getByTestId('symbol-note-saved')).toHaveText('NVDA：财报前不加仓')
    await expect(trigger(page, 'NVDA')).toHaveAttribute('aria-label', '备注')
  })

  test('只读：没有编辑按钮；键盘 Tab 到图标出预览，Esc 收起', async ({ page }) => {
    await open(page, 'symbol-note')
    const readonly = page.locator('[data-gallery-note-readonly]')
    const icon = readonly.locator('[data-slot="symbol-note-trigger"]')
    const pop = readonly.locator('[data-slot="symbol-note-popup"]')
    await icon.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(icon).toBeFocused()
    await expect.poll(() => pop.evaluate((el) => el.matches(':popover-open'))).toBe(true)
    await expect(pop.getByRole('button', { name: '编辑' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect.poll(() => pop.evaluate((el) => el.matches(':popover-open'))).toBe(false)
    await expect(icon).toBeFocused()
  })
})
