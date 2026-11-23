// SPDX-License-Identifier: MIT
// 功能地图 features/order-ticket.md：两栏算数、改杠杆、超可用报错、止盈止损模板、按风险算张数、下单与平仓。
// 演示数据（gallery/usage/OrderTicketUsage.tsx）：一张 0.01 BTC，最新价 60000，可用 250 USDT，默认 100 倍、成本 10。
export default {
  title: 'OrderTicket 下单面板：算数、报错、止盈止损、下单',
  page: 'order-ticket',
  async run({ page, section, step, expect, aria }) {
    const ticket = section.locator('[data-slot="order-ticket"]').first()
    const buy = ticket.locator('[data-slot="ticket-form"][data-side="buy"]')
    const sell = ticket.locator('[data-slot="ticket-form"][data-side="sell"]')
    const slot = (form, name) => form.locator(`[data-slot="${name}"]`)
    const out = section.locator('output').first()
    const read = async (form) => ({
      size: (await slot(form, 'ticket-size').innerText()).replaceAll(/\s+/g, ' '),
      cost: (await slot(form, 'ticket-cost').innerText()).replaceAll(/\s+/g, ' '),
      submit: await slot(form, 'ticket-submit').innerText(),
    })

    await step('打开 order-ticket 页：买卖两栏并排，按默认 10 USDT、100 倍算好张数', async () => {
      await ticket.scrollIntoViewIfNeeded()
      await expect(buy).toBeVisible()
      await expect(sell).toBeVisible()
      await expect(slot(buy, 'ticket-size')).toContainText('1.51 Cont')
      await expect(slot(buy, 'ticket-cost')).toContainText('9.97 USDT')
      await expect(slot(buy, 'ticket-max')).toContainText('37.87 Cont')
      await aria(ticket, 'order-ticket-default.aria.yml')
      return { buy: await read(buy), sell: await read(sell) }
    })
    await step('杠杆改成 10：成本框不动，两栏张数都变成 0.16', async () => {
      await ticket.locator('[data-slot="ticket-leverage"]').fill('10')
      await expect(slot(buy, 'ticket-amount')).toHaveValue('10')
      await expect(slot(buy, 'ticket-size')).toContainText('0.16 Cont')
      await expect(slot(sell, 'ticket-size')).toContainText('0.16 Cont')
      const sizes = { buy: (await read(buy)).size, sell: (await read(sell)).size }
      await ticket.locator('[data-slot="ticket-leverage"]').fill('100')
      await expect(slot(buy, 'ticket-size')).toContainText('1.51 Cont')
      return { ...sizes, 改回100倍: (await read(buy)).size }
    })
    await step('买栏成本填 300（超过可用 250）：这一栏报错、下单钮禁用，卖栏不受影响', async () => {
      await slot(buy, 'ticket-amount').fill('300')
      await expect(slot(buy, 'ticket-issue')).toContainText('available balance')
      await expect(slot(buy, 'ticket-submit')).toBeDisabled()
      await expect(slot(sell, 'ticket-submit')).toBeEnabled()
      return {
        issue: await slot(buy, 'ticket-issue').innerText(),
        buyDisabled: await slot(buy, 'ticket-submit').isDisabled(),
        sellDisabled: await slot(sell, 'ticket-submit').isDisabled(),
      }
    })
    await step('改回 10，点 Open long：下面的回显写 open buy 1.51', async () => {
      await slot(buy, 'ticket-amount').fill('10')
      await expect(slot(buy, 'ticket-submit')).toBeEnabled()
      await slot(buy, 'ticket-submit').click()
      await expect(out).toContainText('open buy 1.51')
      return { output: await out.innerText() }
    })
    await step('卖栏勾止盈止损、选 Scalp 模板：止盈 59400（下）、止损 60300（上）', async () => {
      await sell.getByRole('checkbox').click()
      await sell.getByRole('combobox', { name: 'Exit template' }).click()
      await page.getByRole('option', { name: /Scalp/ }).click()
      await expect(slot(sell, 'ticket-take-profit')).toHaveValue('59400.0')
      await expect(slot(sell, 'ticket-stop-loss')).toHaveValue('60300.0')
      return {
        takeProfit: await slot(sell, 'ticket-take-profit').inputValue(),
        stopLoss: await slot(sell, 'ticket-stop-loss').inputValue(),
      }
    })
    await step('按风险算：风险 50，止损填到盈利一侧报错；填对后 13.88 张，下单', async () => {
      await sell.getByRole('combobox', { name: 'Size by' }).click()
      await page.getByRole('option', { name: 'Risk' }).click()
      await slot(sell, 'ticket-amount').fill('50')
      await slot(sell, 'ticket-stop-loss').fill('59000')
      await expect(slot(sell, 'ticket-issue')).toContainText('profit side')
      const wrongSide = await slot(sell, 'ticket-issue').innerText()
      await slot(sell, 'ticket-stop-loss').fill('60300')
      await expect(slot(sell, 'ticket-size')).toContainText('13.88 Cont')
      await slot(sell, 'ticket-submit').click()
      await expect(out).toContainText('open sell 13.88')
      return { wrongSide, size: (await read(sell)).size, output: await out.innerText() }
    })
    await step('切到 Close：钮变成 Close short，不显示保证金；平 2 张', async () => {
      await ticket.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(slot(buy, 'ticket-submit')).toHaveText('Close short')
      await expect(slot(buy, 'ticket-margin')).toHaveCount(0)
      await slot(buy, 'ticket-amount').fill('2')
      await slot(buy, 'ticket-submit').click()
      await expect(out).toContainText('close buy 2')
      return { submit: await slot(buy, 'ticket-submit').innerText(), output: await out.innerText() }
    })
  },
}
