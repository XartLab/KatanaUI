// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { MarketPulse, dialArc, pulseShare } from './market-pulse.tsx'

// #110 第 1 批第 3 项：市场全景条。示例数字，不是行情。
const COUNTS = { rising: 302, falling: 5239, limitUp: 30, limitDown: 62, flat: 31 }
const BINS = [
  { key: 'a', label: '-10', count: 119, tone: 'down' as const },
  { key: 'b', label: '0', count: 31, tone: 'muted' as const },
  { key: 'c', label: '+10', count: 18, tone: 'up' as const },
]

describe('MarketPulse', () => {
  it('上涨占比：上涨 /（上涨 + 下跌 + 平盘），表盘中间写 5.4%，下面写「上涨占比」', () => {
    expect(pulseShare(COUNTS)).toBeCloseTo(302 / 5572)
    const html = renderToStaticMarkup(<MarketPulse counts={COUNTS} />)
    expect(html).toContain('<b class="k-pulse-share">5.4%</b>')
    expect(html).toContain('<span class="k-pulse-dial-caption">上涨占比</span>')
    expect(html).toContain('aria-label="上涨占比 5.4%"')
    expect(html).toContain('class="k-pulse-dial-fill"')
    expect(pulseShare({ ...COUNTS, flat: null })).toBeNull()
  })

  it('五个大数：涨红跌绿（只给色调，不写色值），千分位，平盘是中性；单位家', () => {
    const html = renderToStaticMarkup(<MarketPulse counts={COUNTS} />)
    expect(html).toContain('data-key="rising" data-tone="up"')
    expect(html).toContain('data-key="falling" data-tone="down"')
    expect(html).toContain('data-key="limitUp" data-tone="up"')
    expect(html).toContain('data-key="limitDown" data-tone="down"')
    expect(html).toContain('data-key="flat" data-tone="muted"')
    expect(html).toContain('5,239<small>家</small>')
    expect(html).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i)
  })

  it('小字读数：金额按万 / 亿，取不到写「—」带原因，不写 0；昨日三项各自取不到', () => {
    const html = renderToStaticMarkup(
      <MarketPulse
        counts={COUNTS}
        basis="示例基准"
        readings={{
          nonStLimitUp: 28,
          highestBoard: 4,
          sealEstimate: 2.283e9,
          limitUpAmount: { value: null, reason: '示例：日内未知' },
          yesterdayLimitUp: 23,
          yesterdayLimitDown: 68,
          mainNetInflow: -1.5e8,
        }}
      />,
    )
    expect(html).toContain('<b>28家</b>')
    expect(html).toContain('<b>4板</b>')
    expect(html).toContain('<b>22.83亿</b>')
    expect(html).toContain('data-key="limitUpAmount" data-unavailable="true" title="示例：日内未知"')
    expect(html).toContain(
      'data-key="turnover" data-unavailable="true" title="暂无数据"><span class="k-pulse-read-name">两市成交额</span><b>—</b>',
    )
    expect(html).toContain(
      'data-key="mainNetInflow" data-tone="down"><span class="k-pulse-read-name">主力净流入</span><b>-1.50亿</b>',
    )
    expect(html).toContain('>23<')
    expect(html).toContain(' / 68')
    expect(html).toContain(' / —')
    expect(html).toContain('示例基准')
    expect(html).not.toMatch(/<b>0<\/b>/)
  })

  it('小字读数在一个最多两行的容器里，放不下的收进「+n」（浏览器里量，这里断言容器与全部九项）', () => {
    const html = renderToStaticMarkup(<MarketPulse counts={COUNTS} />)
    expect(html.match(/data-slot="pulse-readings"/g)).toHaveLength(1)
    expect(html.match(/data-slot="pulse-reading"/g)).toHaveLength(9)
    expect(html).not.toContain('pulse-more')
  })

  it('最右嵌涨跌分布柱（DistributionBars）；不给就不画', () => {
    const html = renderToStaticMarkup(<MarketPulse counts={COUNTS} distribution={{ bins: BINS }} />)
    expect(html).toContain('data-slot="distribution-bars"')
    expect(html.match(/data-slot="distribution-bin"/g)).toHaveLength(3)
    expect(html).toContain('<p class="k-pulse-dist-title">涨跌分布</p>')
    expect(renderToStaticMarkup(<MarketPulse counts={COUNTS} />)).not.toContain('distribution-bars')
  })

  it('表盘的弧：0.5 落在正上方，1 落在右端', () => {
    expect(dialArc(0.5)).toBe('M 10 50 A 40 40 0 0 1 50.00 10.00')
    expect(dialArc(1)).toBe('M 10 50 A 40 40 0 0 1 90.00 50.00')
  })
})
