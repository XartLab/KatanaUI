// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { TechnicalRating, type RatingGroup, type TechnicalRatingLabels } from './technical-rating.tsx'

const labels: TechnicalRatingLabels = {
  zones: ['强卖', '卖', '中性', '买', '强买'],
  verdict: { sell: '卖', neutral: '中性', buy: '买' },
  total: (n) => `共 ${n} 项指标`,
  columns: { name: '指标', reading: '读数', verdict: '结论' },
  timeframe: '时间周期',
  list: '技术评级',
  empty: '没有数据',
}

const one = (value: number, counts = { sell: 2, neutral: 3, buy: 4 }): RatingGroup => ({
  key: 'g',
  label: '总评',
  value,
  counts,
})
const html = (groups: RatingGroup[], extra = {}) =>
  renderToStaticMarkup(<TechnicalRating groups={groups} labels={labels} {...extra} />)

describe('TechnicalRating', () => {
  it('指针转角：−1 在最左、1 在最右、0 竖直', () => {
    expect(html([one(-1)])).toContain('data-angle="-90"')
    expect(html([one(1)])).toContain('data-angle="90"')
    expect(html([one(0)])).toContain('data-angle="0"')
  })

  it('档名随分数跨档：分界 −0.5、−0.1、0.1、0.5', () => {
    const word = (v: number) => />([^<]+)<\/div><div class="k-trating-counts"/.exec(html([one(v)]))![1]
    expect([-0.51, -0.5, -0.11, -0.1, 0.1, 0.11, 0.5, 0.51].map(word)).toEqual([
      '强卖',
      '卖',
      '卖',
      '中性',
      '中性',
      '买',
      '买',
      '强买',
    ])
  })

  it('个数行与总数：卖 n · 中性 n · 买 n，共 n 项', () => {
    const out = html([one(0.2)])
    expect(out.replace(/<[^>]+>/g, '')).toContain('卖 2 · 中性 3 · 买 4')
    expect(out).toContain('共 9 项指标')
  })

  it('明细按组分节，没有 rows 不画表，空数组画空态', () => {
    const rows = [
      { key: 'a', name: 'RSI (14)', group: 'g', reading: '54.20', verdict: 'neutral' as const },
      { key: 'b', name: 'MACD', group: 'g', verdict: 'buy' as const },
    ]
    const out = html([one(0.2)], { rows })
    expect(out).toContain('RSI (14)')
    expect(out).toContain('54.20')
    expect(out).toContain('—')
    expect(html([one(0.2)])).not.toContain('<table')
    expect(html([])).toContain('没有数据')
  })

  it('免责一句与时间周期只在传入时出现', () => {
    expect(html([one(0)])).not.toContain('rating-disclaimer')
    expect(html([one(0)])).not.toContain('rating-timeframe')
    const out = html([one(0)], { disclaimer: '仅供参考', timeframes: [{ value: '1d', label: '1 日' }] })
    expect(out).toContain('仅供参考')
    expect(out).toContain('1 日')
  })
})
