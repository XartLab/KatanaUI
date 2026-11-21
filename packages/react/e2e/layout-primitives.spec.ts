// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// 排版原语与分量（#115）：在文档站上真量版面。单测只量得到类名与样式规则，换行、变竖排、滚动条粗细、分量的实际模样要真浏览器。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
  return page.locator(`[data-gallery="${id}"]`)
}
const boxes = async (children: Locator) => Promise.all((await children.all()).map((child) => child.boundingBox()))
const distinct = (values: (number | undefined)[]) => new Set(values.map((value) => Math.round(value ?? -1))).size
const resize = (frame: Locator, width: number) =>
  frame.evaluate((element, w) => (element.style.width = `${w}px`), width)

test('Stack：竖排，间距就是 space-* 刻度的值', async ({ page }) => {
  const demo = await open(page, 'stack')
  const stack = demo.locator('.k-stack').nth(1)
  const [a, b, c] = await boxes(stack.locator('> *'))
  expect(a!.x).toBe(b!.x)
  expect(b!.y).toBeGreaterThan(a!.y)
  expect(c!.y).toBeGreaterThan(b!.y)
  const gap = await stack.evaluate((element) => getComputedStyle(element).rowGap)
  const space3 = await page.evaluate(() => {
    const probe = document.createElement('i')
    probe.style.width = 'var(--space-3)'
    document.body.append(probe)
    const width = getComputedStyle(probe).width
    probe.remove()
    return width
  })
  expect(gap).toBe(space3)
  expect(Math.round(b!.y - (a!.y + a!.height))).toBe(parseFloat(space3))
})

test('Cluster：放不下就换行', async ({ page }) => {
  const demo = await open(page, 'cluster')
  const cluster = demo.locator('.k-cluster').first()
  const tops = await boxes(cluster.locator('> *'))
  expect(distinct(tops.map((box) => box?.y))).toBeGreaterThan(1)
  await cluster.evaluate((element) => (element.style.width = '2000px'))
  expect(distinct((await boxes(cluster.locator('> *'))).map((box) => box?.y))).toBe(1)
})

test('Sidebar：放得下一窄一宽并排，放不下上下叠', async ({ page }) => {
  const demo = await open(page, 'sidebar')
  const sidebars = demo.locator('.k-sidebar')
  const [narrowFirst, narrowLast, stacked] = [sidebars.nth(0), sidebars.nth(1), sidebars.nth(2)]
  const [a, b] = await boxes(narrowFirst.locator('> *'))
  expect(Math.round(a!.y)).toBe(Math.round(b!.y))
  expect(Math.round(a!.width)).toBe(120)
  expect(b!.width).toBeGreaterThan(a!.width)
  const [c, d] = await boxes(narrowLast.locator('> *'))
  expect(Math.round(d!.width)).toBe(120)
  expect(c!.width).toBeGreaterThan(d!.width)
  const [e, f] = await boxes(stacked.locator('> *'))
  expect(f!.y).toBeGreaterThan(e!.y)
  expect(Math.round(e!.x)).toBe(Math.round(f!.x))
  // 拖宽了又并排
  await resize(stacked.locator('xpath=..'), 420)
  const [g, h] = await boxes(stacked.locator('> *'))
  expect(Math.round(g!.y)).toBe(Math.round(h!.y))
})

test('Switcher：容器窄于阈值整体竖排，宽于阈值整行', async ({ page }) => {
  const demo = await open(page, 'switcher')
  const wide = demo.locator('.k-switcher').nth(0)
  const narrow = demo.locator('.k-switcher').nth(1)
  expect(distinct((await boxes(wide.locator('> *'))).map((box) => box?.y))).toBe(1)
  expect(distinct((await boxes(narrow.locator('> *'))).map((box) => box?.y))).toBe(3)
  // 不是一块一块往下掉：窄容器里每块都占满整行
  const blocks = await boxes(narrow.locator('> *'))
  expect(new Set(blocks.map((box) => Math.round(box!.width))).size).toBe(1)
  // 拖宽过阈值（360）再回来，行为跟着变：看的是容器，不是视口
  await resize(narrow.locator('xpath=..'), 500)
  expect(distinct((await boxes(narrow.locator('> *'))).map((box) => box?.y))).toBe(1)
  await resize(narrow.locator('xpath=..'), 340)
  expect(distinct((await boxes(narrow.locator('> *'))).map((box) => box?.y))).toBe(3)
})

