// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 前向测试与回放的件（#121）：组合运行表的行内动作、回放控制条的播放键与倍速、模式徽标四种。

test.use({ viewport: { width: 1200, height: 1000 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('PortfolioRunGrid：点暂停回调收到该品种，暂停行换成恢复、平掉仍可点', async ({ page }) => {
  const area = await open(page, 'portfolio-run-grid')
  const last = page.getByTestId('run-last')
  await area.getByRole('button', { name: '暂停' }).first().click()
  await expect(last).toHaveText('最后一次动作：已暂停 · DEMO-A')
  const paused = area.locator('.is-paused').filter({ hasText: 'DEMO-A' })
  await expect(paused).toHaveCount(1)
  await expect(paused.getByRole('button', { name: '平掉' })).toBeEnabled()
  await paused.getByRole('button', { name: '恢复' }).click()
  await expect(last).toHaveText('最后一次动作：已恢复 · DEMO-A')
  await expect(area.locator('.is-paused').filter({ hasText: 'DEMO-A' })).toHaveCount(0)
})

test('ReplayTransport：播放键切换、倍速选中、同步提示', async ({ page }) => {
  const area = await open(page, 'replay-transport')
  const transport = area.locator('[data-slot="replay-transport"]').first()
  await expect(transport).toContainText('同步中 · 3 个面板')
  await transport.getByRole('button', { name: '播放' }).click()
  await expect(transport.getByRole('button', { name: '暂停' })).toBeVisible()
  await transport.getByRole('button', { name: '10×' }).click()
  await expect(transport.getByRole('button', { name: '10×' })).toHaveAttribute('aria-pressed', 'true')
})

test('RunModeBadge：四种模式各一个样子', async ({ page }) => {
  const area = await open(page, 'run-mode-badge')
  for (const mode of ['paper', 'replay', 'forward', 'live'])
    await expect(area.locator(`[data-slot="run-mode-badge"][data-mode="${mode}"]`).first()).toBeVisible()
})
