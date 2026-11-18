// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 白板（#51）页的行为：拖动节点位置变、连线边数加一、撤销回退、选中节点下游高亮。只跑 Graphite（皮的像素由组件截图管）。
test.use({ viewport: { width: 1280, height: 1100 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/whiteboard')
  await page.locator('[data-gallery="whiteboard"]').waitFor()
}

test('白板：拖动节点位置变化、连线边数加一、撤销回退、选中节点下游高亮', async ({ page }) => {
  await open(page)
  const board = page.locator('[data-gallery="whiteboard"]').getByTestId('wb-frame').getByTestId('wb')
  const node = (id: string) => board.getByTestId(`rf__node-${id}`)
  const edgeCount = page.getByTestId('wb-edge-count')
  // 点空白处：右上角（工具条在左上，小地图在右下）。
  const blank = async () => {
    const pane = (await board.boundingBox())!
    await page.mouse.click(pane.x + pane.width - 30, pane.y + 60)
  }
  await expect(node('memo')).toBeVisible()
  await expect(edgeCount).toHaveText('6')

  // 拖动：便签往右下挪，位置变了。
  const start = (await node('memo').boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(start.x + start.width / 2 + 60, start.y + start.height / 2 + 40, { steps: 8 })
  await page.mouse.move(start.x + start.width / 2 + 120, start.y + start.height / 2 + 80, { steps: 8 })
  await page.mouse.up()
  const moved = (await node('memo').boundingBox())!
  expect(moved.x - start.x).toBeGreaterThan(60)
  expect(moved.y - start.y).toBeGreaterThan(30)

  // 连线：从「资金外流压汇率」的出点拖到便签的入点，边数 6 → 7。
  await node('fx').hover()
  const from = (await node('fx').locator('.react-flow__handle.source').boundingBox())!
  const to = (await node('memo').locator('.react-flow__handle.target').boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
  await page.mouse.up()
  await expect(edgeCount).toHaveText('7')

  // 撤销：先退掉连线，再退掉拖动（回到原位）；重做把拖动拿回来。
  await blank()
  await page.keyboard.press('Control+z')
  await expect(edgeCount).toHaveText('6')
  await page.keyboard.press('Control+z')
  await expect.poll(async () => Math.round((await node('memo').boundingBox())!.x)).toBe(Math.round(start.x))
  await board.getByRole('button', { name: '重做' }).click()
  await expect.poll(async () => Math.round((await node('memo').boundingBox())!.x)).toBe(Math.round(moved.x))

  // 选中「降息推高信用扩张」：下游（地产、汇率、资产价格）加亮，不相干的便签淡出；反馈边不算下游。
  await node('credit').click()
  await expect(page.getByTestId('wb-downstream')).toHaveText('house,fx,price')
  for (const id of ['house', 'fx', 'price'])
    await expect(node(id).locator('.k-wb-node')).toHaveAttribute('data-mark', 'downstream')
  await expect(node('memo').locator('.k-wb-node')).toHaveAttribute('data-mark', 'dim')
  await expect(node('credit').locator('.k-wb-node')).toHaveAttribute('data-mark', 'source')
  await expect(board.locator('[data-id="e3"] .k-wb-edge-line')).toHaveAttribute('data-mark', 'downstream')
  await expect(board.locator('[data-id="e6"] .k-wb-edge-line')).toHaveAttribute('data-mark', 'dim')
  // 点空白取消选中，高亮撤掉。
  await blank()
  await expect(node('house').locator('.k-wb-node')).not.toHaveAttribute('data-mark', /.+/)
})
