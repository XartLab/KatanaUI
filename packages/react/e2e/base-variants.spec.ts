// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 基础件的三个变体（#104 第 3 条）：Input 的 caption / unit、ToggleGroup 的 fullWidth / split、Tabs 的 line，
// 以及下单面板改用它们之后买卖切换、开平切换、委托类型页签仍照旧。在文档站的页上真点真按。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('Input：标签点一下聚焦输入框，单位在值右边，无效与禁用画在外框', async ({ page }) => {
  const area = await open(page, 'input')
  const box = area.locator('[data-gallery-boxed] [data-slot="input-box"]')
  const input = area.getByRole('textbox', { name: '委托价' })
  await box.getByText('委托价', { exact: true }).click()
  await expect(input).toBeFocused()
  await input.fill('61200')
  await expect(input).toHaveValue('61200')
  // 单位在输入框右边，值靠右（输入框的 text-align 是 right）。
  const [inputBox, unitBox] = await Promise.all([input.boundingBox(), box.getByText('USDT').boundingBox()])
  expect(unitBox!.x).toBeGreaterThanOrEqual(inputBox!.x + inputBox!.width - 1)
  await expect(input).toHaveCSS('text-align', 'right')
  // 外框有边有底，里面的输入框没有。
  await expect(input).toHaveCSS('border-top-width', '0px')
  await expect(box).toHaveCSS('border-top-width', '1px')
  // 无效：外框边变危险色；禁用：整框 45% 透明、不能输入。
  const invalid = area.locator('[data-slot="input-box"]').getByRole('textbox', { name: '止损触发价' })
  await expect(invalid).toHaveAttribute('aria-invalid', 'true')
  const normalBorder = await box.evaluate((el) => getComputedStyle(el).borderTopColor)
  const invalidBorder = await invalid.locator('..').evaluate((el) => getComputedStyle(el).borderTopColor)
  expect(invalidBorder).not.toBe(normalBorder)
  const disabled = area.locator('[data-slot="input-box"]').getByRole('textbox', { name: '委托量' })
  await expect(disabled).toBeDisabled()
  await expect(disabled.locator('..')).toHaveCSS('opacity', '0.45')
})

test('ToggleGroup fullWidth：整组撑满、两项等分；点另一项只选那一项', async ({ page }) => {
  const area = await open(page, 'toggle-group')
  const host = area.locator('[data-gallery-full]')
  const group = host.getByRole('group', { name: '开仓或平仓（整宽）' })
  const items = group.getByRole('button')
  const [groupBox, a, b] = await Promise.all([
    group.boundingBox(),
    items.nth(0).boundingBox(),
    items.nth(1).boundingBox(),
  ])
  expect(groupBox!.width).toBeCloseTo(320, 0)
  expect(Math.abs(a!.width - b!.width)).toBeLessThan(1)
  expect(a!.width + b!.width).toBeGreaterThanOrEqual(groupBox!.width - 12)
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true')
  await items.nth(1).click()
  await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'false')
  // 点已选中的项不会取消。
  await items.nth(1).click()
  await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true')
})

test('ToggleGroup split + tone：选中项整格填涨跌色，换项后颜色跟着换', async ({ page }) => {
  const area = await open(page, 'toggle-group')
  const group = area.locator('[data-gallery-split]').getByRole('group', { name: '买卖方向' })
  const buy = group.getByRole('button', { name: '买入' })
  const sell = group.getByRole('button', { name: '卖出' })
  const fill = (locator: typeof buy) => locator.evaluate((el) => getComputedStyle(el).backgroundColor)
  const clear = 'rgba(0, 0, 0, 0)'
  await expect(buy).toHaveAttribute('aria-pressed', 'true')
  const buyFill = await fill(buy)
  expect(buyFill).not.toBe(clear)
  expect(await fill(sell)).toBe(clear)
  await sell.click()
  await expect(sell).toHaveAttribute('aria-pressed', 'true')
  // 底色有 120ms 的过渡，轮询到不再透明。
  await expect.poll(() => fill(sell)).not.toBe(clear)
  const sellFill = await fill(sell)
  expect(sellFill).not.toBe(buyFill)
  await expect.poll(() => fill(buy)).toBe(clear)
  // 没有共用的容器底与边，项自带边。
  await expect(group).toHaveCSS('border-top-width', '0px')
})

test('Tabs line：文字页签没有药丸底块，当前项下划线随点击换到另一项', async ({ page }) => {
  const area = await open(page, 'tabs')
  const tabs = area.locator('[data-gallery-line]')
  await expect(tabs.locator('[data-slot="tabs-pill"]')).toHaveCount(0)
  const underline = (name: string) =>
    tabs.getByRole('tab', { name }).evaluate((el) => getComputedStyle(el, '::after').opacity)
  expect(await underline('日线')).toBe('1')
  expect(await underline('周线')).toBe('0')
  await tabs.getByRole('tab', { name: '周线' }).click()
  await expect(tabs.getByRole('tab', { name: '周线' })).toHaveAttribute('data-selected', '')
  await expect.poll(() => underline('周线')).toBe('1')
  expect(await underline('日线')).toBe('0')
  await expect(tabs.getByText('周线的内容')).toBeVisible()
})

test('下单面板改用基础件之后：开平切换整宽、买卖切换填色、委托类型页签下划线、数字框带单位', async ({ page }) => {
  const area = await open(page, 'order-ticket')
  const ticket = area.locator('[data-slot="order-ticket"]').first()
  // 压窄让买卖切换出现（宽版里它被容器查询藏起来）。
  await ticket.evaluate((el) => {
    el.style.width = '400px'
  })
  const action = ticket.locator('[data-slot="ticket-action"]')
  const [ticketBox, actionBox] = await Promise.all([ticket.boundingBox(), action.boundingBox()])
  expect(actionBox!.width).toBeGreaterThan(ticketBox!.width - 30)
  const side = ticket.locator('[data-slot="ticket-side"]')
  await expect(side.locator('[data-side="buy"]')).toHaveAttribute('aria-pressed', 'true')
  await side.locator('[data-side="sell"]').click()
  await expect(side.locator('[data-side="sell"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(side.locator('[data-side="buy"]')).toHaveAttribute('aria-pressed', 'false')
  await expect
    .poll(() => side.locator('[data-side="sell"]').evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe('rgba(0, 0, 0, 0)')
  const type = ticket.locator('[data-slot="ticket-type"]')
  await expect(type).toHaveAttribute('data-variant', 'line')
  await type.getByRole('tab', { name: 'Market' }).click()
  await expect(type.getByRole('tab', { name: 'Market' })).toHaveAttribute('aria-selected', 'true')
  // 数字框：标签、值、单位同在一个外框里。
  const field = ticket.locator('[data-slot="input-box"]').first()
  await expect(field.locator('input')).toHaveCSS('text-align', 'right')
})
