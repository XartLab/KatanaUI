// SPDX-License-Identifier: MIT
// 功能地图 features/orderbook.md：订单簿（买卖两侧、三种模式、合并档位、占比条、点价），再换到深度图与成交明细。
// 演示数据来自固定种子的模拟器，自动化浏览器里默认暂停：首屏每次都一样，流程里不步进。
export default {
  title: '盘口三件：订单簿、深度图、成交明细',
  page: 'order-book',
  async run({ page, section, step, expect, aria }) {
    const book = section.getByRole('group', { name: '订单簿（演示）' })
    const modes = book.getByRole('group', { name: '显示模式' })
    const ticks = book.getByRole('group', { name: '合并档位' })
    const askRows = book.locator('[data-side="ask"][data-slot="book-row"]')
    const bidRows = book.locator('[data-side="bid"][data-slot="book-row"]')
    const shareBid = book.locator('[data-slot="book-share-bid"]')
    const shareAsk = book.locator('[data-slot="book-share-ask"]')
    const spread = book.locator('[data-slot="book-spread-value"]')
    const picked = section.locator('[data-gallery-picked]')
    const prices = async (rows) => (await rows.locator('.k-book-price').allInnerTexts()).map((t) => t.trim())
    // 「1,234.567」换成整数千分之一，免得浮点比较。
    const thousandths = (text) => Math.round(Number(text.replaceAll(',', '')) * 1000)
    const sizes = async (rows) => (await rows.locator('[data-slot="book-size"]').allInnerTexts()).map(thousandths)
    const totals = async (rows) => (await rows.locator('.k-book-total').allInnerTexts()).map((t) => t.trim())
    const cents = (text) => Math.round(Number(text.replaceAll(',', '')) * 100)

    let bestAskTotal = null
    await step('打开 order-book：买卖并列，卖盘 8 行在上、买盘 8 行在下，最优价贴着中间行', async () => {
      await expect(modes.getByRole('button', { name: '买卖', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(ticks.getByRole('button', { name: '0.01', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(askRows).toHaveCount(8)
      await expect(bidRows).toHaveCount(8)
      const asks = await prices(askRows)
      const bids = await prices(bidRows)
      // 卖盘最远的在上：从上往下价格递减，最后一行是最优卖价；买盘第一行是最优买价。
      expect(asks.map(cents)).toEqual(asks.map(cents).toSorted((a, b) => b - a))
      expect(bids.map(cents)).toEqual(bids.map(cents).toSorted((a, b) => b - a))
      expect(asks.at(-1)).toBe('100.01')
      expect(bids[0]).toBe('100.00')
      await expect(spread).toHaveText('0.01')
      const askBox = await book.locator('[role="list"][data-side="ask"]').boundingBox()
      const midBox = await book.locator('[data-slot="book-mid"]').boundingBox()
      const bidBox = await book.locator('[role="list"][data-side="bid"]').boundingBox()
      expect(askBox.y + askBox.height).toBeLessThanOrEqual(midBox.y + 1)
      expect(midBox.y + midBox.height).toBeLessThanOrEqual(bidBox.y + 1)
      bestAskTotal = (await totals(askRows)).at(-1)
      await aria(book, 'order-book-default.aria.yml')
      return { asks, bids, spread: await spread.innerText(), bestAskTotal }
    })

    let share = null
    await step('占比条：买占比 = 屏上 8 档买量 /（买 + 卖），一位小数，两个数加起来 100', async () => {
      const bid = (await sizes(bidRows)).reduce((a, b) => a + b, 0)
      const ask = (await sizes(askRows)).reduce((a, b) => a + b, 0)
      const tenths = Math.round((bid * 1000) / (bid + ask))
      const bidText = `${(tenths / 10).toFixed(1)}%`
      const askText = `${((1000 - tenths) / 10).toFixed(1)}%`
      await expect(shareBid).toHaveText(`买 ${bidText}`)
      await expect(shareAsk).toHaveText(`${askText} 卖`)
      await expect(book.getByRole('img', { name: `买盘占 ${bidText}，卖盘占 ${askText}` })).toBeVisible()
      // 累计列：从最优价起逐行累加。
      const bidSizes = await sizes(bidRows)
      const bidTotals = (await totals(bidRows)).map(thousandths)
      let running = 0
      bidSizes.forEach((size, i) => {
        running += size
        expect(bidTotals[i], `买盘第 ${i + 1} 行的累计`).toBe(running)
      })
      share = { bid: bidText, ask: askText }
      return {
        bidVolume: bid / 1000,
        askVolume: ask / 1000,
        share: `${await shareBid.innerText()} | ${await shareAsk.innerText()}`,
      }
    })

    await step('点「只看买」：卖盘没了，买盘 16 行；占比条的数不变', async () => {
      await modes.getByRole('button', { name: '只看买', exact: true }).click()
      await expect(modes.getByRole('button', { name: '只看买', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(askRows).toHaveCount(0)
      await expect(bidRows).toHaveCount(16)
      await expect(shareBid).toHaveText(`买 ${share.bid}`)
      return { asks: await askRows.count(), bids: await bidRows.count(), share: await shareBid.innerText() }
    })
    await step('点「只看卖」：买盘没了，卖盘 16 行；再点「买卖」回到 8 + 8', async () => {
      await modes.getByRole('button', { name: '只看卖', exact: true }).click()
      await expect(bidRows).toHaveCount(0)
      await expect(askRows).toHaveCount(16)
      const askOnly = await askRows.count()
      await modes.getByRole('button', { name: '买卖', exact: true }).click()
      await expect(askRows).toHaveCount(8)
      await expect(bidRows).toHaveCount(8)
      return { askOnly, both: `${await askRows.count()} + ${await bidRows.count()}` }
    })

    await step(
      '合并档位点「0.5」：每个价都是 0.5 的整数倍，卖价向上取整、买价向下取整，价差仍是原始的 0.01',
      async () => {
        await ticks.getByRole('button', { name: '0.5', exact: true }).click()
        await expect(ticks.getByRole('button', { name: '0.5', exact: true })).toHaveAttribute('aria-pressed', 'true')
        const asks = await prices(askRows)
        const bids = await prices(bidRows)
        for (const text of [...asks, ...bids]) expect(cents(text) % 50, `${text} 不在 0.5 的档上`).toBe(0)
        // 最优卖价 100.01 向上并进 100.50，最优买价 100.00 留在 100.00。
        expect(asks.at(-1)).toBe('100.50')
        expect(bids[0]).toBe('100.00')
        await expect(spread).toHaveText('0.01')
        return { asks, bids, spread: await spread.innerText() }
      },
    )
    await step('点买盘第一行、卖盘最优一行：回显合并后的价与哪一侧（100.00 · 买盘，100.50 · 卖盘）', async () => {
      await bidRows.first().click()
      await expect(picked).toHaveText(/^点价：100\.00 · 买盘/)
      const bid = await picked.innerText()
      await askRows.last().click()
      await expect(picked).toHaveText(/^点价：100\.50 · 卖盘/)
      return { bid, ask: await picked.innerText() }
    })

    // 第二个入口：深度图。单页应用里换页，点左侧目录，不重载。
    const nav = (id) => page.getByRole('navigation', { name: '文档目录' }).locator(`a.k-sidenav-link[href="#/${id}"]`)
    const depthArea = page.locator('[data-gallery="depth-chart"]').first()
    const plot = depthArea.getByRole('group', { name: '深度图（演示）' })
    const readout = depthArea.locator('[data-slot="depth-readout"]')
    const tip = depthArea.locator('[data-slot="lcd-tooltip"]')

    await step('目录里点 DepthChart，聚焦图按 →：读数是最优卖价 100.01，累计量与订单簿同一档一致', async () => {
      await nav('depth-chart').click()
      await depthArea.waitFor()
      await expect(tip).toHaveCount(0)
      await plot.focus()
      await page.keyboard.press('ArrowRight')
      await expect(readout).toHaveText(`卖盘 100.01 · 累计量 ${bestAskTotal} · 距中间价 +0.00%`)
      await expect(tip).toBeVisible()
      const right = await readout.innerText()
      await page.keyboard.press('ArrowLeft')
      await expect(readout).toContainText('买盘 100.00 · 累计量')
      const left = await readout.innerText()
      await page.keyboard.press('Escape')
      await expect(readout).toHaveText('')
      await expect(tip).toHaveCount(0)
      return { right, left, afterEsc: await readout.innerText() }
    })
    await step('鼠标放到图左边四分之一处：读买盘，距中间价是负的；移开读数清掉', async () => {
      const box = await plot.boundingBox()
      await plot.hover({ position: { x: box.width * 0.25, y: box.height / 2 } })
      await expect(readout).toContainText('买盘')
      await expect(readout).toHaveText(/距中间价 -\d+\.\d{2}%$/)
      const text = await readout.innerText()
      await page.getByRole('heading', { level: 1 }).first().hover()
      await expect(readout).toHaveText('')
      return { hovered: text }
    })

    // 第三个入口：成交明细。
    const tapeArea = page.locator('[data-gallery="trade-tape"]').first()
    const tapeRows = tapeArea.locator('[data-slot="tape-row"]')

    await step('目录里点 TradeTape：逐笔 18 行，主动买与主动卖都有、价格颜色不同，新的在上', async () => {
      await nav('trade-tape').click()
      await tapeArea.waitFor()
      await expect(tapeRows).toHaveCount(18)
      await expect(tapeArea.locator('.k-tape-count')).toHaveCount(0)
      const sides = await tapeRows.evaluateAll((els) => els.map((e) => e.getAttribute('data-side')))
      expect(new Set(sides)).toEqual(new Set(['buy', 'sell']))
      const color = (side) =>
        tapeArea
          .locator(`[data-slot="tape-row"][data-side="${side}"] .k-tape-price`)
          .first()
          .evaluate((e) => getComputedStyle(e).color)
      const buy = await color('buy')
      const sell = await color('sell')
      expect(buy).not.toBe(sell)
      const times = await tapeRows.locator('.k-tape-time').allInnerTexts()
      expect(times).toEqual(times.toSorted().toReversed())
      return { rows: await tapeRows.count(), buy, sell, newest: times[0], oldest: times.at(-1) }
    })
    await step('点「聚合」：紧挨着的同价同方向并成一行、右边写 ×n，相邻两行不再同价同向', async () => {
      await tapeArea.getByRole('group', { name: '聚合' }).getByRole('button', { name: '聚合', exact: true }).click()
      await expect(tapeArea.locator('.k-tape-count').first()).toHaveText(/^×\d+$/)
      const meta = await tapeRows.evaluateAll((els) =>
        els.map((e) => `${e.getAttribute('data-price')}/${e.getAttribute('data-side')}`),
      )
      for (let i = 1; i < meta.length; i += 1) expect(meta[i], `第 ${i + 1} 行该并进上一行`).not.toBe(meta[i - 1])
      return {
        aggregated: await tapeArea.locator('.k-tape-count').count(),
        counts: await tapeArea.locator('.k-tape-count').allInnerTexts(),
      }
    })
  },
}
