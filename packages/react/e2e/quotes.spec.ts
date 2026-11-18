// SPDX-License-Identifier: MIT
// 行情套件（src/quotes/，2026-11-18 G4）里还没有专属断言的几页：矩形树图的字色对比度、品种徽标的两档尺寸、五档评级、行快捷操作，
// 以及统一行情行之后 QuoteTable 与 Watchlist 共用的「只闪变了的尾数」。只量用户看得见的：算出来的颜色、尺寸、焦点、点了以后发生什么。
import { expect, test, type Page } from '@playwright/test'
import tokensJson from '@katana-ui/tokens/tokens.json' with { type: 'json' }

const THEMES = (tokensJson as { color: { themes: { id: string }[] } }).color.themes.map((theme) => theme.id)

const open = async (page: Page, theme: string, id: string) => {
  await page.goto(theme === 'graphite' ? `/#/${id}` : `/?theme=${theme}#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
}

/** 页面里算出元素字色与底色的对比度（WCAG 2）：颜色先画到 1×1 的画布上读回 sRGB，oklch、color-mix 都能比。 */
const contrasts = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgb = (css: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3), (v) => v / 255)
    }
    const lum = (c: number[]) =>
      c
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
    return [...document.querySelectorAll<HTMLElement>(sel)].map((el) => {
      const style = getComputedStyle(el)
      const [a, b] = [lum(rgb(style.color)), lum(rgb(style.backgroundColor))]
      return { text: el.textContent ?? '', ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
    })
  }, selector)

test.describe('Treemap 字色对比度（已知 a11y 条目已修）', () => {
  for (const theme of THEMES) {
    for (const updown of ['global', 'cn'] as const) {
      test(`格子与色例的字在七档底色上都 ≥ 4.5:1 · ${theme} · ${updown}`, async ({ page }) => {
        await open(page, theme, 'treemap')
        if (updown === 'cn') await page.evaluate(() => (document.documentElement.dataset.updown = 'cn'))
        const map = page.locator('[data-gallery-treemap]')
        await expect(map.locator('.k-treemap-legend li')).toHaveCount(7)
        // 颜色有 --dur-flash 的过渡：等它落定再量。
        await page.waitForTimeout(400)
        const all = [
          ...(await contrasts(page, '[data-gallery-treemap] .k-treemap-legend li')),
          ...(await contrasts(page, '[data-gallery-treemap] .k-treemap-cell')),
        ]
        for (const { text, ratio } of all) expect(ratio, `${theme} ${updown}「${text}」`).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})

test.describe('SymbolMark 品种徽标', () => {
  test('sm 18px 字号 12、md 28px 字号 16；读屏名取 name；字号不内联', async ({ page }) => {
    await open(page, 'graphite', 'symbol-mark')
    const apple = page.locator('[data-gallery="symbol-mark"]').getByRole('img', { name: 'Apple' }).first()
    await expect(apple).toBeVisible()
    await expect(apple).toHaveAttribute('data-size', 'sm')
    expect(await apple.evaluate((el) => [el.getBoundingClientRect().width, getComputedStyle(el).fontSize])).toEqual([
      18,
      '12px',
    ])
    expect(await apple.getAttribute('style')).not.toContain('font-size')
    const big = page.locator('[data-gallery="symbol-mark"] [data-slot="symbol-mark"][data-size="md"]').first()
    expect(await big.evaluate((el) => [el.getBoundingClientRect().width, getComputedStyle(el).fontSize])).toEqual([
      28,
      '16px',
    ])
    // 没有拉丁字母的代码取名称首字。
    await expect(
      page.locator('[data-gallery="symbol-mark"]').getByRole('img', { name: '贵州茅台' }).first(),
    ).toContainText('贵')
  })
})

test.describe('SymbolMark 徽标来源（LogoProvider，#94）', () => {
  test('币标按需载入、股票走自托管、找不到的退回字母；失败的地址不重复请求', async ({ page }) => {
    const misses: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('601318')) misses.push(req.url())
    })
    await open(page, 'graphite', 'symbol-mark')
    const root = page.locator('[data-gallery="symbol-mark"]')
    // 加密币：web3icons 的 SVG 是 data URL（按需 import 的小块），不是外链。
    const btc = root.getByRole('img', { name: 'BTCUSDT' })
    await expect(btc).toHaveAttribute('data-kind', 'image')
    expect(await btc.locator('img').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    for (const name of ['ETH-USDT', 'SOL/USDT', 'BNBUSDT.P', 'XRP-PERP', 'DOGEUSDT'])
      await expect(root.getByRole('img', { name }), name).toHaveAttribute('data-kind', 'image')
    // 股票：自托管目录按「代码.场所」命名。
    const a = root.getByRole('img', { name: '示例甲' }).first()
    await expect(a).toHaveAttribute('data-kind', 'image')
    expect(await a.locator('img').getAttribute('src')).toMatch(/logos-demo\/600519\.XSHG\.svg$/)
    await expect(root.getByRole('img', { name: '示例乙' })).toHaveAttribute('data-kind', 'image')
    // 找不到：两个候选（601318.XSHG.svg、601318.svg）都失败，退回字母（名称首字）。
    const miss = root.getByRole('img', { name: '示例丁' })
    await expect(miss).toHaveAttribute('data-kind', 'letters')
    await expect(miss).toContainText('示')
    await expect(root.getByRole('img', { name: 'NOSUCHCOIN-USDT' })).toHaveAttribute('data-kind', 'letters')
    expect(new Set(misses).size).toBe(misses.length)
  })
})

test.describe('RatingText 五档评级', () => {
  test('买入档涨色、卖出档跌色、中性不着色；强档两层箭头', async ({ page }) => {
    await open(page, 'graphite', 'rating-text')
    const root = page.locator('[data-gallery="rating-text"]')
    const color = (name: string) =>
      root
        .locator('[data-slot="rating-text"]')
        .filter({ hasText: new RegExp(`^${name}$`) })
        .first()
        .evaluate((el) => getComputedStyle(el).color)
    const swatch = (css: string) =>
      page.evaluate((value) => {
        const probe = document.createElement('i')
        probe.style.color = value
        document.body.append(probe)
        const out = getComputedStyle(probe).color
        probe.remove()
        return out
      }, css)
    expect(await color('买入')).toBe(await swatch('var(--pnl-up)'))
    expect(await color('卖出')).toBe(await swatch('var(--pnl-down)'))
    expect(await color('中性')).not.toBe(await swatch('var(--pnl-up)'))
    expect(await color('中性')).not.toBe(await swatch('var(--pnl-down)'))
    // 方向不只靠颜色：每档都有图标。
    await expect(root.locator('[data-slot="rating-text"] svg')).toHaveCount(
      await root.locator('[data-slot="rating-text"]').count(),
    )
  })
})

test.describe('RowActions 行快捷操作', () => {
  test('悬停或 Tab 进行里按钮条浮出；点按钮、键盘 Enter 都执行动作', async ({ page }) => {
    await open(page, 'graphite', 'row-actions')
    const rows = page.getByTestId('row-actions-list').locator('li')
    await expect(rows).toHaveCount(3)
    const first = rows.first()
    await first.hover()
    const chart = first.getByRole('button', { name: 'Open chart' })
    await expect(chart).toBeVisible()
    await chart.click()
    await expect(page.getByTestId('row-action-log')).toHaveText('Last action: Open chart · ALFA')
    // 键盘：Tab 落到第二行的按钮上，按钮条也出现。
    await page.mouse.move(0, 0)
    await rows.nth(1).getByRole('button').first().focus()
    await expect(rows.nth(1).getByRole('button').first()).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('row-action-log')).toContainText('BRAV')
  })
})

test.describe('QuoteTable 行就是 Watchlist 的行', () => {
  test('最新价变了只闪变了的尾数（与自选列表同一个 FlashPrice），整格不闪', async ({ page }) => {
    await open(page, 'graphite', 'quote-table')
    const seen = await page.evaluate(async () => {
      const root = document.querySelector('[data-gallery-qtable]')!
      for (let i = 0; i < 40; i += 1) {
        window.__liveStep!()
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const tail = root.querySelector<HTMLElement>('[data-slot="watch-flash"][data-flash]')
        if (tail) {
          const cell = tail.closest('td')!
          return { tail: tail.textContent, whole: cell.textContent, cellFlash: cell.dataset.flash ?? null }
        }
      }
      return null
    })
    expect(seen, '来过价格变动').not.toBeNull()
    expect(seen!.whole!.endsWith(seen!.tail!)).toBe(true)
    expect(seen!.tail!.length).toBeLessThan(seen!.whole!.length + 1)
    expect(seen!.cellFlash, '价格格本身不带 data-flash').toBeNull()
  })
})
