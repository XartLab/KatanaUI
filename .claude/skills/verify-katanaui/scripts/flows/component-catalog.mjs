// SPDX-License-Identifier: MIT
// 功能地图 features/component-catalog.md：menu 样式的折叠、添加、悬停与聚焦出原因。
export default {
  title: 'ComponentCatalog menu：折叠、添加、灰行的原因',
  page: 'component-catalog',
  async run({ page, section, step, expect, aria }) {
    const menu = section.locator('[data-variant="menu"]')

    await step('默认：第一组是推荐（订单簿、最新成交），图表与交易是灰的', async () => {
      await expect(menu.locator('[data-slot="catalog-group"]').first()).toHaveAttribute('data-group', 'recommended')
      await expect(menu.getByRole('button', { name: '订单簿' })).toBeVisible()
      await expect(menu.getByRole('button', { name: '图表 · 已添加此组件' })).toHaveAttribute('aria-disabled', 'true')
      await aria(menu, 'component-catalog-menu.aria.yml')
      return { groups: await menu.locator('[data-slot="catalog-group"]').count() }
    })
    await step('点「订单与仓位」标题：收起，当前仓位不可见；再点展开', async () => {
      await menu.getByRole('button', { name: '订单与仓位', expanded: true }).click()
      await expect(menu.getByRole('button', { name: '当前仓位' })).toBeHidden()
      await menu.getByRole('button', { name: '订单与仓位', expanded: false }).click()
      await expect(menu.getByRole('button', { name: '当前仓位' })).toBeVisible()
      return { expanded: await menu.getByRole('button', { name: '订单与仓位' }).getAttribute('aria-expanded') }
    })
    await step('点「当前仓位」：变灰写已添加；强点仍是灰的', async () => {
      await menu.getByRole('button', { name: '当前仓位', exact: true }).click()
      const added = menu.getByRole('button', { name: '当前仓位 · 已添加此组件' })
      await expect(added).toHaveAttribute('aria-disabled', 'true')
      await added.click({ force: true })
      await expect(added).toHaveAttribute('aria-disabled', 'true')
      return { disabled: await added.getAttribute('aria-disabled') }
    })
    await step('悬停灰行：出「已添加此组件」；挪开消失', async () => {
      const added = menu.getByRole('button', { name: '当前仓位 · 已添加此组件' })
      await page.mouse.move(0, 0)
      await added.hover()
      await expect(page.getByRole('tooltip')).toHaveText('已添加此组件')
      const shown = await page.getByRole('tooltip').innerText()
      await page.mouse.move(0, 0, { steps: 6 })
      await expect(page.getByRole('tooltip')).toHaveCount(0)
      return { shown }
    })
    await step('聚焦「公司」：出它自己的原因', async () => {
      const company = menu.getByRole('button', { name: '公司 · 组件不适用于当前市场' })
      await company.focus()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      await expect(company).toBeFocused()
      await expect(page.getByRole('tooltip')).toHaveText('组件不适用于当前市场')
      return { tooltip: await page.getByRole('tooltip').innerText() }
    })
  },
}
