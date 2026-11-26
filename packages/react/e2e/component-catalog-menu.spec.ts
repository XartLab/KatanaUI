// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// ComponentCatalog variant="menu"（#245 模块 2）：在文档站的页上真点真按，断言看得见的行为与 ARIA。

test.use({ viewport: { width: 1100, height: 1400 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/component-catalog')
  const area = page.locator('[data-gallery="component-catalog"]')
  await area.waitFor()
  return area.locator('[data-variant="menu"]')
}

test('ComponentCatalog menu：分组可折叠；点一行添加；灰的行点不动，悬停与聚焦都出原因', async ({ page }) => {
  const menu = await open(page)
  // 推荐一组在最前：图表已在用，不推荐；订单簿与最新成交声明了 pairsWith 图表。
  const names = menu.locator('[data-slot="catalog-group"]')
  await expect(names.nth(0)).toHaveAttribute('data-group', 'recommended')
  await expect(names.nth(0).getByRole('button', { name: '订单簿' })).toBeVisible()

  // 折叠与展开。
  const toggle = menu.getByRole('button', { name: '订单与仓位', expanded: true })
  await expect(menu.getByRole('button', { name: '当前仓位' })).toBeVisible()
  await toggle.click()
  await expect(menu.getByRole('button', { name: '订单与仓位', expanded: false })).toBeVisible()
  await expect(menu.getByRole('button', { name: '当前仓位' })).toBeHidden()
  await menu.getByRole('button', { name: '订单与仓位' }).click()
  await expect(menu.getByRole('button', { name: '当前仓位' })).toBeVisible()

  // 点一行添加：它变灰（已添加），再点没反应。
  const positions = menu.getByRole('button', { name: '当前仓位', exact: true })
  await positions.click()
  const added = menu.getByRole('button', { name: '当前仓位 · 已添加此组件' })
  await expect(added).toHaveAttribute('aria-disabled', 'true')
  await added.click({ force: true }) // aria-disabled 的钮 Playwright 当作不可用，要强点才能证明「点了没反应」
  await expect(added).toHaveAttribute('aria-disabled', 'true')

  // 悬停已添加的行：提示写「已添加此组件」。
  await page.mouse.move(0, 0) // 刚点过，指针还在行上：先挪开再移进来，Radix 提示才收得到 pointermove
  await added.hover()
  await expect(page.getByRole('tooltip')).toHaveText('已添加此组件')
  await page.mouse.move(0, 0, { steps: 6 })
  await expect(page.getByRole('tooltip')).toHaveCount(0)

  // 键盘聚焦不可用的行：提示写它自己的原因；行仍可聚焦（aria-disabled，不是 disabled）。
  const company = menu.getByRole('button', { name: '公司 · 组件不适用于当前市场' })
  await expect(company).toHaveAttribute('aria-disabled', 'true')
  await company.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(company).toBeFocused()
  await expect(page.getByRole('tooltip')).toHaveText('组件不适用于当前市场')
  await expect(company).toHaveCSS('opacity', '0.6')
})

test('ComponentCatalog：抽屉样式仍是默认，页上两种并排', async ({ page }) => {
  await page.goto('/?theme=graphite#/component-catalog')
  const area = page.locator('[data-gallery="component-catalog"]')
  await area.waitFor()
  await expect(area.locator('[data-variant="menu"]')).toHaveCount(1)
  await expect(area.getByRole('searchbox', { name: 'Search components' })).toBeVisible()
  await expect(area.getByRole('tab', { name: 'Market' })).toBeVisible()
})
