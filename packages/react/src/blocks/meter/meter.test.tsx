// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { Meter, meterShare } from './meter.tsx'

// 结构与纯函数；颜色读 token、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。G6 从 src/quant/quant-batch2.test.tsx 拆来。

describe('Meter', () => {
  it('meterShare 越界贴边、非有限数按 0', () => {
    expect(meterShare(50)).toBe(0.5)
    expect(meterShare(150)).toBe(1)
    expect(meterShare(-3)).toBe(0)
    expect(meterShare(Number.NaN)).toBe(0)
    expect(meterShare(5, 0)).toBe(0)
  })

  it('bar：名字与数永远在，role=meter 带读数；默认写四舍五入的百分数；tone 写进 data-tone', () => {
    const html = renderToStaticMarkup(<Meter label="LOAD" value={72.4} tone="ok" />)
    expect(html).toContain('LOAD')
    expect(html).toContain('72%')
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="72.4"')
    expect(html).toContain('data-tone="ok"')
    expect(html).toContain('width:72.4%')
  })

  it('sync：右侧大百分比与琥珀刻度；刻度的读屏名进 valuetext', () => {
    const html = renderToStaticMarkup(<Meter label="PAPER" value={40} display="sync" mark={60} markLabel="review" />)
    expect(html).toContain('k-meter-big')
    expect(html).toContain('k-meter-mark')
    expect(html).toContain('left:60%')
    expect(html).toContain('review 60%')
  })

  it('gauge：指针位置、0 到 100 的五个刻度', () => {
    const html = renderToStaticMarkup(<Meter label="RS" value={94} display="gauge" />)
    expect(html).toContain('k-meter-pin')
    expect(html.match(/<span>\d+<\/span>/g)).toHaveLength(5)
  })
})
