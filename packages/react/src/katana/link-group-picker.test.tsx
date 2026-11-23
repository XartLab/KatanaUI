// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { LinkGroupPicker } from './link-group-picker.tsx'

// #150 G8：联动组选择件的结构（按钮名、灯色）。点开菜单、选组在组件截图测试里用真浏览器走（browser/readouts.browser.test.tsx）。
describe('LinkGroupPicker', () => {
  const labels = { trigger: 'Link group', none: 'Unlinked', groups: { A: 'Group A' } }

  it('按钮名是「读屏名: 当前组」，灯是那一组的颜色；没给名字的组写字母', () => {
    const html = renderToStaticMarkup(<LinkGroupPicker value="A" onValueChange={() => {}} labels={labels} />)
    expect(html).toContain('aria-label="Link group: Group A"')
    expect(html).toContain('data-group="A"')
    expect(html).toContain('k-led link-a')
    expect(html).toContain('aria-haspopup="menu"')
    const other = renderToStaticMarkup(<LinkGroupPicker value="B" onValueChange={() => {}} labels={labels} />)
    expect(other).toContain('aria-label="Link group: B"')
  })

  it('不联动：名字是 none 的字，灯是一圈空环', () => {
    const html = renderToStaticMarkup(<LinkGroupPicker value={null} onValueChange={() => {}} labels={labels} />)
    expect(html).toContain('aria-label="Link group: Unlinked"')
    expect(html).toContain('data-group="none"')
    expect(html).toMatch(/class="k-led bare"/)
  })
})
