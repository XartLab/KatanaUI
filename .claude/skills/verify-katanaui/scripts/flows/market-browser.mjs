// SPDX-License-Identifier: MIT
// 功能地图 features/market-browser.md：列头排序、搜索、星标进自选、点行选品种。
export default {
  title: 'MarketBrowser：排序、搜索、星标、选品种',
  page: 'market-browser',
  async run({ page, section, step, expect, aria }) {
    const symbols = () => section.locator('[data-slot="market-row"] .k-code-chip').allInnerTexts()
    const header = section.getByRole('columnheader', { name: /最新价/ })
    const picked = section.locator('[data-gallery-picked]')

    await step('打开 market-browser 页：「全部」选中，五行按原次序', async () => {
      await expect(section.getByRole('tab', { name: '全部' })).toHaveAttribute('aria-selected', 'true')
      await aria(section.getByRole('tablist'), 'market-browser-default.aria.yml')
      return { rows: await symbols() }
    })
    await step('点「最新价」三下：升序、降序、回原顺序', async () => {
      const seen = []
      for (const dir of ['ascending', 'descending', null]) {
        await header.getByRole('button').click()
        if (dir) await expect(header).toHaveAttribute('aria-sort', dir)
        else await expect(header).not.toHaveAttribute('aria-sort')
        seen.push({ aria: dir, first: (await symbols())[0] })
      }
      return seen
    })
    await step('搜索：填 sol 只剩 SOL-USDT，填 zzz 写没有匹配', async () => {
      const search = section.getByRole('searchbox', { name: '搜索币对' })
      await search.fill('sol')
      const found = await symbols()
      await search.fill('zzz')
      await expect(section.getByRole('status')).toHaveText('没有匹配的币对。')
      await search.fill('')
      return { found }
    })
    await step('星标：点「自选 ETH-USDT」，pressed 翻转、不选品种，自选页签多一行', async () => {
      const star = section.getByRole('button', { name: '自选 ETH-USDT' })
      await star.click()
      await expect(star).toHaveAttribute('aria-pressed', 'true')
      await expect(picked).toHaveText('点一行选品种')
      await section.getByRole('tab', { name: '自选' }).click()
      return { favorites: await symbols() }
    })
    await step('点第一行：页上写已选', async () => {
      await section.locator('[data-slot="market-row"]').first().click()
      await expect(picked).toContainText('已选：')
      return { picked: await picked.innerText() }
    })
  },
}
