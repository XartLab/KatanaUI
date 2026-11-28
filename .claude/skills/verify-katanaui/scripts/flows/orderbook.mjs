// SPDX-License-Identifier: MIT
// 功能地图 features/orderbook.md：模式切换（买卖 / 只看买 / 只看卖）、按 tick 合并档位、点一行给回调、买卖占比相加恰好 100。
export default {
  title: '订单簿：模式、合并档位、点价与占比',
  page: 'order-book',
  async run({ page, section, step, expect, aria }) {
    const book = section.locator('[data-slot="order-book"]').first()
    const modeGroup = book.getByRole('group', { name: '显示模式' })
    const tickGroup = book.getByRole('group', { name: '合并档位' })
    const mode = (name) => modeGroup.getByRole('button', { name, exact: true })
    const rows = (side) => book.locator(`[role="list"][data-side="${side}"] [data-slot="book-row"]`)
    const share = book.locator('[data-slot="book-share"]')
    const shareBid = book.locator('[data-slot="book-share-bid"]')
    const shareAsk = book.locator('[data-slot="book-share-ask"]')
    const shareLabel = () => share.getAttribute('aria-label')
    // 占比两个数是一行里的两个 span：读 data-pct，加起来必须正好是 100。
    const pcts = async () => [Number(await shareBid.getAttribute('data-pct')), Number(await shareAsk.getAttribute('data-pct'))]
    const prices = async (side) => (await rows(side).evaluateAll((els) => els.map((el) => el.dataset.price ?? ''))).map(Number)
    // 档位越小越细：0.5 上每一行的价都必须是 0.5 的整数倍（浮点尾巴用 1e-6 吃掉）。
    const multiplesOf = (list, tick) => list.every((price) => Math.abs(price / tick - Math.round(price / tick)) < 1e-6)

    await step('打开订单簿页：买卖并列，数据暂停（自动化浏览器默认暂停）', async () => {
      await expect(book).toHaveAttribute('data-mode', 'both')
      const live = section.getByRole('group', { name: '数据刷新' })
      await expect(live.getByRole('button', { name: '暂停', exact: true })).toHaveAttribute('aria-pressed', 'true')
      expect((await prices('ask')).length).toBeGreaterThan(0)
      expect((await prices('bid')).length).toBeGreaterThan(0)
      const [bid, ask] = await pcts()
      expect(bid + ask).toBe(100)
      await aria(book, 'orderbook-both.aria.yml')
      return {
        askRows: (await prices('ask')).length,
        bidRows: (await prices('bid')).length,
        share: await shareLabel(),
        spread: (await book.locator('[data-slot="book-spread-value"]').innerText()).trim(),
      }
    })
    const shareInBoth = await shareLabel()

    await step('切「只看卖」：买盘收起、卖盘行数翻倍，占比不动', async () => {
      await mode('只看卖').click()
      await expect(book).toHaveAttribute('data-mode', 'asks')
      await expect(rows('bid')).toHaveCount(0)
      expect((await prices('ask')).length).toBe(16)
      expect(await shareLabel()).toBe(shareInBoth)
      return { askRows: (await prices('ask')).length, bidRows: await rows('bid').count(), share: await shareLabel() }
    })
    await step('切「只看买」：卖盘收起、买盘行数翻倍，占比仍不动', async () => {
      await mode('只看买').click()
      await expect(book).toHaveAttribute('data-mode', 'bids')
      await expect(rows('ask')).toHaveCount(0)
      expect((await prices('bid')).length).toBe(16)
      expect(await shareLabel()).toBe(shareInBoth)
      return { askRows: await rows('ask').count(), bidRows: (await prices('bid')).length, share: await shareLabel() }
    })
    await step('切回「买卖」：两侧都回来', async () => {
      await mode('买卖').click()
      await expect(book).toHaveAttribute('data-mode', 'both')
      expect((await prices('ask')).length).toBeGreaterThan(0)
      expect((await prices('bid')).length).toBeGreaterThan(0)
      return { askRows: (await prices('ask')).length, bidRows: (await prices('bid')).length }
    })

    await step('合并档位切到 0.5：每一行的价都是 0.5 的整数倍', async () => {
      const fine = { ask: (await prices('ask')).length, bid: (await prices('bid')).length }
      await tickGroup.getByRole('button', { name: '0.5', exact: true }).click()
      await expect(tickGroup.getByRole('button', { name: '0.5', exact: true })).toHaveAttribute('aria-pressed', 'true')
      const ask = await prices('ask')
      const bid = await prices('bid')
      expect(multiplesOf(ask, 0.5)).toBe(true)
      expect(multiplesOf(bid, 0.5)).toBe(true)
      expect(ask.length).toBeLessThanOrEqual(fine.ask)
      expect(bid.length).toBeLessThanOrEqual(fine.bid)
      await aria(book, 'orderbook-tick-05.aria.yml')
      return { fine, tick05: { ask: ask.length, bid: bid.length }, askPrices: ask, bidPrices: bid }
    })
    await step('点卖盘第一行：回调收到这个价与「卖盘」', async () => {
      await rows('ask').first().click()
      await expect(section.locator('[data-gallery-picked]')).toContainText('点价：')
      await expect(section.locator('[data-gallery-picked]')).toContainText('· 卖盘')
      return { picked: (await section.locator('[data-gallery-picked]').innerText()).trim() }
    })
    await step('点买盘第一行：回调收到「买盘」', async () => {
      await rows('bid').first().click()
      await expect(section.locator('[data-gallery-picked]')).toContainText('· 买盘')
      return { picked: (await section.locator('[data-gallery-picked]').innerText()).trim() }
    })
    await step('档位切回 0.01：每行的价回到两位小数，行数复原', async () => {
      await tickGroup.getByRole('button', { name: '0.01', exact: true }).click()
      await expect(tickGroup.getByRole('button', { name: '0.01', exact: true })).toHaveAttribute('aria-pressed', 'true')
      const ask = await prices('ask')
      const bid = await prices('bid')
      expect(multiplesOf(ask, 0.01)).toBe(true)
      expect(multiplesOf(bid, 0.01)).toBe(true)
      expect(ask.length).toBe(8)
      expect(bid.length).toBe(8)
      return { askPrices: ask, bidPrices: bid }
    })
    await step('占比条：两个数相加恰好 100，读屏也从这里读同一句', async () => {
      const [bid, ask] = await pcts()
      expect(bid + ask).toBe(100)
      expect(await shareLabel()).toMatch(/^买盘占 \d+\.\d%，卖盘占 \d+\.\d%$/)
      return { bidPct: bid, askPct: ask, share: await shareLabel() }
    })
  },
}