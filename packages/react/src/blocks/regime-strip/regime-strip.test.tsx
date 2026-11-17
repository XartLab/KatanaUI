// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RegimeBand, RegimeStrip, regimeSpans } from './regime-strip.tsx'

// 结构与纯函数；颜色读 token、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。G6 从 src/quant/quant-batch2.test.tsx 拆来。

describe('RegimeStrip', () => {
  const segments = [
    { from: 0, to: 50, state: 'a' },
    { from: 50, to: 100, state: 'b', estimated: true },
  ]
  const states = [
    { id: 'a', name: 'Trend', color: 1 as const },
    { id: 'b', name: 'Range', color: 2 as const },
  ]

  it('regimeSpans：默认在最早与最晚之间线性排，无缝；自定义 scale；倒过来或带外的段不画', () => {
    expect(regimeSpans(segments).map((s) => s && [s.left, s.width])).toEqual([
      [0, 0.5],
      [0.5, 0.5],
    ])
    expect(regimeSpans(segments, (t) => t / 200).map((s) => s?.width)).toEqual([0.25, 0.25])
    expect(regimeSpans([{ from: 5, to: 5, state: 'a' }], () => 0.3)).toEqual([null])
  })

  it('色只读 series token；估算的段带标记；图例每个状态写名字', () => {
    const html = renderToStaticMarkup(
      <RegimeStrip segments={segments} states={states} label="regimes" current="b" currentText="now" />,
    )
    expect(html).toContain('var(--series-1)')
    expect(html).toContain('var(--series-2)')
    expect(html).not.toMatch(/signal-|pnl-|#[0-9a-f]{3,6}/i)
    expect(html).toContain('data-estimated="true"')
    expect(html).toContain('Trend')
    expect(html).toContain('now')
    expect(html).toContain('est.')
  })

  it('RegimeBand 只画带；activeState 让别的段变淡；给 onPickState 图例才是按钮', () => {
    const band = renderToStaticMarkup(<RegimeBand segments={segments} states={states} label="r" activeState="a" />)
    expect(band).not.toContain('<ul')
    expect(band.match(/data-dim/g)).toHaveLength(1)
    const strip = renderToStaticMarkup(
      <RegimeStrip segments={segments} states={states} label="r" onPickState={() => {}} activeState="a" />,
    )
    expect(strip).toContain('aria-pressed="true"')
    expect(strip).toContain('aria-pressed="false"')
  })
})
