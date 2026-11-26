// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { DEFAULT_FONTS, fontVariables, fontsFor } from './font-catalog.ts'
import {
  DEFAULT_RENDERING,
  RENDERING_LABELS_ZH,
  RenderingSettings,
  applyRendering,
  readRendering,
  type RenderingSettingsValue,
} from './rendering-settings.tsx'

// 单测是 Node 环境：用一个只有属性与 style 读写的假节点代替 document.documentElement。
function fakeRoot() {
  const attrs = new Map<string, string>()
  const props = new Map<string, string>()
  const node = {
    attrs,
    props,
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
    removeAttribute: (name: string) => void attrs.delete(name),
    getAttribute: (name: string) => attrs.get(name) ?? null,
    style: {
      setProperty: (name: string, value: string) => void props.set(name, value),
      removeProperty: (name: string) => void props.delete(name),
      getPropertyValue: (name: string) => props.get(name) ?? '',
    },
  }
  return node as typeof node & HTMLElement
}

const changed: RenderingSettingsValue = {
  smoothing: 'system',
  pixelSnap: false,
  weightAdjust: -20,
  textScale: 1.1,
  slashedZero: true,
  cjkAdjust: true,
  fonts: { ...DEFAULT_FONTS, mono: fontsFor('mono').find((font) => font.kind !== 'system')!.id },
}

describe('RenderingSettings', () => {
  it('默认值写到根节点上什么也不留（属性与变量都移除）', () => {
    const root = fakeRoot()
    applyRendering(changed, root)
    applyRendering(DEFAULT_RENDERING, root)
    expect(root.attrs.size).toBe(0)
    expect(root.props.size).toBe(0)
  })

  it('写上去再读回来是同一份设置', () => {
    const root = fakeRoot()
    applyRendering(changed, root)
    expect(root.getAttribute('data-text-smoothing')).toBe('system')
    expect(root.getAttribute('data-pixel-snap')).toBe('off')
    expect(root.getAttribute('data-numerals')).toBe('slashed')
    expect(root.getAttribute('data-cjk-adjust')).toBe('cap')
    expect(root.style.getPropertyValue('--k-weight-adjust')).toBe('-20')
    expect(root.style.getPropertyValue('--k-text-scale')).toBe('1.1')
    expect(root.style.getPropertyValue('--font-mono')).toBe(fontVariables(changed.fonts)['--font-mono'])
    expect(readRendering(root)).toEqual(changed)
  })

  it('没写过的根节点读出默认值', () => {
    expect(readRendering(fakeRoot())).toEqual(DEFAULT_RENDERING)
  })

  it('每项一行：名称、说明、控件；滑块带读数，末尾有恢复默认', () => {
    const html = renderToStaticMarkup(<RenderingSettings value={DEFAULT_RENDERING} onValueChange={() => {}} />)
    // 六项设置加四个字体角色。
    expect(html.match(/data-slot="rendering-row"/g)).toHaveLength(10)
    expect(html).toContain(RENDERING_LABELS_ZH.pixelSnap)
    expect(html).toContain('<output class="k-render-out">0</output>')
    expect(html).toContain('<output class="k-render-out">100%</output>')
    expect(html).toContain(RENDERING_LABELS_ZH.reset)
  })

  it('三个单项设置是 role=switch，aria-checked 跟值；不再是「开 / 关」两段（kubai 020，#251）', () => {
    const switches = (value: RenderingSettingsValue) =>
      [
        ...renderToStaticMarkup(<RenderingSettings value={value} onValueChange={() => {}} />).matchAll(
          /<button\b[^>]*role="switch"[^>]*>/g,
        ),
      ].map((match) => ({
        name: /aria-label="([^"]*)"/.exec(match[0])?.[1],
        checked: /aria-checked="([^"]*)"/.exec(match[0])?.[1],
      }))
    expect(switches(DEFAULT_RENDERING)).toEqual([
      { name: RENDERING_LABELS_ZH.pixelSnap, checked: 'true' },
      { name: RENDERING_LABELS_ZH.zero, checked: 'false' },
      { name: RENDERING_LABELS_ZH.cjk, checked: 'false' },
    ])
    expect(switches(changed).map((item) => item.checked)).toEqual(['false', 'true', 'true'])
    const html = renderToStaticMarkup(<RenderingSettings value={DEFAULT_RENDERING} onValueChange={() => {}} />)
    // 只剩文字平滑一组分段（互斥的多选一）。
    expect(html.match(/data-slot="toggle-group"/g)).toHaveLength(1)
  })

  it('旧名 onChange（@deprecated）与 onValueChange 渲染相同', () => {
    expect(renderToStaticMarkup(<RenderingSettings value={changed} onChange={() => {}} />)).toBe(
      renderToStaticMarkup(<RenderingSettings value={changed} onValueChange={() => {}} />),
    )
  })
})
