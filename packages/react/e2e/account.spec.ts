// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 账户四件（#104）：在文档站各自的页上真点、真按键，断言用户看得见的结果。演示数据见 gallery/usage/ 各文件。

test.use({ viewport: { width: 1200, height: 1400 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('PositionsTable：强平距离过阈值出警示（图标、档位），改阈值跟着变；平仓回调', async ({ page }) => {
  const area = await open(page, 'positions-table')
  const table = area.locator('[data-slot="positions-table"]').first()
  // 默认阈值 10%：BTC 18.6% 安全，ETH 空头 7.3% 警告，SOL 3.5% 危险。
  await expect(table.locator('[data-position="btc-long"]')).toHaveAttribute('data-risk', 'safe')
  await expect(table.locator('[data-position="eth-short"]')).toHaveAttribute('data-risk', 'warn')
  await expect(table.locator('[data-position="sol-long"]')).toHaveAttribute('data-risk', 'danger')
  await expect(table.locator('[data-position="eth-short"] [data-slot="position-distance"] svg')).toBeVisible()
  await expect(table.locator('[data-position="btc-long"] [data-slot="position-distance"] svg')).toHaveCount(0)
  // 阈值调到 5%：ETH 变安全，SOL 变警告。
  await area.getByRole('button', { name: '警示阈值 5%' }).click()
  await expect(table.locator('[data-position="eth-short"]')).toHaveAttribute('data-risk', 'safe')
  await expect(table.locator('[data-position="sol-long"]')).toHaveAttribute('data-risk', 'warn')
  await table.locator('[data-position="eth-short"] button[data-action="close"]').click()
  await expect(area.getByTestId('pos-last')).toContainText('平仓 ETHUSDT')
  await table.locator('[data-position="btc-long"] button[data-action="tpsl"]').click()
  await expect(area.getByTestId('pos-last')).toContainText('止盈止损 BTCUSDT')
})

test('OrdersTable：改价回车回调收到新价，Esc 取消不回调；撤单与全部撤单回调', async ({ page }) => {
  const area = await open(page, 'orders-table')
  const table = area.locator('[data-slot="orders-table"]').first()
  const row = table.locator('[data-order="o-1001"]')
  await row.locator('button[data-action="amend"]').click()
  const input = row.getByRole('textbox')
  await expect(input).toBeFocused()
  await input.fill('63900')
  await input.press('Escape')
  await expect(row.getByRole('textbox')).toHaveCount(0)
  await expect(area.getByTestId('ord-last')).not.toContainText('改价')
  await row.locator('button[data-action="amend"]').click()
  await row.getByRole('textbox').fill('63,900.5')
  await row.getByRole('textbox').press('Enter')
  await expect(area.getByTestId('ord-last')).toContainText('改价 o-1001 → 63900.5')
  await expect(row.getByRole('textbox')).toHaveCount(0)
  // 非法价格留在框里，不回调。
  await row.locator('button[data-action="amend"]').click()
  await row.getByRole('textbox').fill('abc')
  await row.getByRole('textbox').press('Enter')
  await expect(row.getByRole('textbox')).toBeVisible()
  await expect(area.getByTestId('ord-last')).toContainText('改价 o-1001 → 63900.5')
  await row.getByRole('textbox').press('Escape')
  await table.locator('[data-order="o-1002"] button[data-action="cancel"]').click()
  await expect(area.getByTestId('ord-last')).toContainText('撤单 o-1002')
  await table.locator('button[data-action="cancel-all"]').click()
  await expect(area.getByTestId('ord-last')).toContainText('全部撤单')
})

test('AccountEquity：三档风险条按阈值落档，档位有文字', async ({ page }) => {
  const area = await open(page, 'account-equity')
  const levels = ['safe', 'warn', 'danger'] as const
  for (const level of levels) {
    const card = area.getByTestId(`equity-${level}`)
    await expect(card.locator('[data-slot="account-equity"]')).toBeVisible()
    await expect(card.locator('[data-level]').first()).toHaveAttribute('data-level', level)
  }
})

test('FundingRate：倒计时每秒走一格；传了 now 就不走', async ({ page }) => {
  const area = await open(page, 'funding-rate')
  const live = area.getByTestId('funding-live').locator('[data-slot="funding-countdown"]')
  const first = await live.innerText()
  await expect.poll(async () => live.innerText(), { timeout: 4000 }).not.toBe(first)
  const fixed = area.getByTestId('funding-fixed').locator('[data-slot="funding-countdown"]')
  await expect(fixed).toContainText('02:13:07')
  await page.waitForTimeout(1500)
  await expect(fixed).toContainText('02:13:07')
})

test('OptionsChain：平值行高亮，点格回调带行权价、方向与字段', async ({ page }) => {
  const area = await open(page, 'options-chain')
  const chain = area.locator('[data-slot="options-chain"]').first()
  await expect(chain.locator('[data-strike][data-atm="true"]')).toHaveCount(1)
  await expect(chain.locator('[data-strike][data-atm="true"]')).toContainText('平值')
  await expect(chain.locator('[data-itm="true"]').first()).toBeVisible()
  const atm = chain.locator('[data-strike][data-atm="true"]')
  const strike = await atm.getAttribute('data-strike')
  await atm.locator('[data-side="call"] [data-slot="option-quote"]').first().click()
  await expect(area.getByTestId('opt-picked')).toContainText(`${strike} 认购`)
  await atm.locator('[data-side="put"] [data-slot="option-quote"]').first().click()
  await expect(area.getByTestId('opt-picked')).toContainText(`${strike} 认沽`)
})

// 交易表最要紧的是盈亏与动作：容器 850 宽时这两列都在视野内、不出横向滚动；1200 宽时全部列都显示。
for (const [id, slot, cols] of [
  ['positions-table', 'positions-table', 10],
  ['orders-table', 'orders-table', 9],
] as const) {
  test(`${id}：窄容器先收次要列，动作与盈亏列不被藏；宽容器全显示`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1400 }) // 内容区要比 1200 宽，容器才有地方撑
    const area = await open(page, id)
    const table = area.locator(`[data-slot="${slot}"]`).first()
    const resize = (width: number) =>
      table.evaluate((el, w) => {
        ;(el as HTMLElement).style.width = `${w}px`
      }, width)
    await table.scrollIntoViewIfNeeded()
    await resize(850)
    const actions = table.locator('button[data-action="close"], button[data-action="cancel"]').first()
    await expect(actions).toBeInViewport({ ratio: 1 })
    if (id === 'positions-table') {
      await expect(table.locator('[data-slot="position-distance"]').first()).toBeInViewport()
    }
    const overflow = await table.evaluate((el) =>
      [...el.querySelectorAll('.k-grid-scroll')].map((node) => node.scrollWidth - node.clientWidth),
    )
    expect(Math.max(...overflow)).toBeLessThanOrEqual(0)
    // 1200 宽：全部列都在（没有「+N 列」胶囊）。文档站的内容区装不下 1200，所以只数表头，不看视野。
    await resize(1200)
    await expect(table.locator('[role="columnheader"]')).toHaveCount(cols)
    await expect(table.getByText(/^\+\d+ (cols|列)$/)).toHaveCount(0)
  })
}
