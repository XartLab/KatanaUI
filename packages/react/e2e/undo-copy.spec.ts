// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 撤销栈与复制图（#77 第 4 条）：在文档站的页上真点真按。复制图要剪贴板权限（Chromium 才能授予），读回剪贴板确认是 PNG。

test.use({ viewport: { width: 1100, height: 1200 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('useUndoStack：拖列宽合并成一步、Mod+Z 撤销、Mod+Shift+Z 重做、新操作清掉重做', async ({ page }) => {
  const area = await open(page, 'use-undo-stack')
  const demo = area.locator('[data-gallery-undo]').first()
  const undo = demo.getByRole('button', { name: /撤销/ })
  const redo = demo.getByRole('button', { name: /重做/ })
  const first = demo.locator('[data-slot="undo-columns"] > span').first()
  await expect(undo).toBeDisabled()
  await demo.getByRole('button', { name: '换列序' }).click()
  await expect(first).toHaveText('最新价')
  await expect(undo).toHaveText('撤销（1）')

  const width = async () => first.evaluate((el) => el.getBoundingClientRect().width)
  const before = await width()
  const slider = demo.getByRole('slider', { name: '列宽' })
  await slider.focus()
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight')
  await expect(undo).toHaveText('撤销（2）') // 连按四下只算一步
  await expect(undo).toHaveAttribute('title', '撤销 列宽')
  expect(await width()).toBeGreaterThan(before)

  await page.keyboard.press('ControlOrMeta+z')
  await expect(undo).toHaveText('撤销（1）')
  expect(await width()).toBe(before)
  await expect(redo).toHaveText('重做（1）')
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(undo).toHaveText('撤销（2）')

  await undo.click()
  await undo.click()
  await expect(first).toHaveText('代码')
  await expect(undo).toBeDisabled()
  await expect(redo).toHaveText('重做（2）')
  await demo.getByRole('button', { name: '换列序' }).click()
  await expect(redo).toBeDisabled()
})

test('复制图：相机钮把图拍成 PNG 写进剪贴板，提示「已复制图片」', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const area = await open(page, 'copy-toast')
  const chart = area.locator('[data-gallery-copy] figure').first()
  const camera = chart.getByRole('button', { name: '复制图片' })
  await expect(camera).toHaveAttribute('data-action', 'copy-image')
  await camera.click()
  const toast = page.locator('[data-slot="toast-viewport"] [data-slot="copy-toast"]')
  await expect(toast).toHaveAttribute('data-status', 'copied')
  await expect(toast).toContainText('已复制图片')
  const box = (await chart.boundingBox())!
  const tools = (await chart.locator('[data-slot="chart-actions"]').boundingBox())!
  // 工具条那一块不进图：那一块的像素都是底色（取左上角第一个像素当底色）。
  const png = await page.evaluate(
    async ({ x, y, w, h }) => {
      const [item] = await navigator.clipboard.read()
      const blob = await item!.getType('image/png')
      const image = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(image, 0, 0)
      const bg = ctx.getImageData(0, image.height - 1, 1, 1).data.join()
      const area = ctx.getImageData(x, y, w, h).data
      let foreign = 0
      for (let i = 0; i < area.length; i += 4)
        if ([area[i], area[i + 1], area[i + 2], area[i + 3]].join() !== bg) foreign++
      return { size: blob.size, width: image.width, height: image.height, foreign }
    },
    {
      x: Math.floor(tools.x - box.x),
      y: Math.floor(tools.y - box.y),
      w: Math.floor(tools.width),
      h: Math.floor(tools.height),
    },
  )
  expect(png.size).toBeGreaterThan(2000)
  expect(png.width).toBe(Math.ceil(box.width))
  expect(png.height).toBe(Math.ceil(box.height))
  expect(png.foreign, '工具条不该进图').toBe(0)
  // 复制时钮不禁用，焦点留在钮上。
  await expect(camera).toBeEnabled()
  await expect(camera).toBeFocused()
  // 关掉；也会自己收（2400ms）。
  await toast.getByRole('button', { name: '关掉提示' }).click()
  await expect(toast).toHaveCount(0)
})

test('复制图：剪贴板被拒就退回下载 PNG，提示写原因', async ({ page }) => {
  const area = await open(page, 'copy-toast')
  await page.evaluate(() => {
    navigator.clipboard.write = () => Promise.reject(new DOMException('denied', 'NotAllowedError'))
  })
  const download = page.waitForEvent('download')
  await area.locator('[data-gallery-copy] figure').first().getByRole('button', { name: '复制图片' }).click()
  expect((await download).suggestedFilename()).toBe('equity-curve.png')
  const toast = page.locator('[data-slot="toast-viewport"] [data-slot="copy-toast"]')
  await expect(toast).toHaveAttribute('data-status', 'downloaded')
  await expect(toast).toContainText('已改为下载 PNG')
  await expect(toast).toContainText('剪贴板权限被拒')
})
