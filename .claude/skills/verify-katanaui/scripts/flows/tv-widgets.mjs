// SPDX-License-Identifier: MIT
// 功能地图 features/tv-widgets.md：对照 TradingView 小组件补的四件（#154）——SymbolInfo、SymbolOverview、CrossRates、CompanyProfile。
// 从 #/symbol-info 开始，点左侧目录换到另外三页。SeasonalChart 不在这条里。
export default {
  title: 'TradingView 小组件四件：报价头、走势卡、交叉汇率、公司简介',
  page: 'symbol-info',
  async run({ page, section, step, expect, aria }) {
    const nav = (id) => page.getByRole('navigation', { name: '文档目录' }).locator(`a.k-sidenav-link[href="#/${id}"]`)
    const open = async (id) => {
      await nav(id).click()
      const area = page.locator(`[data-gallery="${id}"]`).first()
      await area.waitFor()
      return area
    }
    const minus = '[-−]'

    // SymbolInfo：两张报价头。
    const alpha = section.getByRole('region', { name: 'Alpha Devices quote' })
    const bravo = section.getByRole('region', { name: 'Bravo Semiconductor quote' })
    await step('SymbolInfo：代码、名称与交易所、状态灯、最新价与带符号的涨跌；两条区间 meter 指着最新价', async () => {
      await expect(alpha).toContainText('AAA')
      await expect(alpha).toContainText('Alpha Devices Incorporated · NASDAQ')
      await expect(alpha.getByRole('img', { name: 'Market open' })).toBeVisible()
      await expect(alpha.locator('[data-slot="symbol-info-price"]')).toHaveText('212.40')
      await expect(alpha.locator('[data-slot="symbol-info-change"]')).toHaveText(new RegExp(`^▼\\s*${minus}1\\.62$`))
      await expect(alpha).toContainText(new RegExp(`${minus}0\\.76%`))
      const day = alpha.getByRole('meter', { name: "Day's range" })
      const year = alpha.getByRole('meter', { name: '52 week range' })
      await expect(day).toHaveAttribute('aria-valuenow', '212.4')
      await expect(day).toHaveAttribute('aria-valuemin', '209.8')
      await expect(day).toHaveAttribute('aria-valuemax', '215.35')
      await expect(year).toHaveAttribute('aria-valuenow', '212.4')
      await expect(alpha.getByText('Delayed 15 min')).toBeVisible()
      await aria(alpha, 'symbol-info.aria.yml')
      return {
        price: await alpha.locator('[data-slot="symbol-info-price"]').innerText(),
        change: await alpha.locator('[data-slot="symbol-info-change"]').innerText(),
        day: await day.getAttribute('aria-valuetext'),
        year: await year.getAttribute('aria-valuetext'),
      }
    })
    await step('SymbolInfo 第二张：休市灯、千分位价格、涨时带 +，没给区间就没有 meter', async () => {
      await expect(bravo.getByRole('img', { name: 'Market closed' })).toBeVisible()
      await expect(bravo.locator('[data-slot="symbol-info-price"]')).toHaveText('1,044.10')
      // 涨跌额前面带方向三角（▲ / ▼），不只靠颜色。
      await expect(bravo.locator('[data-slot="symbol-info-change"]')).toHaveText(/^▲\s*\+12\.40$/)
      await expect(bravo).toContainText('+1.20%')
      await expect(bravo.getByRole('meter')).toHaveCount(0)
      return {
        price: await bravo.locator('[data-slot="symbol-info-price"]').innerText(),
        change: await bravo.locator('[data-slot="symbol-info-change"]').innerText(),
        meters: await bravo.getByRole('meter').count(),
      }
    })

    // SymbolOverview：price 与 percent 两张。
    let overview
    let priceCard
    let percentCard
    await step('目录里点 SymbolOverview，price 卡点页签「IDXB」：选中换过去，图是它的', async () => {
      overview = await open('symbol-overview')
      priceCard = overview.locator('[data-slot="symbol-overview"]').nth(0)
      percentCard = overview.locator('[data-slot="symbol-overview"]').nth(1)
      const tabs = priceCard.getByRole('tablist', { name: 'Symbols' })
      await expect(tabs.getByRole('tab', { selected: true })).toContainText('IDXA')
      await tabs.getByRole('tab', { name: /^IDXB / }).click()
      await expect(tabs.getByRole('tab', { name: /^IDXB / })).toHaveAttribute('aria-selected', 'true')
      await expect(priceCard.getByRole('tabpanel')).toHaveAccessibleName(/^IDXB /)
      const slider = priceCard.getByRole('slider', { name: 'Price chart' })
      // 没有读数时滑块停在最后一个点（2026-01-02 起 120 天，到 05-01）。
      await expect(slider).toHaveAttribute('aria-valuenow', '119')
      await expect(slider).toHaveAttribute('aria-valuetext', /^05-01\s+IDXB 18,839\.15$/)
      return {
        selected: (await tabs.getByRole('tab', { selected: true }).innerText()).replaceAll('\n', ' '),
        valuetext: await slider.getAttribute('aria-valuetext'),
      }
    })
    await step('聚焦走势按 Home / → / Shift+→ / End：读数跟着走，出 LCD 读数框；Esc 清掉', async () => {
      const slider = priceCard.getByRole('slider', { name: 'Price chart' })
      const tip = priceCard.locator('[data-slot="lcd-tooltip"]')
      await expect(tip).toHaveCount(0)
      await slider.focus()
      const seen = []
      for (const [key, now] of [
        ['Home', '0'],
        ['ArrowRight', '1'],
        ['Shift+ArrowRight', '4'],
        ['End', '119'],
      ]) {
        await page.keyboard.press(key)
        await expect(slider).toHaveAttribute('aria-valuenow', now)
        await expect(tip).toBeVisible()
        seen.push(`${key}→${now} ${await slider.getAttribute('aria-valuetext')}`)
      }
      await expect(slider).toHaveAttribute('aria-valuetext', /^05-01/)
      await page.keyboard.press('Home')
      await expect(slider).toHaveAttribute('aria-valuetext', /^01-02/)
      await page.keyboard.press('Escape')
      await expect(tip).toHaveCount(0)
      await expect(slider).toHaveAttribute('aria-valuenow', '119')
      return { seen, afterEsc: await slider.getAttribute('aria-valuenow') }
    })
    await step('区间点「1Y」：它变成按下、「3M」弹起', async () => {
      const ranges = priceCard.getByRole('group', { name: 'Date range' })
      await expect(ranges.getByRole('button', { name: '3M', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await ranges.getByRole('button', { name: '1Y', exact: true }).click()
      await expect(ranges.getByRole('button', { name: '1Y', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(ranges.getByRole('button', { name: '3M', exact: true })).toHaveAttribute('aria-pressed', 'false')
      return { pressed: await ranges.locator('[aria-pressed="true"]').innerText() }
    })
    await step(
      'percent 卡：三只叠成三条线、选中的那条加粗；按 End 读最后一刻，三只的涨跌幅与页签上写的一致',
      async () => {
        await expect(percentCard.locator('[data-slot="symbol-overview-line"]')).toHaveCount(3)
        await expect(percentCard.locator('[data-slot="symbol-overview-line"].is-selected')).toHaveCount(1)
        await expect(percentCard.locator('.k-symov-swatch')).toHaveCount(3)
        const tabPct = {}
        for (const text of await percentCard.getByRole('tab').allInnerTexts()) {
          const [symbol] = text.trim().split(/\s+/)
          tabPct[symbol] = Number(text.trim().split(/\s+/).at(-1).replace('−', '-').replace('%', ''))
        }
        const slider = percentCard.getByRole('slider', { name: 'Comparison chart' })
        await slider.focus()
        await page.keyboard.press('End')
        const text = await slider.getAttribute('aria-valuetext')
        const read = Object.fromEntries(
          [...text.matchAll(/(IDX[A-C]) ([-+−]?\d+\.\d{2})%/g)].map((m) => [m[1], Number(m[2].replace('−', '-'))]),
        )
        expect(Object.keys(read).toSorted()).toEqual(['IDXA', 'IDXB', 'IDXC'])
        for (const symbol of Object.keys(read)) expect(read[symbol], symbol).toBeCloseTo(tabPct[symbol], 2)
        await page.keyboard.press('Escape')
        return { tabs: tabPct, readout: text }
      },
    )

    // CrossRates：rates、heatmap、未连接。
    let rates
    let picked
    await step('目录里点 CrossRates：6 × 6 格，对角线不写数；点「EUR/USD」回调这一对，行头列头加亮', async () => {
      const area = await open('cross-rates')
      rates = area.getByRole('grid', { name: 'Cross rates' })
      picked = area.locator('[data-gallery-picked]')
      await expect(rates.locator('[data-slot="cross-rate"]')).toHaveCount(36)
      await expect(rates.locator('[data-slot="cross-rate"].is-diagonal')).toHaveCount(6)
      for (const text of await rates.locator('[data-slot="cross-rate"].is-diagonal').allInnerTexts())
        expect(text.trim()).toBe('')
      await expect(rates.getByRole('gridcell', { name: 'EUR/USD' })).toHaveText(/^1\.0830\s*\+0\.18%$/)
      await expect(rates.getByRole('gridcell', { name: 'USD/JPY' })).toHaveText(/^155\.28\s*\+0\.42%$/)
      await rates.getByRole('gridcell', { name: 'EUR/USD' }).click()
      await expect(picked).toHaveText('点的是：EUR/USD')
      await expect(rates.getByRole('rowheader', { name: 'EUR' })).toHaveClass(/is-hot/)
      await expect(rates.getByRole('columnheader', { name: 'USD' })).toHaveClass(/is-hot/)
      return {
        picked: await picked.innerText(),
        hot: await rates.locator('.k-xrates-head.is-hot').allInnerTexts(),
      }
    })
    await step(
      '键盘：→ 走到对角线、Enter 不回调；再 → 到 EUR/JPY、Enter 回调；↓↓ 到 GBP/JPY、Enter；Ctrl+End 到最后一格',
      async () => {
        const focusedPair = () => page.evaluate(() => document.activeElement?.getAttribute('data-pair'))
        await expect(rates.getByRole('gridcell', { name: 'EUR/USD' })).toBeFocused()
        await page.keyboard.press('ArrowRight')
        expect(await focusedPair()).toBe('EUR/EUR')
        await page.keyboard.press('Enter')
        await expect(picked).toHaveText('点的是：EUR/USD')
        await page.keyboard.press('ArrowRight')
        await expect(rates.getByRole('gridcell', { name: 'EUR/JPY' })).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(picked).toHaveText('点的是：EUR/JPY')
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowDown')
        await expect(rates.getByRole('gridcell', { name: 'GBP/JPY' })).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(picked).toHaveText('点的是：GBP/JPY')
        await page.keyboard.press('Control+End')
        expect(await focusedPair()).toBe('AUD/AUD')
        return { picked: await picked.innerText(), focus: await focusedPair() }
      },
    )
    await step(
      'heatmap 卡只写涨跌幅、按涨跌上色（最强与最弱的格底色不同）；「未连接」那张写 Not connected',
      async () => {
        const area = page.locator('[data-gallery="cross-rates"]').first()
        const heat = area.getByRole('grid', { name: 'Currency heatmap' })
        await expect(heat.getByRole('gridcell', { name: 'AUD/JPY' })).toHaveText('+1.08%')
        await expect(heat.getByRole('gridcell', { name: 'JPY/AUD' })).toHaveText('-1.07%')
        const bg = (name) =>
          heat.getByRole('gridcell', { name, exact: true }).evaluate((e) => getComputedStyle(e).backgroundColor)
        const up = await bg('AUD/JPY')
        const down = await bg('JPY/AUD')
        expect(up).not.toBe(down)
        await expect(area.getByText('Not connected', { exact: true })).toBeVisible()
        return { up, down, empty: await area.getByText('Not connected', { exact: true }).innerText() }
      },
    )

    // CompanyProfile：有数据可展开、未连接。
    await step('目录里点 CompanyProfile：四项事实，正文折成 3 行，点「Show more」展开、再点收起', async () => {
      const area = await open('company-profile')
      const card = area.getByRole('region', { name: 'Alpha Devices Incorporated' })
      await expect(card.getByRole('heading', { level: 3 })).toHaveText('Alpha Devices Incorporated')
      await expect(card.getByRole('term')).toHaveText(['Sector', 'Industry', 'Employees (FY)', 'Headquarters'])
      await expect(card.getByRole('definition').first()).toHaveText('Electronic technology')
      const text = card.locator('[data-slot="company-profile-text"]')
      const more = card.getByRole('button', { name: 'Show more' })
      await expect(more).toHaveAttribute('aria-expanded', 'false')
      const folded = Math.round((await text.boundingBox()).height)
      await more.click()
      const less = card.getByRole('button', { name: 'Show less' })
      await expect(less).toHaveAttribute('aria-expanded', 'true')
      await expect.poll(async () => Math.round((await text.boundingBox()).height)).toBeGreaterThan(folded)
      const unfolded = Math.round((await text.boundingBox()).height)
      await less.click()
      await expect(card.getByRole('button', { name: 'Show more' })).toHaveAttribute('aria-expanded', 'false')
      await expect.poll(async () => Math.round((await text.boundingBox()).height)).toBe(folded)
      await aria(card, 'company-profile.aria.yml')
      return { folded, unfolded }
    })
    await step('「未连接」那张：只有公司名与 Not connected，没有展开钮', async () => {
      const area = page.locator('[data-gallery="company-profile"]').first()
      const card = area.getByRole('region', { name: 'Bravo Semiconductor' })
      await expect(card.locator('[data-slot="company-profile-empty"]')).toHaveText('Not connected')
      await expect(card.getByRole('button')).toHaveCount(0)
      await expect(card.getByRole('term')).toHaveCount(0)
      return { text: (await card.innerText()).replaceAll('\n', ' | ') }
    })
  },
}
