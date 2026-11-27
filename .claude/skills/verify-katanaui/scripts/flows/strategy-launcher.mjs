// SPDX-License-Identifier: MIT
// 功能地图 features/strategy-launcher.md：点卡打开、键盘走卡、关风险提示。
export default {
  title: 'StrategyLauncher：点卡、键盘、关提示',
  page: 'strategy-launcher',
  async run({ page, section, step, expect, aria }) {
    const cards = section.getByRole('list').getByRole('button')
    const opened = section.locator('[data-gallery-opened]')
    const notice = section.getByRole('note')

    await step('打开 strategy-launcher 页：提示条可见，四张卡，只有一张带「新」', async () => {
      await expect(notice).toBeVisible()
      await expect(cards).toHaveCount(4)
      await expect(section.locator('[data-slot="launcher-new"]')).toHaveCount(1)
      await aria(section.getByRole('region', { name: '策略工具' }), 'strategy-launcher-default.aria.yml')
      return { cards: await cards.count(), notice: (await notice.innerText()).trim() }
    })
    await step('点「网格策略」：页脚写打开：grid', async () => {
      await cards.filter({ hasText: '网格策略' }).click()
      await expect(opened).toHaveText('打开：grid')
      return { opened: await opened.innerText() }
    })
    await step('键盘：Tab 到第二张按 Enter，再 Tab 到第三张按空格', async () => {
      await section.getByRole('button', { name: '关闭风险提示' }).focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await expect(opened).toHaveText('打开：dca')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Space')
      await expect(opened).toHaveText('打开：signal')
      return { opened: await opened.innerText() }
    })
    await step('关风险提示：提示条消失，卡还在', async () => {
      await section.getByRole('button', { name: '关闭风险提示' }).click()
      await expect(notice).toHaveCount(0)
      return { notice: await notice.count(), cards: await cards.count() }
    })
  },
}
