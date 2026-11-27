// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// 盘口三件（#104）：订单簿、深度图、成交明细。在文档站的页上真点真按，断言用户看到的东西。
// 演示数据来自固定种子的模拟器；自动化浏览器里它默认暂停，所以首屏是确定的，要动用 window.__liveStep(n) 手动步进。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

/** 「1,234.567」写成整数千分之一，免得浮点比较。 */
const thousandths = (text: string | null) => Math.round(Number((text ?? '').replaceAll(',', '')) * 1000)
const cents = (price: string | null) => Math.round(Number(price ?? 'NaN') * 100)
const dataPrices = (rows: Locator) => rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-price')))

test.describe('OrderBook 订单簿', () => {
  test('三种模式：买卖并列、只看买、只看卖', async ({ page }) => {
    const area = await open(page, 'order-book')
    const asks = area.locator('[data-side="ask"][data-slot="book-row"]')
    const bids = area.locator('[data-side="bid"][data-slot="book-row"]')
    // 并列：每侧 8 行；卖盘最远的在上、最优价贴着中间行；买盘最优价在中间行下面。
    await expect(asks).toHaveCount(8)
    await expect(bids).toHaveCount(8)
    const askPrices = (await dataPrices(asks)).map(Number)
    const bidPrices = (await dataPrices(bids)).map(Number)
    expect(askPrices).toEqual([...askPrices].sort((a, b) => b - a))
    expect(bidPrices).toEqual([...bidPrices].sort((a, b) => b - a))
    expect(askPrices.at(-1)).toBe(100.01)
    expect(bidPrices[0]).toBe(100)
    await expect(area.locator('[data-slot="book-spread-value"]')).toHaveText('0.01')
    // 中间行在两侧之间。
    const askBox = await area.locator('[data-side="ask"][role="list"]').boundingBox()
    const midBox = await area.locator('[data-slot="book-mid"]').boundingBox()
    const bidBox = await area.locator('[data-side="bid"][role="list"]').boundingBox()
    expect(askBox!.y + askBox!.height).toBeLessThanOrEqual(midBox!.y + 1)
    expect(midBox!.y + midBox!.height).toBeLessThanOrEqual(bidBox!.y + 1)

    const modes = area.getByRole('group', { name: '显示模式' })
    await modes.getByRole('button', { name: '只看买' }).click()
    await expect(modes.getByRole('button', { name: '只看买' })).toHaveAttribute('aria-pressed', 'true')
    await expect(asks).toHaveCount(0)
    await expect(bids).toHaveCount(16)
    await modes.getByRole('button', { name: '只看卖' }).click()
    await expect(bids).toHaveCount(0)
    await expect(asks).toHaveCount(16)
    await modes.getByRole('button', { name: '买卖' }).click()
    await expect(asks).toHaveCount(8)
    await expect(bids).toHaveCount(8)
  })

  test('合并档位：行数变少，每个价位都对齐到档位的整数倍', async ({ page }) => {
    const area = await open(page, 'order-book')
    const rows = area.locator('[data-slot="book-row"]')
    const askRows = area.locator('[data-side="ask"][data-slot="book-row"]')
    await expect(rows).toHaveCount(16)
    const ticks = area.getByRole('group', { name: '合并档位' })
    for (const [name, stepCents] of [
      ['0.05', 5],
      ['0.5', 50],
      ['1', 100],
    ] as const) {
      await ticks.getByRole('button', { name, exact: true }).click()
      await expect(ticks.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
      for (const price of await dataPrices(rows))
        expect(cents(price) % stepCents, `${price} 不在 ${name} 的档上`).toBe(0)
      // 屏上写的价格也对齐（两位小数）。
      const shown = await rows.locator('.k-book-price').allTextContents()
      for (const text of shown) expect(cents(text.replaceAll(',', '')) % stepCents, text).toBe(0)
    }
    // 1 档：4.00 的区间一侧只剩 5 行左右，比并列模式的 8 行少。
    expect(await askRows.count()).toBeLessThan(8)
    expect(await askRows.count()).toBeGreaterThan(0)
    // 合并后卖价不低于原最优卖价；价差读数仍是原始档位的 0.01。
    const bestAsk = Math.min(...(await dataPrices(askRows)).map(Number))
    expect(bestAsk).toBeGreaterThanOrEqual(100.01)
    await expect(area.locator('[data-slot="book-spread-value"]')).toHaveText('0.01')
  })

  test('点价：回调收到合并后的价与点的是哪一侧', async ({ page }) => {
    const area = await open(page, 'order-book')
    const picked = area.locator('[data-gallery-picked]')
    const ask = area.locator('[data-side="ask"][data-slot="book-row"]').nth(2)
    const askPrice = await ask.getAttribute('data-price')
    await ask.click()
    await expect(picked).toContainText(`点价：${Number(askPrice).toFixed(2)} · 卖盘`)
    const bid = area.locator('[data-side="bid"][data-slot="book-row"]').nth(3)
    const bidPrice = await bid.getAttribute('data-price')
    await bid.click()
    await expect(picked).toContainText(`点价：${Number(bidPrice).toFixed(2)} · 买盘`)
    // 合并到 0.5 后点的是合并档的价。
    await area.getByRole('group', { name: '合并档位' }).getByRole('button', { name: '0.5', exact: true }).click()
    const merged = area.locator('[data-side="bid"][data-slot="book-row"]').first()
    const mergedPrice = await merged.getAttribute('data-price')
    await merged.click()
    await expect(picked).toContainText(`点价：${Number(mergedPrice).toFixed(2)} · 买盘`)
    expect(cents(mergedPrice) % 50).toBe(0)
  })

  test('占比条：等于屏上前 8 档买量 /（买 + 卖），换模式不变；累计与深度条向外递增', async ({ page }) => {
    const area = await open(page, 'order-book')
    const bidRows = area.locator('[data-side="bid"][data-slot="book-row"]')
    const sizesOf = async (rows: Locator) =>
      (await rows.locator('[data-slot="book-size"]').allTextContents()).map(thousandths)
    const bid = (await sizesOf(bidRows)).reduce((a, b) => a + b, 0)
    const ask = (await sizesOf(area.locator('[data-side="ask"][data-slot="book-row"]'))).reduce((a, b) => a + b, 0)
    const tenths = Math.round((bid * 1000) / (bid + ask))
    const bidText = `${(tenths / 10).toFixed(1)}%`
    const askText = `${((1000 - tenths) / 10).toFixed(1)}%`
    const share = area.locator('[data-slot="book-share"]')
    await expect(share.locator('[data-slot="book-share-bid"]')).toHaveText(`买 ${bidText}`)
    await expect(share.locator('[data-slot="book-share-ask"]')).toHaveText(`${askText} 卖`)
    await expect(share.locator('[data-slot="book-share-bid"]')).toHaveAttribute('data-pct', String(tenths / 10))
    await expect(share).toHaveAttribute('aria-label', `买盘占 ${bidText}，卖盘占 ${askText}`)

    // 累计列：等于从最优价起逐行量的累加。
    const sizes = await sizesOf(bidRows)
    const totals = (await bidRows.locator('.k-book-total').allTextContents()).map(thousandths)
    let running = 0
    sizes.forEach((size, i) => {
      running += size
      expect(totals[i]).toBe(running)
    })
    // 深度条：宽度随累计量往外变宽。
    const widths = await bidRows
      .locator('.k-book-bar')
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width))
    for (let i = 1; i < widths.length; i += 1) expect(widths[i]!).toBeGreaterThanOrEqual(widths[i - 1]!)

    await area.getByRole('group', { name: '显示模式' }).getByRole('button', { name: '只看买' }).click()
    await expect(share.locator('[data-slot="book-share-bid"]')).toHaveAttribute('data-pct', String(tenths / 10))
  })
})