test('Grid：放得下几列就几列，每格不窄于 min', async ({ page }) => {
  const demo = await open(page, 'grid')
  const grids = demo.locator('.k-grid-layout')
  const wide = await boxes(grids.nth(0).locator('> *'))
  const narrow = await boxes(grids.nth(1).locator('> *'))
  expect(distinct(wide.map((box) => box?.x))).toBe(3)
  expect(distinct(narrow.map((box) => box?.x))).toBe(2)
  for (const box of [...wide, ...narrow]) expect(box!.width).toBeGreaterThanOrEqual(120)
  // 最后一行不够也同宽
  expect(new Set(wide.map((box) => Math.round(box!.width))).size).toBe(1)
})

test('Reel：放不下横向滚，滚动条 4px、平时透明', async ({ page }) => {
  const demo = await open(page, 'reel')
  const reel = demo.locator('.k-reel')
  const scrolls = await reel.evaluate((element) => element.scrollWidth > element.clientWidth)
  expect(scrolls).toBe(true)
  // 无头浏览器默认带 --hide-scrollbars，量不到滚动条占的高度，也算不出悬停时滑块的颜色（悬停那条规则在 layout.test.tsx 里量文本）；这里量样式给的值：4px，滑块平时透明
  const bar = () => reel.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').height)
  const thumb = () => reel.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar-thumb').backgroundColor)
  expect(await bar()).toBe('4px')
  expect(await thumb()).toMatch(/^rgba\(0, 0, 0, 0\)|transparent/)
  const items = await boxes(reel.locator('> *'))
  expect(distinct(items.map((box) => box?.y))).toBe(1)
  // 键盘能聚焦、方向键能滚
  await reel.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => reel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
})

test('分量：三档的读数、表、新闻流在浏览器里的模样', async ({ page }) => {
  const demo = await open(page, 'emphasis')
  const at = (level: string) => demo.locator(`[data-emphasis-demo="${level}"]`)
  const size = (locator: Locator) => locator.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))

  // 读数类：hero 的价格是 display 档（28px），compact 一行、没有迷你图
  const readouts = ['hero', 'standard', 'compact'].map((level) => at(level).first())
  const prices = await Promise.all(readouts.map((readout) => size(readout.locator('.k-quote-price'))))
  expect(prices).toEqual([28, 15, 12])
  await expect(readouts[0]!.locator('.k-quote-spark')).toBeVisible()
  await expect(readouts[2]!.locator('.k-quote-spark')).toHaveCount(0)
  const compactCard = await readouts[2]!.locator('.k-quote-card').boundingBox()
  const standardCard = await readouts[1]!.locator('.k-quote-card').boundingBox()
  expect(compactCard!.height).toBeLessThan(standardCard!.height / 2)
  await expect(readouts[2]!.locator('.k-gauge-track')).toHaveCount(0)
  await expect(readouts[1]!.locator('.k-gauge-track')).toBeVisible()

  // DataGrid：compact 不出表头、只有 5 行；hero 与 standard 有表头、行数一样，字大一档
  const grids = ['hero', 'standard', 'compact'].map((level) => demo.locator(`.k-grid[data-emphasis="${level}"]`))
  await expect(grids[2]!.locator('[role="columnheader"]')).toHaveCount(0)
  await expect(grids[2]!.locator('[role="row"]')).toHaveCount(5)
  await expect(grids[1]!.locator('[role="columnheader"]')).toHaveCount(3)
  expect(await grids[1]!.locator('[role="row"]').count()).toBe(9)
  const cellSizes = await Promise.all(grids.slice(0, 2).map((grid) => size(grid.locator('.k-grid-cell').first())))
  expect(cellSizes).toEqual([13, 12])

  // NewsFeed：compact 一行一条，没有频道与搜索；条目的高度比 standard 矮
  const feeds = ['hero', 'standard', 'compact'].map((level) => demo.locator(`.k-news[data-emphasis="${level}"]`))
  await expect(feeds[2]!.locator('.k-news-item')).toHaveCount(4)
  await expect(feeds[2]!.locator('.k-news-search')).toHaveCount(0)
  await expect(feeds[1]!.locator('.k-news-search')).toBeVisible()
  const compactRow = await feeds[2]!.locator('.k-news-item').first().boundingBox()
  const standardRow = await feeds[1]!.locator('.k-news-item').first().boundingBox()
  expect(compactRow!.height).toBeLessThan(standardRow!.height)
  const titles = await Promise.all(feeds.slice(0, 2).map((feed) => size(feed.locator('.k-news-title').first())))
  expect(titles).toEqual([15, 12])
})
