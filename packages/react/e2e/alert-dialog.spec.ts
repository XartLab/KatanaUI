// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 确认对话框（KatanaUI #236）：在文档站的页上真点真按，断言用户碰得到的行为——
// 焦点先落在「取消」、点背板不关、Esc 与取消不触发确认、确认只触发一次、关后焦点回触发器、确认钮是危险色、Console 下边比 Dialog 粗一档、sm 是 320 宽。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, theme: 'graphite' | 'console' = 'graphite') => {
  await page.goto(`/?theme=${theme}#/alert-dialog`)
  const area = page.locator('[data-gallery="alert-dialog"]')
  await area.waitFor()
  return area
}

test('打开时焦点在取消；点背板不关；Esc 关掉、不触发确认、焦点回触发器', async ({ page }) => {
  const area = await open(page)
  const trigger = area.getByRole('button', { name: '平仓', exact: true })
  const last = area.getByTestId('alert-dialog-last')
  await trigger.click()
  const dialog = page.getByRole('alertdialog', { name: '平掉 BTCUSDT 多单' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '取消' }), '打开时焦点落在取消').toBeFocused()

  // 点背板（对话框外、页面左上角）：Dialog 会关，确认对话框不关。
  await page.mouse.click(8, 8)
  await expect(dialog, '点背板不关').toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(last, 'Esc 不按任何钮').toHaveText('最后一次：还没选')
  await expect(area.getByTestId('alert-dialog-confirms'), 'Esc 不算确认').toHaveText('确认 0 次')
  await expect(trigger, '关后焦点回触发器').toBeFocused()
})

test('取消只记取消；确认只记一次并关闭；确认钮是危险色', async ({ page }) => {
  const area = await open(page)
  const trigger = area.getByRole('button', { name: '平仓', exact: true })
  const last = area.getByTestId('alert-dialog-last')
  const confirms = area.getByTestId('alert-dialog-confirms')
  const dialog = page.getByRole('alertdialog', { name: '平掉 BTCUSDT 多单' })

  await trigger.click()
  await dialog.getByRole('button', { name: '取消' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(last).toHaveText('最后一次：取消')
  await expect(confirms, '取消不算确认').toHaveText('确认 0 次')

  await trigger.click()
  const action = dialog.getByRole('button', { name: '平仓' })
  // 危险色：字色等于 --k-actionable-negative-foreground 解析出来的颜色（variant 丢了会退回 primary，颜色对不上）。
  const negative = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.color = 'var(--k-actionable-negative-foreground)'
    document.body.append(probe)
    const value = getComputedStyle(probe).color
    probe.remove()
    return value
  })
  await expect(action, '确认钮是危险色').toHaveCSS('color', negative)
  await action.click()
  await expect(dialog).toHaveCount(0)
  await expect(last).toHaveText('最后一次：平仓')
  await expect(confirms, '确认只触发一次').toHaveText('确认 1 次')
})

// Graphite 的浮层一律是玻璃边（theme/graphite.css，分组不靠边框），粗边只在 Console 下有。
test('Console 下边比 Dialog 粗一档（确认类的分隔色）；sm 是 320 宽、default 是 560 宽', async ({ page }) => {
  const area = await open(page, 'console')
  await area.getByRole('button', { name: '平仓', exact: true }).click()
  const wide = page.getByRole('alertdialog', { name: '平掉 BTCUSDT 多单' })
  await expect(wide).toBeVisible()
  // 等升起动画走完再量（动画里有缩放）。
  await wide.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined))))
  expect((await wide.boundingBox())!.width).toBeCloseTo(560, 0)
  const bold = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.color = 'var(--k-separable-bold-borderColor)'
    document.body.append(probe)
    const value = getComputedStyle(probe).color
    probe.remove()
    return value
  })
  await expect(wide, '边是粗一档的分隔色').toHaveCSS('border-top-color', bold)
  await page.keyboard.press('Escape')
  await expect(wide).toHaveCount(0)

  await area.getByRole('button', { name: '删除自选列表' }).click()
  const narrow = page.getByRole('alertdialog', { name: '删除「加密主流」' })
  await expect(narrow).toBeVisible()
  await narrow.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined))))
  expect((await narrow.boundingBox())!.width).toBeCloseTo(320, 0)
})