test.describe('DepthChart 深度图', () => {
  const readout = (area: Locator) => area.locator('[data-slot="depth-readout"]')
  const tipValue = (area: Locator, row: number) =>
    area.locator('[data-slot="lcd-tooltip"] .k-ck-tip-row').nth(row).locator('.k-ck-tip-value')

  test('悬停读价格、累计量与距中间价；买盘一侧累计量往外变大', async ({ page }) => {
    const area = await open(page, 'depth-chart')
    const box = (await area.locator('[data-slot="depth-plot"]').boundingBox())!
    const tip = area.locator('[data-slot="lcd-tooltip"]')
    await expect(tip).toHaveCount(0)

    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2)
    await expect(tip).toBeVisible()
    await expect(readout(area)).toContainText('买盘')
    const near = thousandths(await tipValue(area, 0).textContent())
    const offsetNear = (await tipValue(area, 1).textContent())!
    expect(offsetNear).toMatch(/^-\d+\.\d{2}%$/)

    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2)
    const far = thousandths(await tipValue(area, 0).textContent())
    expect(far).toBeGreaterThanOrEqual(near)
    const offsetFar = (await tipValue(area, 1).textContent())!
    expect(Math.abs(Number(offsetFar.replace('%', '')))).toBeGreaterThan(Math.abs(Number(offsetNear.replace('%', ''))))

    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2)
    await expect(readout(area)).toContainText('卖盘')
    await expect(tipValue(area, 1)).toHaveText(/^\+\d+\.\d{2}%$/)

    await page.mouse.move(box.x - 40, box.y - 40)
    await expect(tip).toHaveCount(0)
  })

  test('定义域限制到中间价 ±x%：横轴两端跟着变', async ({ page }) => {
    const area = await open(page, 'depth-chart')
    const mid = Number((await area.locator('[data-slot="depth-mid"]').textContent())!.replace(/[^\d.]/g, ''))
    const ticks = async () =>
      (await area.locator('.k-depth-xtick').allTextContents()).map((t) => Number(t.replaceAll(',', '')))
    const range = area.getByRole('group', { name: '横轴范围' })
    await range.getByRole('button', { name: '±0.3%' }).click()
    const narrow = await ticks()
    expect(narrow[0]!).toBeCloseTo(mid * 0.997, 1)
    expect(narrow.at(-1)!).toBeCloseTo(mid * 1.003, 1)
    await range.getByRole('button', { name: '全部' }).click()
    const wide = await ticks()
    expect(wide[0]!).toBeLessThan(narrow[0]!)
    expect(wide.at(-1)!).toBeGreaterThan(narrow.at(-1)!)
  })

  test('键盘：聚焦后左右方向键读档位，Esc 清掉', async ({ page }) => {
    const area = await open(page, 'depth-chart')
    await area.locator('[data-slot="depth-plot"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(readout(area)).toContainText('卖盘')
    const first = await readout(area).textContent()
    await page.keyboard.press('ArrowRight')
    expect(await readout(area).textContent()).not.toBe(first)
    await page.keyboard.press('Escape')
    await expect(readout(area)).toHaveText('')
  })
})

