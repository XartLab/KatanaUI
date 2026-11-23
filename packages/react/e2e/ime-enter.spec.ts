// SPDX-License-Identifier: MIT
import { expect, test, type Locator, type Page } from '@playwright/test'

// 中文输入法上屏的 Enter（Safari：isComposing 已是 false，keyCode 仍是 229）不能当成「提交」。
// 这里用合成的 keydown 模拟这一下（真键盘敲不出这种事件），再用真 Enter 确认正常路径照旧。
// 修的是 inline-edit、tag-input、decision-tree 的「其他…」输入框（另外 use-type-to-search 与 use-undo-stack 补判见单测）。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

/** 模拟输入法上屏的 Enter：isComposing 为 false、keyCode 为 229；返回有没有被 preventDefault（被组件当成提交会为 true）。 */
const imeEnter = (field: Locator) =>
  field.evaluate((el) => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: false })
    Object.defineProperty(event, 'keyCode', { value: 229 })
    el.dispatchEvent(event)
    return event.defaultPrevented
  })

test('InlineEdit：上屏的 Enter（keyCode 229）不保存，真 Enter 保存', async ({ page }) => {
  const area = await open(page, 'inline-edit')
  await area.getByRole('button', { name: /自选分组名/ }).click()
  const field = area.getByRole('textbox', { name: '自选分组名' })
  await field.fill('新分组')
  expect(await imeEnter(field)).toBe(false)
  await expect(field).toBeVisible()
  await expect(area.locator('[data-gallery-inline]')).toHaveText('已存：核心持仓')
  await field.press('Enter')
  await expect(area.locator('[data-gallery-inline]')).toHaveText('已存：新分组')
})

test('TagInput：上屏的 Enter（keyCode 229）不收标签，真 Enter 收', async ({ page }) => {
  const area = await open(page, 'tag-input')
  const field = area.getByRole('textbox', { name: '品种代码' }).first()
  const out = area.locator('[data-gallery-tags]')
  await field.fill('300750')
  expect(await imeEnter(field)).toBe(false)
  await expect(out).toHaveText('2 个：600519 000001')
  await expect(field).toHaveValue('300750')
  await field.press('Enter')
  await expect(out).toHaveText('3 个：600519 000001 300750')
})

test('DecisionTree「其他…」：上屏的 Enter（keyCode 229）不发出，真 Enter 发出', async ({ page }) => {
  const area = await open(page, 'decision-tree')
  await area
    .getByRole('button', { name: /其他…/ })
    .first()
    .click()
  const field = area.getByRole('textbox', { name: '写一句指示给 Agent' })
  await field.fill('先减半仓')
  expect(await imeEnter(field)).toBe(false)
  await expect(area.locator('[data-slot="decision-reply"]')).toHaveCount(0)
  await field.press('Enter')
  await expect(area.locator('[data-slot="decision-reply"]').first()).toContainText('先减半仓')
})
