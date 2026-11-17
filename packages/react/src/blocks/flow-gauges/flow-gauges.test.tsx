// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { depthHeights, signedSpan } from './flow-gauges-model.ts'
import { FlowGauges } from './flow-gauges.tsx'

// 结构与纯函数；颜色读 token、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。G6 从 src/quant/quant-batch2.test.tsx 拆来。

describe('FlowGauges', () => {
  it('signedSpan：正数从中线往右、负数往左；越界贴边；null 不画', () => {
    expect(signedSpan(62)).toEqual({ left: 50, width: 31 })
    expect(signedSpan(-18)).toEqual({ left: 41, width: 9 })
    expect(signedSpan(250)).toEqual({ left: 50, width: 50 })
    expect(signedSpan(null)).toBeNull()
  })

  it('depthHeights：按两边最大的一档排；全空是 null（N/A）', () => {
    expect(depthHeights([10, 5], [20])).toEqual({ bids: [50, 25], asks: [100] })
    expect(depthHeights([], [])).toBeNull()
    expect(depthHeights([0], [0])).toBeNull()
  })

  it('窗口不足写 N/A、不画条、不填零；估算的写估算字并带 data-estimated', () => {
    const html = renderToStaticMarkup(
      <FlowGauges
        label="flow"
        gauges={[
          { kind: 'pressure', id: 'p', title: 'MP', value: null, valueText: '0' },
          { kind: 'priceChange', id: 'c', title: 'PC', value: 20, valueText: '+20', estimated: true },
          { kind: 'divergence', id: 'd', title: 'DD', rows: [{ window: '20m', cells: null, summary: 'no data' }] },
        ]}
      />,
    )
    expect(html).toContain('N/A')
    expect(html).not.toMatch(/>0</)
    expect(html).toContain('est.')
    expect(html).toContain('data-estimated="true"')
    expect(html).toContain('aria-label="20m: no data"')
  })
})
