// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  GaugeBar,
  PriceTag,
  QuoteCard,
  QuoteStrip,
  QuoteTable,
  RangeBar,
  RatingGauge,
  Sparkline,
  Treemap,
} from '../index'
import { rangeShare } from './range-bar'
import { ratingAngle, ratingZone, zoneArc } from './rating-gauge-model'
import { sparkPoints, sparkTone } from './sparkline'
import { quoteTone } from './quote-tone'
import { colorStep, layoutTreemap, TREEMAP_H, TREEMAP_W } from './treemap-model'

// #1884：报价与行情类的件的纯逻辑与结构。动效、悬停、键盘在 e2e/ui-gallery.spec.ts 里用真浏览器验。

describe('迷你图', () => {
  it('点：x 铺满整宽、最低的点贴下沿 2、最高的贴上沿 2；少于两个数没有点', () => {
    expect(sparkPoints([1, 3, 2], 200, 36)).toBe('0.00,34.00 100.00,2.00 200.00,18.00')
    expect(sparkPoints([5], 200, 36)).toBe('')
    expect(sparkPoints([], 200, 36)).toBe('')
  })

  it('三态按头尾比，不看中间', () => {
    expect(sparkTone([1, 9, 2])).toBe('up')
    expect(sparkTone([2, 9, 1])).toBe('down')
    expect(sparkTone([2, 9, 2])).toBe('flat')
    expect(sparkTone([2])).toBe('flat')
    expect(quoteTone(Number.NaN)).toBe('flat')
  })

  it('渲染：有折线与读屏名；没数据没有 svg、读屏名说清', () => {
    const html = renderToStaticMarkup(<Sparkline values={[1, 3, 2]} label="走势" className="x" />)
    expect(html).toContain('class="k-spark x is-up"')
    expect(html).toContain('aria-label="走势"')
    const empty = renderToStaticMarkup(<Sparkline values={[]} label="没有数据" />)
    expect(empty).not.toContain('<svg')
    expect(empty).toContain('aria-label="没有数据"')
  })
})

describe('进度条', () => {
  it('位置按 share 画，越界按边；null 不画填充；取不到换弱色', () => {
    expect(renderToStaticMarkup(<GaugeBar label="a" value="1" share={0.72} />)).toContain('style="width:72%"')
    expect(renderToStaticMarkup(<GaugeBar label="a" value="1" share={3} />)).toContain('style="width:100%"')
    const missing = renderToStaticMarkup(<GaugeBar label="a" value="无" unavailable share={null} />)
    expect(missing).not.toContain('k-gauge-fill')
    expect(missing).toContain('k-gauge-value is-unavailable')
  })
})

