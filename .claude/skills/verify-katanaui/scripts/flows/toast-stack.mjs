// SPDX-License-Identifier: MIT
// 功能地图 features/toast-stack.md：叠放提示的收拢、悬停展开、撤销就地变状态、键盘展开。
export default {
  title: 'ToastStack 叠放提示：收拢、展开、撤销就地变状态、键盘',
  page: 'toast-stack',
  async run({ page, section, step, expect, aria }) {
    const region = page.getByRole('region', { name: '叠放提示演示', exact: true })
    const items = region.locator('[data-slot="toast-stack-item"]')
    const boxes = () =>
      items.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect()
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
        }),
      )
    const opacities = () =>
      items.evaluateAll((els) => els.map((el) => Number(Number(getComputedStyle(el).opacity).toFixed(2))))
    // 弹簧停下：连续两次读到一样。
    const settle = async () => {
      let last = ''
      await expect
        .poll(async () => {
          const now = JSON.stringify(await boxes())
          const same = now === last
          last = now
          return same
        })
        .toBe(true)
    }
    const aside = () => page.mouse.move(2, 2)

    await step('连推三条：只有最新一条完整，后面两层露边', async () => {
      await section.getByRole('button', { name: '连推三条' }).click()
      await aside()
      await expect(items).toHaveCount(3)
      await settle()
      const o = await opacities()
      expect(o[2]).toBe(1)
      expect(o[1]).toBeLessThan(1)
      expect(o[0]).toBeLessThan(o[1])
      await expect(region).not.toHaveAttribute('data-expanded', '')
      return {
        boxes: await boxes(),
        opacities: o,
        front: await items.nth(2).locator('[data-slot="toast-title"]').innerText(),
      }
    })
    await step('指针移到最前面一条上：展开成列表（间距 8px）', async () => {
      await items.nth(2).hover({ position: { x: 40, y: 10 } })
      await expect(region).toHaveAttribute('data-expanded', '')
      await settle()
      const b = await boxes()
      expect(Math.abs(b[1].y + b[1].h + 8 - b[2].y)).toBeLessThanOrEqual(2)
      await aria(region, 'toast-stack-expanded.aria.yml')
      return { boxes: b, opacities: await opacities() }
    })
    await step('挪开：收回', async () => {
      await aside()
      await expect(region).not.toHaveAttribute('data-expanded', '')
      await settle()
      return { boxes: await boxes() }
    })
    await step('清空后推一条带撤销的，点「撤销」：原地变「已恢复」，条数不变', async () => {
      await section.getByRole('button', { name: '清空' }).click()
      await expect(items).toHaveCount(0)
      await section.getByRole('button', { name: '推一条带撤销的' }).click()
      await aside()
      await expect(items).toHaveCount(1)
      await items.first().getByRole('button', { name: '撤销' }).click()
      await aside()
      await expect(items).toHaveCount(1)
      const toast = items.first().locator('[data-slot="toast"]')
      await expect(toast.locator('[data-slot="toast-title"]')).toHaveText('已恢复')
      await expect(toast).toHaveAttribute('data-tone', 'ok')
      await expect(items.first().getByRole('button', { name: '关掉这条提示' })).toBeFocused()
      return { count: await items.count(), tone: await toast.getAttribute('data-tone') }
    })
    await step('结果态 2.4 秒后自己收', async () => {
      await expect(items).toHaveCount(0, { timeout: 6000 })
      return { count: await items.count() }
    })
    await step('推三条带撤销的，焦点在「清空」上按 Tab：展开，6 个钮依次走到', async () => {
      for (let i = 0; i < 3; i++) await section.getByRole('button', { name: '推一条带撤销的' }).click()
      await aside()
      await settle()
      await section.getByRole('button', { name: '清空' }).focus()
      await page.keyboard.press('Tab')
      await expect(region).toHaveAttribute('data-expanded', '')
      const seen = []
      for (let i = 0; i < 6; i++) {
        seen.push(
          await page.evaluate(() => {
            const el = document.activeElement
            return `${el?.getAttribute('aria-label') ?? el?.textContent}@${el?.closest('[data-toast-id]')?.getAttribute('data-toast-id')}`
          }),
        )
        await page.keyboard.press('Tab')
      }
      expect(seen.filter((s) => s.startsWith('撤销')).length).toBe(3)
      expect(seen.filter((s) => s.startsWith('关掉这条提示')).length).toBe(3)
      await expect(region).not.toHaveAttribute('data-expanded', '')
      return { seen }
    })
  },
}
