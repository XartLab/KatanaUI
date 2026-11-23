// SPDX-License-Identifier: MIT
// 联动组（#150 G8）的组件截图：三张小件分两组，点组 A 里的品种后同组跟着换、组 B 不动；选择件的五种样子与打开的组菜单。
import { describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { LINK_LABELS, LinkGroupPanels, LinkGroupPickerStates } from '../gallery/pages/link-group.tsx'
import { LinkGroupPicker } from '../src/katana/link-group-picker.tsx'
import { OpenFrame } from './open-frame.tsx'
import { mount } from './render.tsx'

// 等 ToggleGroup 的选中块滑过去、菜单的进场动效走完；换品种后迷你图末端点的光晕（--dur-flash 600ms）也要走完。
const settle = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const symbolOf = (panel: string) =>
  document.querySelector(`[data-gallery-link-panel="${panel}"]`)?.getAttribute('data-symbol')

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    test('link-group', async () => {
      await page.viewport(800, 340)
      await mount(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LinkGroupPanels />
        </div>,
        theme,
      )
      expect([symbolOf('报价'), symbolOf('迷你图'), symbolOf('说明')]).toEqual(['AAA', 'AAA', 'CCC'])
      // 在「报价」（组 A）里点 BBB：同组的「迷你图」跟着换，组 B 的「说明」不动。
      await page.getByRole('group', { name: '报价：换品种' }).getByRole('button', { name: 'BBB' }).click()
      await settle(1200)
      expect([symbolOf('报价'), symbolOf('迷你图'), symbolOf('说明')]).toEqual(['BBB', 'BBB', 'CCC'])
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-link-group`)
    })
    test('link-group-picker', async () => {
      await mount(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <LinkGroupPickerStates />
          </div>
          <OpenFrame width={200} height={230}>
            <LinkGroupPicker value="B" onValueChange={() => {}} labels={LINK_LABELS} />
          </OpenFrame>
        </div>,
        theme,
      )
      await page.getByRole('button', { name: '联动组: 组 B' }).last().click()
      await settle()
      await expect.element(page.getByRole('menuitemradio', { name: '组 B' })).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-link-group-picker`)
    })
  })
}
