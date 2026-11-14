// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ConsensusBlock, countConsensus, FlowGauges, RegimeBand, RegimeStrip } from './index.ts'
import { depthHeights, signedSpan } from './flow-gauges.tsx'
import { regimeSpans } from './regime-strip.tsx'

// 结构与纯函数；颜色读 token、data-updown 互换、阻止项有字，在浏览器里查（e2e/ui-gallery.spec.ts）。
// SparkTile 与 Meter 的单测在 quant.test.tsx 与 series.test.tsx（#1917 那一份），#1929 里重复的那两件没搬。

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

describe('ConsensusBlock', () => {
  const parties = [
    { key: 'g', label: 'GATEWAY', state: 'pass' as const, message: 'ok' },
    { key: 'a', label: 'ACCOUNT', state: 'blocked' as const, message: 'over cap', detail: 'limit 60' },
    { key: 'r', label: 'RULES', state: 'stale' as const, message: 'recheck' },
  ]

  it('countConsensus：未返回、超时、失效、评估中都不算通过', () => {
    expect(countConsensus(parties)).toEqual({ pass: 1, warn: 0, blocked: 1, open: 1 })
  })

  it('每一格有状态字（不只靠颜色）、一句话；阻止项的文字在标记里', () => {
    const html = renderToStaticMarkup(
      <ConsensusBlock label="c" parties={parties} verdict="blocked" verdictText="Blocked" hash={null} />,
    )
    expect(html).toContain('Blocked')
    expect(html).toContain('Re-check')
    expect(html).toContain('over cap')
    expect(html).toContain('data-verdict="blocked"')
    expect(html).toContain('—')
  })

  it('stateLabels 换字；有 detail 的格是按钮（aria-expanded），没有的不是', () => {
    const html = renderToStaticMarkup(
      <ConsensusBlock label="c" parties={parties} verdict="blocked" verdictText="x" stateLabels={{ blocked: 'NO' }} />,
    )
    expect(html).toContain('NO')
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('aria-expanded="false"')
  })

  it('不画 detail，点开才画（初始不在）；点 hash 要给回调才是按钮', () => {
    const html = renderToStaticMarkup(
      <ConsensusBlock label="c" parties={parties} verdict="ok" verdictText="ok" hash="7f3a" onHashClick={() => {}} />,
    )
    expect(html).not.toContain('limit 60')
    expect(html).toContain('<button type="button" class="k-consensus-hash">7f3a')
  })
})