describe('矩形树图', () => {
  const items = [
    { data: 'A', size: 600, group: 'T' },
    { data: 'B', size: 300, group: 'T' },
    { data: 'C', size: 100, group: 'B' },
    { data: 'D', size: 0, group: 'B' },
  ]

  it('大小是 0 的不画，按组分块、大的在前，不出界', () => {
    const blocks = layoutTreemap(items, true)
    expect(blocks.map((block) => block.name)).toEqual(['T', 'B'])
    expect(blocks.flatMap((block) => block.cells)).toHaveLength(3)
    for (const block of blocks) {
      expect(block.x1).toBeLessThanOrEqual(TREEMAP_W)
      expect(block.y1).toBeLessThanOrEqual(TREEMAP_H)
    }
    expect(layoutTreemap(items, false)).toHaveLength(1)
  })

  it('颜色七档按 ±limit 切，封顶，没有数是 null', () => {
    expect(colorStep(0.011)).toBe(1)
    expect(colorStep(-0.2)).toBe(-3)
    expect(colorStep(undefined)).toBeNull()
  })

  it('渲染：每格带档位类、组头只在 heads 时有、色例七档', () => {
    const html = renderToStaticMarkup(
      <Treemap
        blocks={layoutTreemap(items, true)}
        heads
        describe={(name) => ({ name, text: '+1%', change: name === 'A' ? 0.03 : -0.03 })}
        legendText={(step) => String(step)}
      />,
    )
    expect(html.match(/k-treemap-cell /g)).toHaveLength(3)
    expect(html).toContain('is-step3')
    expect(html).toContain('is-step-3')
    expect(html.match(/k-treemap-head/g)).toHaveLength(2)
    expect(html.match(/<li class="is-step/g)).toHaveLength(7)
  })
})

describe('价格标签与报价卡', () => {
  it('涨跌带三角与三态类；平没有三角', () => {
    const up = renderToStaticMarkup(<PriceTag price="1.00" change="+1%" tone="up" />)
    expect(up).toContain('k-price-tag is-up')
    expect(up).toContain('▲')
    expect(renderToStaticMarkup(<PriceTag price="1.00" change="0%" />)).not.toMatch(/[▲▼]/)
  })

  it('报价卡：给 onSelect 是按钮，不给是普通块；一排是列表', () => {
    const plain = renderToStaticMarkup(<QuoteCard name="n" price="1" />)
    expect(plain).not.toContain('<button')
    const link = renderToStaticMarkup(<QuoteCard name="n" price="1" onSelect={() => {}} />)
    expect(link).toContain('<button')
    const strip = renderToStaticMarkup(<QuoteStrip label="条" items={[{ id: 'a', name: 'n', price: '1' }]} />)
    expect(strip).toContain('role="list"')
    expect(strip).toContain('is-sm')
  })
})

describe('区间条', () => {
  it('位置按现价算；区间外贴边；没有宽度没有位置', () => {
    expect(rangeShare(10, 20, 15)).toBe(0.5)
    expect(rangeShare(10, 20, 99)).toBe(1)
    expect(rangeShare(10, 20, -1)).toBe(0)
    expect(rangeShare(10, 10, 10)).toBeNull()
    expect(rangeShare(10, 20, Number.NaN)).toBeNull()
  })

  it('渲染：meter 带取值，标记在位置上；没有位置不画标记', () => {
    const html = renderToStaticMarkup(<RangeBar low={10} high={20} value={15} label="区间" />)
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="15"')
    expect(html).toContain('left:50%')
    expect(renderToStaticMarkup(<RangeBar low={10} high={10} value={10} label="区间" />)).not.toContain('k-range-mark')
  })
})

describe('评级仪表', () => {
  it('五段平分 −1 到 +1；越界夹边；不是数落中间', () => {
    // 分界照 TradingView Technical Ratings：±0.1 是中性的边、±0.5 是买卖的边（#1888）。
    expect([-1, -0.51, -0.5, -0.11, -0.1, 0, 0.1, 0.11, 0.5, 0.51, 1].map(ratingZone)).toEqual([
      0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4,
    ])
    expect(ratingZone(Number.NaN)).toBe(2)
    expect(ratingZone(9)).toBe(4)
  })

  it('指针转角：−1 在最左、0 朝上、+1 在最右', () => {
    expect([-1, 0, 1, 5].map(ratingAngle)).toEqual([-90, 0, 90, 90])
  })

  it('每段一条弧，渲染出当前档位词与指针角度', () => {
    expect(zoneArc(0)).toMatch(/^M [\d.]+ [\d.]+ A 84 84 0 0 1 /)
    const zones = ['a', 'b', 'c', 'd', 'e'] as const
    const html = renderToStaticMarkup(<RatingGauge score={0.9} zones={zones} label="评级" />)
    expect(html.match(/k-rating-zone /g)).toHaveLength(5)
    expect(html).toContain('is-z4 is-active')
    expect(html).toContain('data-angle="81"')
    expect(html).toContain('>e</figcaption>')
  })
})

describe('分组页签行情表', () => {
  it('页签一组一个；当前组的行有名称、价与涨跌幅，空组写说明', () => {
    const html = renderToStaticMarkup(
      <QuoteTable
        label="组"
        columns={{ name: 'N', trend: 'T', price: 'P', change: 'C' }}
        empty="没有"
        groups={[
          { id: 'g1', label: '一', rows: [{ id: 'r', name: '甲', price: '1.00', percent: '+1%', tone: 'up' }] },
          { id: 'g2', label: '二', rows: [] },
        ]}
      />,
    )
    expect(html.match(/role="tab"/g)).toHaveLength(2)
    expect(html).toContain('甲')
    expect(html).toContain('+1%')
    expect(html).toContain('k-quote-rows')
  })
})