test.describe('TradeTape 成交明细', () => {
  test('逐笔：一笔一行，方向着色，最多 18 行，新的在上', async ({ page }) => {
    const area = await open(page, 'trade-tape')
    const rows = area.locator('[data-slot="tape-row"]')
    await expect(rows).toHaveCount(18)
    await expect(area.locator('.k-tape-count')).toHaveCount(0)
    const sides = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-side')))
    expect(new Set(sides)).toEqual(new Set(['buy', 'sell']))
    const color = (side: string) =>
      area
        .locator(`[data-slot="tape-row"][data-side="${side}"] .k-tape-price`)
        .first()
        .evaluate((e) => getComputedStyle(e).color)
    expect(await color('buy')).not.toBe(await color('sell'))
    const times = await rows.locator('.k-tape-time').allTextContents()
    expect(times).toEqual([...times].sort().reverse())
  })

  test('大单高亮：阈值换了，高亮的行跟着换（按屏上的量判）', async ({ page }) => {
    const area = await open(page, 'trade-tape')
    const rows = area.locator('[data-slot="tape-row"]')
    const check = async (threshold: number | null) => {
      const flags = await rows.evaluateAll((els) => els.map((e) => e.hasAttribute('data-large')))
      // 量在 .k-tape-size 里：去掉 ×n 徽标与读屏用的「大单」字。
      const sizes = await rows.evaluateAll((els) =>
        els.map((e) => {
          const cell = e.querySelector('.k-tape-size')!.cloneNode(true) as HTMLElement
          cell.querySelectorAll('.k-tape-count, .k-tape-sr').forEach((n) => n.remove())
          return cell.textContent ?? ''
        }),
      )
      sizes.forEach((text, i) => {
        expect(flags[i], `第 ${i} 行 ${text}`).toBe(threshold !== null && thousandths(text) >= threshold * 1000)
      })
    }
    await check(1)
    expect(await area.locator('[data-large]').count()).toBeGreaterThan(0)
    const group = area.getByRole('group', { name: '大单阈值' })
    await group.getByRole('button', { name: '≥ 5' }).click()
    await check(5)
    await group.getByRole('button', { name: '无' }).click()
    await check(null)
    await expect(area.locator('[data-large]')).toHaveCount(0)
  })

  test('聚合：紧挨着的同价同方向并成一行，写笔数；新成交从顶上进', async ({ page }) => {
    const area = await open(page, 'trade-tape')
    const rows = area.locator('[data-slot="tape-row"]')
    await area.getByRole('group', { name: '聚合' }).getByRole('button', { name: '聚合' }).click()
    const meta = await rows.evaluateAll((els) =>
      els.map((e) => ({
        price: e.getAttribute('data-price'),
        side: e.getAttribute('data-side'),
        count: Number(e.getAttribute('data-count')),
      })),
    )
    expect(Math.max(...meta.map((m) => m.count))).toBeGreaterThan(1)
    for (let i = 1; i < meta.length; i += 1) {
      const same = meta[i]!.price === meta[i - 1]!.price && meta[i]!.side === meta[i - 1]!.side
      expect(same, `第 ${i} 行与上一行本该并在一起`).toBe(false)
    }
    // 聚合行右边写 ×n。
    const aggregated = rows.filter({ has: page.locator('.k-tape-count') })
    expect(await aggregated.count()).toBeGreaterThan(0)
    await expect(aggregated.first().locator('.k-tape-count')).toHaveText(/^×\d+$/)

    const topBefore = await rows.first().locator('.k-tape-time').textContent()
    await page.evaluate(() => window.__liveStep?.(1))
    await expect(rows.first().locator('.k-tape-time')).not.toHaveText(topBefore!)
    await expect(rows.first()).toHaveClass(/k-tape-enter/)
  })
})
