// SPDX-License-Identifier: MIT
// 功能地图 features/floating-window.md：页内浮层的开、拖、方向键、Esc 关，状态不丢。真 PiP 路径由 e2e/floating-window.spec.ts 用桩验证。
export default {
  title: 'FloatingWindow：开、拖、方向键、关，状态不丢',
  page: 'floating-window',
  async run({ page, section, step, expect, aria }) {
    // 盖掉真 PiP：走页内浮层，截图里看得到。
    await page.evaluate(() =>
      Object.defineProperty(window, 'documentPictureInPicture', { value: undefined, configurable: true }),
    )
    const toggle = section.getByRole('button', { name: '在悬浮窗中交易' })
    const layer = page.getByRole('dialog', { name: '下单' })
    const handle = layer.getByRole('button', { name: /移动悬浮窗/ })
    const at = async () => {
      const box = await layer.boundingBox()
      return { x: Math.round(box.x), y: Math.round(box.y) }
    }

    await step('点「在悬浮窗中交易」：浮层出现，原位写已在悬浮窗中', async () => {
      await toggle.click()
      await expect(layer).toBeVisible()
      await expect(section.getByText('下单区已在悬浮窗中。')).toBeVisible()
      await aria(layer, 'floating-window-open.aria.yml')
      return { at: await at() }
    })
    await step('在浮层里填价格、点买入：已下 1 单', async () => {
      await layer.getByRole('textbox', { name: '价格' }).fill('95000')
      await layer.getByRole('button', { name: '买入' }).click()
      await expect(layer.getByText('已下 1 单')).toBeVisible()
      return { count: await layer.getByText(/已下 \d+ 单/).innerText() }
    })
    await step('拖标题栏：位置变；拖出视口：停在 0、0', async () => {
      const before = await at()
      const bar = await handle.boundingBox()
      await page.mouse.move(bar.x + 20, bar.y + 10)
      await page.mouse.down()
      await page.mouse.move(bar.x - 180, bar.y - 140, { steps: 4 })
      await page.mouse.up()
      const moved = await at()
      expect(moved).not.toEqual(before)
      const box = await handle.boundingBox()
      await page.mouse.move(box.x + 20, box.y + 10)
      await page.mouse.down()
      await page.mouse.move(-500, -500, { steps: 4 })
      await page.mouse.up()
      const clamped = await at()
      expect(clamped).toEqual({ x: 0, y: 0 })
      return { before, moved, clamped }
    })
    await step('方向键：→ 加 8，Shift+↓ 加 32', async () => {
      await handle.focus()
      await page.keyboard.press('ArrowRight')
      const right = await at()
      await page.keyboard.press('Shift+ArrowDown')
      const down = await at()
      expect(right.x).toBe(8)
      expect(down.y).toBe(32)
      return { right, down }
    })
    await step('Esc 关：内容回到原处，价格与计数还在', async () => {
      await page.keyboard.press('Escape')
      await expect(layer).toHaveCount(0)
      await expect(section.getByRole('textbox', { name: '价格' })).toHaveValue('95000')
      await expect(section.getByText('已下 1 单')).toBeVisible()
      return { price: await section.getByRole('textbox', { name: '价格' }).inputValue() }
    })
  },
}
