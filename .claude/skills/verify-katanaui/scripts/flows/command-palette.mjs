// SPDX-License-Identifier: MIT
// 功能地图 features/command-palette.md：命令面板的行内说明、「2 步」徽标与多步命令（#194）。
export default {
  title: '命令面板：多步命令「批量导出」从徽标走到 onRun',
  page: 'command-palette',
  async run({ page, section, step, expect, aria }) {
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement
        return el ? `${el.tagName.toLowerCase()}「${(el.textContent ?? '').trim().slice(0, 20)}」` : null
      })
    const trigger = section.getByRole('button', { name: /命令面板/ })
    const palette = page.getByRole('dialog', { name: '命令面板' })
    const steps = palette.locator('[data-slot="command-steps"]')
    const tags = palette.locator('[data-slot="command-steps-tag"]')
    const count = palette.locator('[data-slot="command-steps-count"]')
    const all = palette.getByRole('checkbox', { name: '全选' })
    const primary = palette.getByRole('button', { name: '下一步' })
    const row = palette.getByRole('option', { name: /批量导出/ })

    await step('点「命令面板」：面板打开，「批量导出」行有灰色说明与「2 步」徽标', async () => {
      await trigger.click()
      await expect(palette).toBeVisible()
      await expect(row).toContainText('按市场与字段导出')
      await expect(row.locator('[data-slot="command-meta"]')).toHaveText('2 步')
      await aria(palette, 'palette-list.aria.yml')
      return { badge: await row.locator('[data-slot="command-meta"]').textContent() }
    })
    await step('↑↓ 走到「批量导出」，Enter：进第一步页，面板没关', async () => {
      for (let i = 0; i < 20 && (await row.getAttribute('aria-selected')) !== 'true'; i += 1) {
        await page.keyboard.press('ArrowDown')
      }
      await expect(row).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('Enter')
      await expect(steps).toHaveAttribute('data-step', 'market')
      await expect(palette).toBeVisible()
      return { step: await steps.getAttribute('data-step'), focus: await focused() }
    })
    await step('勾「美股」「港股」：头部两个标签、脚写「已选 2 项」、全选半选', async () => {
      await palette.getByRole('checkbox', { name: /^美股/ }).click()
      await palette.getByRole('checkbox', { name: /^港股/ }).click()
      await expect(tags).toHaveText(['美股', '港股'])
      await expect(count).toHaveText('已选 2 项')
      await expect(all).toHaveAttribute('aria-checked', 'mixed')
      await aria(palette, 'steps-two-checked.aria.yml')
      return { tags: await tags.allTextContents(), count: await count.textContent(), all: await all.getAttribute('aria-checked') }
    })
    await step('点全选：全部勾上；再点：全不勾，「下一步」禁用', async () => {
      await all.click()
      await expect(all).toHaveAttribute('aria-checked', 'true')
      await expect(count).toHaveText('已选 4 项')
      const afterFirst = await count.textContent()
      await all.click()
      await expect(all).toHaveAttribute('aria-checked', 'false')
      await expect(count).toHaveText('已选 0 项')
      await expect(primary).toBeDisabled()
      return { afterFirst, afterSecond: await count.textContent(), primaryDisabled: await primary.isDisabled() }
    })
    await step('勾「美股」，输入框为空按 Backspace：回命令列表，再进来选择是空的', async () => {
      await palette.getByRole('checkbox', { name: /^美股/ }).click()
      await page.keyboard.press('Backspace')
      await expect(steps).toHaveCount(0)
      await expect(row).toBeVisible()
      for (let i = 0; i < 20 && (await row.getAttribute('aria-selected')) !== 'true'; i += 1) {
        await page.keyboard.press('ArrowDown')
      }
      await page.keyboard.press('Enter')
      await expect(count).toHaveText('已选 0 项')
      await expect(tags).toHaveCount(0)
      return { count: await count.textContent(), tags: await tags.count() }
    })
    await step('勾「美股」「港股」点「下一步」：第二步，头部句子带上一步的选择', async () => {
      await palette.getByRole('checkbox', { name: /^美股/ }).click()
      await palette.getByRole('checkbox', { name: /^港股/ }).click()
      await primary.click()
      await expect(steps).toHaveAttribute('data-step', 'fields')
      await palette.getByRole('checkbox', { name: /^开高低收/ }).click()
      await expect(palette.locator('[data-slot="command-steps-tag"]')).toHaveText(['美股', '港股', '开高低收'])
      return { tags: await tags.allTextContents() }
    })
    await step('点「导出」：面板关，页上回执含各步选择，焦点回到「命令面板」钮', async () => {
      await palette.getByRole('button', { name: '导出' }).click()
      await expect(palette).toBeHidden()
      const log = section.getByTestId('palette-log')
      await expect(log).toContainText('batch-export：market=us,hk · fields=ohlc')
      await expect(trigger).toBeFocused()
      return { log: await log.textContent(), focus: await focused() }
    })
  },
}
