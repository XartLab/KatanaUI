// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { EmphasisProvider, type Emphasis } from '../layout/emphasis.tsx'
import { GaugeBar } from './gauge-bar.tsx'
import { PriceTag } from './price-tag.tsx'
import { QuoteCard } from './quote-card.tsx'

// 读数类认分量（#115）：hero 主角、standard 正文（默认）、compact 一行。分量只改字号档与显示多少，不改颜色。

const at = (emphasis: Emphasis | null, node: React.ReactNode) =>
  renderToStaticMarkup(emphasis ? <EmphasisProvider value={emphasis}>{node}</EmphasisProvider> : node)
// 行情件的样式在 G4 拆成每件一份（quote-card.css、price-tag.css、gauge-bar.css），这里拼起来一起查。
const quoteCss = ['quote-card', 'price-tag', 'gauge-bar']
  .map((name) => readFileSync(new URL(`../theme/${name}.css`, import.meta.url), 'utf8'))
  .join('\n')

const card = (
  <QuoteCard
    name="Alpha"
    symbol="AAA"
    price="11.80"
    change="+1.80"
    percent="+18.00%"
    tone="up"
    spark={[1, 3, 2, 5]}
    sparkLabel="走势"
    footer={<span>区间条</span>}
  />
)

describe('QuoteCard 的分量', () => {
  it('不包 Provider 与 standard 一样：全有（价、涨跌、迷你图、下面一行）', () => {
    const plain = at(null, card)
    expect(plain).toBe(at('standard', card))
    expect(plain).toContain('data-emphasis="standard"')
    expect(plain).toContain('k-quote-spark')
    expect(plain).toContain('k-quote-footer')
  })

  it('hero：数据属性变 hero，迷你图仍在；样式把价格换成 display 档', () => {
    const html = at('hero', card)
    expect(html).toContain('data-emphasis="hero"')
    expect(html).toContain('k-quote-spark')
    expect(quoteCss).toMatch(/\.k-quote-card\[data-emphasis='hero'\] \.k-quote-price \{\s*font: var\(--text-display\)/)
  })

  it('compact：名字、价格、涨跌还在，迷你图与下面一行不画', () => {
    const html = at('compact', card)
    expect(html).toContain('data-emphasis="compact"')
    for (const kept of ['Alpha', 'AAA', '11.80', '+1.80', '+18.00%']) expect(html).toContain(kept)
    expect(html).not.toContain('k-quote-spark')
    expect(html).not.toContain('k-quote-footer')
    expect(html).not.toContain('区间条')
    expect(quoteCss).toMatch(/\.k-quote-card\[data-emphasis='compact'\] \{\s*flex-direction: row;/)
  })

  it('可点的那种（按钮）也带分量；涨跌的颜色类不随分量变', () => {
    const html = at('compact', <QuoteCard name="A" price="1" tone="down" onSelect={() => {}} />)
    expect(html).toMatch(/^<button[^>]* data-emphasis="compact"/)
    for (const level of ['hero', 'standard', 'compact'] as const)
      expect(at(level, <QuoteCard name="A" price="1" tone="down" />)).toContain('is-down')
  })
})

describe('PriceTag 的分量', () => {
  const tag = <PriceTag name="Alpha" price="11.80" change="+1.5%" tone="up" />

  it('三档各带自己的数据属性，内容不变；样式 hero 用 display 档、compact 降到 caption 档', () => {
    for (const level of ['hero', 'standard', 'compact'] as const) {
      const html = at(level, tag)
      expect(html).toContain(`data-emphasis="${level}"`)
      expect(html).toContain('+1.5%')
    }
    expect(quoteCss).toMatch(
      /\.k-price-tag\[data-emphasis='hero'\] \.k-price-tag-price \{\s*font: var\(--text-display\)/,
    )
    expect(quoteCss).toMatch(/\.k-price-tag\[data-emphasis='compact'\] \{\s*font: var\(--text-caption\)/)
  })
})

describe('GaugeBar 的分量', () => {
  const gauge = <GaugeBar label="情绪" value="72" share={0.72} level={<b>偏热</b>} note="近 5 日成交额之比" />
  const segmented = (
    <GaugeBar
      label="涨跌家数"
      value="3 : 2"
      segments={[
        { value: 3, tone: 'up', label: '上涨 3' },
        { value: 2, tone: 'down', label: '下跌 2' },
      ]}
    />
  )

  it('standard（默认）：名字、数、档位词、进度条、说明都在', () => {
    const html = at(null, gauge)
    expect(html).toContain('data-emphasis="standard"')
    for (const kept of ['情绪', '72', '偏热', 'k-gauge-track', 'k-gauge-fill', '近 5 日成交额之比'])
      expect(html).toContain(kept)
  })

  it('hero：同样的内容，数换成 display 档（样式）', () => {
    expect(at('hero', gauge)).toContain('k-gauge-track')
    expect(quoteCss).toMatch(
      /\.k-gauge\[data-emphasis='hero'\] \.k-gauge-value:not\(\.is-unavailable\) \{\s*font: var\(--text-display\)/,
    )
  })

  it('compact：只留一行「名字 数 档位词」，进度条、说明、图例都不画', () => {
    const html = at('compact', gauge)
    for (const kept of ['情绪', '72', '偏热']) expect(html).toContain(kept)
    for (const gone of ['k-gauge-track', 'k-gauge-fill', 'k-gauge-note', '近 5 日成交额之比'])
      expect(html).not.toContain(gone)
    const legend = at('compact', segmented)
    expect(legend).not.toContain('k-gauge-legend')
    expect(legend).not.toContain('上涨 3')
    expect(at('standard', segmented)).toContain('上涨 3')
  })
})
