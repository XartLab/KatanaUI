// SPDX-License-Identifier: MIT
import { expect, test } from '@playwright/test'

// 精密仪器语言（#7）的正面证明：点阵元信息行真的用点阵字（Doto，汉字落到随包发的方舟像素子集），编号是强调色。
// 临时把 --font-dot 的方舟像素去掉，或把编号色改掉，这条会红。
test.use({ viewport: { width: 1100, height: 1500 } })

test('序列探索：元信息行是点阵字，汉字用随包的方舟像素，编号是强调色', async ({ page }) => {
  await page.goto('/?theme=graphite#/series-explorer')
  const meta = page.locator('[data-gallery="series-explorer"] [data-slot="series-meta"]').first()
  await expect(meta).toBeVisible()

  const family = await meta.evaluate((element) => getComputedStyle(element).fontFamily)
  expect(family).toMatch(/^"?Doto"?, "?Ark Pixel 12 zh_cn Subset"?/)

  // 汉字真的是方舟像素子集画的：字体文件加载成功，且子集里有这行里的字
  const loaded = await page.evaluate(async () => {
    await document.fonts.load('12px "Ark Pixel 12 zh_cn Subset"', '演示数据')
    return document.fonts.check('12px "Ark Pixel 12 zh_cn Subset"', '演示数据')
  })
  expect(loaded).toBe(true)
  const faces = await page.evaluate(
    () =>
      [...document.fonts].filter(
        (face) => face.family.includes('Ark Pixel 12 zh_cn Subset') && face.status === 'loaded',
      ).length,
  )
  expect(faces).toBe(1)

  // 编号 01 / 02 / 03 是强调色
  const accent = await page.evaluate(() => {
    const probe = document.createElement('i')
    probe.style.color = 'var(--chart-accent, var(--signal-orange))'
    document.body.append(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  })
  const indexes = page.locator('[data-gallery="series-explorer"] .k-sx-kpis .k-spark-tile-index')
  expect(await indexes.count()).toBeGreaterThanOrEqual(3)
  for (const color of await indexes.evaluateAll((els) => els.map((e) => getComputedStyle(e).color))) {
    expect(color).toBe(accent)
  }
})

const probeColor = (page: import('@playwright/test').Page, value: string) =>
  page.evaluate((v) => {
    const probe = document.createElement('i')
    probe.style.color = v
    document.body.append(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  }, value)

test('数据表：Time (UTC) 列头与格内时间完整可见，不被裁', async ({ page }) => {
  await page.goto('/?theme=graphite#/data-grid')
  const grid = page.locator('[data-gallery="data-grid"]').getByTestId('grid-demo')
  await expect(grid).toBeVisible()
  const head = grid.getByRole('columnheader', { name: /Time \(UTC\)/ })
  const cell = grid.getByRole('row').nth(1).locator('[data-col="at"]')
  const box = async (locator: import('@playwright/test').Locator) =>
    locator.evaluate((e) => e.getBoundingClientRect().toJSON())
  const scroller = await grid.locator('.k-grid-scroll').evaluate((e) => e.getBoundingClientRect().toJSON())
  for (const locator of [head, cell]) {
    const rect = await box(locator)
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.right).toBeLessThanOrEqual(scroller.right + 0.5)
  }
  // 文字本身没被省略号裁掉
  expect(await cell.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
  expect(
    await head.evaluate((e) => [...e.querySelectorAll('*')].every((n) => n.scrollWidth <= n.clientWidth + 1)),
  ).toBe(true)
  await expect(cell).toHaveText('2026-11-14 01:02:03')
})

test('Meter 的 accent 档与权益线不是橙色（橙色只给状态灯与焦点）', async ({ page }) => {
  await page.goto('/?theme=graphite#/meter')
  const orange = await probeColor(page, 'var(--signal-orange)')
  const ink = await probeColor(page, 'var(--ink-100)')
  const accent = page.locator('[data-gallery="meter"] .k-meter[data-tone="accent"] .k-meter-value').first()
  const color = await accent.evaluate((e) => getComputedStyle(e).color)
  expect(color).toBe(ink)
  expect(color).not.toBe(orange)
  await page.goto('/?theme=graphite#/equity-curve')
  const line = page.locator('[data-gallery="equity-curve"] [data-slot="equity-line"]').first()
  await expect(line).toBeVisible()
  expect(await line.evaluate((e) => getComputedStyle(e).stroke)).toBe(ink)
})

test('日历热力图顶栏是包里的分段控件，不是白边框按钮', async ({ page }) => {
  await page.goto('/?theme=graphite#/calendar-heatmap')
  const group = page.locator('[data-gallery="calendar-heatmap"]').getByRole('group', { name: '视图' }).first()
  await expect(group).toBeVisible()
  const items = group.locator('[data-view]')
  expect(await items.count()).toBe(3)
  await items.nth(1).click()
  await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true')
  const borders = await items.evaluateAll((els) => els.map((e) => getComputedStyle(e).borderTopWidth))
  expect(borders).toEqual(['0px', '0px', '0px'])
  // 选中项是灰底滑块（子元素画底），文字换成选中色
  const onInk = await probeColor(page, 'var(--seg-on-ink)')
  await expect.poll(() => items.nth(1).evaluate((e) => getComputedStyle(e).color)).toBe(onInk)
  await expect
    .poll(() =>
      items
        .nth(1)
        .evaluate((e) =>
          [...e.querySelectorAll('*')].some((n) => getComputedStyle(n).backgroundColor !== 'rgba(0, 0, 0, 0)'),
        ),
    )
    .toBe(true)
})
