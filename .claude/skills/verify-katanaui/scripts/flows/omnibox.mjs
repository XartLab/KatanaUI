// SPDX-License-Identifier: MIT
// 功能地图 features/omnibox.md：万能框的分类页签、作用域标签、意图检测、行尾提示与预览、⌘/Ctrl+↵ 新标签。
export default {
  title: 'Omnibox 万能框：页签、作用域标签、问句、预览与新标签',
  page: 'omnibox',
  async run({ page, section, step, expect, aria }) {
    // 预览卡要在面板两侧各留 280px：默认的 1100 宽放不下，卡会按设计不出来。
    await page.setViewportSize({ width: 1400, height: 1000 })
    const opener = section.getByTestId('omnibox-open')
    const dialog = page.getByRole('dialog', { name: '万能框' })
    const input = dialog.getByRole('combobox')
    const options = dialog.getByRole('option')
    const tab = (name) => dialog.getByRole('tab', { name })
    const scope = dialog.locator('[data-slot="omnibox-scope"]')
    const texts = (locator) => locator.allInnerTexts().then((list) => list.map((t) => t.replace(/\s+/g, ' ').trim()))

    await step('点「打开万能框」：对话框出现，页签带计数，空查询按类列出几条', async () => {
      await opener.click()
      await expect(dialog).toBeVisible()
      await expect(options.first()).toBeVisible()
      await expect(input).toBeFocused()
      await expect(dialog.getByRole('tab', { selected: true })).toContainText('全部')
      await aria(dialog, 'omnibox-open.aria.yml')
      return {
        tabs: await texts(dialog.getByRole('tab')),
        sections: await texts(dialog.locator('[cmdk-group-heading]')),
        placeholderExample: (await dialog.locator('[data-slot="omnibox-example"]').innerText()).trim(),
      }
    })
    await step('按 Tab：切到「品种」页签，焦点仍在输入框，只剩品种', async () => {
      await page.keyboard.press('Tab')
      await expect(tab('品种')).toHaveAttribute('aria-selected', 'true')
      await expect(input).toBeFocused()
      await expect(options).toHaveCount(7)
      return { selected: await texts(dialog.getByRole('tab', { selected: true })), rows: await options.count() }
    })
    await step('打「AAPL」：第一行是 AAPL，行尾提示「查看选项」，右侧出预览卡', async () => {
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.type('AAPL')
      await expect(options.first()).toHaveAttribute('data-omnibox-id', 'sym:AAPL')
      await expect(options.first()).toContainText('查看选项')
      await expect(dialog.locator('[data-slot="omnibox-preview"]')).toContainText('189.84')
      return { first: await texts(options.first()), preview: await texts(dialog.locator('[data-slot="omnibox-preview"]')) }
    })
    await step('回车：AAPL 变成输入框里的标签，结果换成对它的动作，页签收起', async () => {
      await page.keyboard.press('Enter')
      await expect(scope).toContainText('AAPL')
      await expect(options).toHaveText([/开图/, /下单草稿/, /看新闻/, /看期权链/, /加入自选/])
      await expect(dialog.getByRole('tab')).toHaveCount(0)
      await aria(dialog, 'omnibox-scope.aria.yml')
      return { scope: await texts(scope), actions: await texts(options), input: await input.inputValue() }
    })
    await step('空输入按退格：标签没了，回到全局的页签与结果', async () => {
      await page.keyboard.press('Backspace')
      await expect(scope).toHaveCount(0)
      await expect(dialog.getByRole('tab')).toHaveCount(6)
      await expect(options.first()).toBeVisible()
      return { scopes: await scope.count(), tabs: await dialog.getByRole('tab').count() }
    })
    await step('打问句「下周哪些持仓有财报？」：结果收起，右侧提示变「问」', async () => {
      await page.keyboard.type('下周哪些持仓有财报？')
      await expect(dialog.locator('[data-slot="omnibox-ask"]')).toContainText('问')
      await expect(dialog.locator('.k-omnibox-body-inner')).toHaveAttribute('inert', '')
      await expect.poll(async () => (await dialog.locator('.k-omnibox-panel').boundingBox()).height).toBeLessThan(60)
      return { ask: await texts(dialog.locator('[data-slot="omnibox-ask"]')) }
    })
    await step('回车：onAsk 收到问句，页上「提问」一行更新，对话框关上', async () => {
      await page.keyboard.press('Enter')
      await expect(section.getByTestId('omnibox-asked')).toHaveText('提问：下周哪些持仓有财报？')
      await expect(dialog).toBeHidden()
      return { asked: await section.getByTestId('omnibox-asked').innerText() }
    })
    await step('再开，高亮「AMD」，按住 Ctrl 回车：回调带「新标签」', async () => {
      await opener.click()
      await dialog.getByRole('option', { name: /AMD/ }).hover()
      const hint = dialog.locator('[aria-selected="true"] [data-slot="omnibox-hint"]')
      await expect(hint).toHaveText('查看选项')
      await page.keyboard.down('Control')
      await expect(hint).toHaveText('新标签打开')
      await page.keyboard.press('Enter')
      await page.keyboard.up('Control')
      await expect(dialog).toBeHidden()
      await expect(section.getByTestId('omnibox-log')).toHaveText('选择：AMD（新标签）')
      return { log: await section.getByTestId('omnibox-log').innerText() }
    })
  },
}
