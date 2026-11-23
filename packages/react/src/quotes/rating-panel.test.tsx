// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  RatingPanel,
  ratingPanelScore,
  ratingPanelText,
  type RatingPanelGauge,
  type RatingPanelLabels,
} from './rating-panel.tsx'

const labels: RatingPanelLabels = {
  zones: ['强烈卖出', '卖出', '中性', '买入', '强烈买入'],
  verdict: { sell: '卖出', neutral: '中性', buy: '买入' },
  panel: '技术评级',
  timeframe: '周期',
}

const gauge = (key: string, score: number, counts = { sell: 4, neutral: 9, buy: 13 }): RatingPanelGauge => ({
  key,
  label: key,
  score,
  counts,
})
const three = [gauge('osc', -0.6), gauge('sum', 0.32), gauge('ma', 0.8)]
const html = (extra: Partial<Parameters<typeof RatingPanel>[0]> = {}) =>
  renderToStaticMarkup(<RatingPanel gauges={three} labels={labels} {...extra} />)
const text = (markup: string) => markup.replace(/<[^>]+>/g, '')

describe('RatingPanel', () => {
  it('三个仪表按传入的次序排，默认中间那个放大；primary 指定别的', () => {
    const out = html()
    expect([...out.matchAll(/data-gauge="([^"]+)"/g)].map((m) => m[1])).toEqual(['osc', 'sum', 'ma'])
    expect(out).toMatch(/class="k-rpanel-cell is-primary"[^>]*data-gauge="sum"/)
    expect(html({ primary: 'ma' })).toMatch(/class="k-rpanel-cell is-primary"[^>]*data-gauge="ma"/)
    expect(html({ primary: 'nope' })).toMatch(/class="k-rpanel-cell is-primary"[^>]*data-gauge="sum"/)
  })

  it('每个仪表下写卖出、中性、买入的个数，次序固定', () => {
    const out = html({ gauges: [gauge('a', 0, { sell: 2, neutral: 7, buy: 5 })] })
    expect(text(out)).toContain('卖出2中性7买入5')
    expect([...out.matchAll(/k-rpanel-count" data-verdict="(\w+)"/g)].map((m) => m[1])).toEqual([
      'sell',
      'neutral',
      'buy',
    ])
  })

  it('仪表复用 RatingGauge：档位与指针照 rating-gauge-model 的分界', () => {
    const out = html()
    expect([...out.matchAll(/class="k-rating" role="img"[^>]*data-zone="(\d)"/g)].map((m) => m[1])).toEqual([
      '0',
      '3',
      '4',
    ])
    expect(out).toContain('data-angle="-54"')
    expect(out).toContain('data-angle="72"')
  })

  it('每个仪表是可聚焦的 meter：值夹到 ±1，读屏整句带档位、分数与三个个数', () => {
    const out = html({ gauges: [gauge('a', 3)] })
    expect(out).toContain('role="meter"')
    expect(out).toContain('tabindex="0"')
    expect(out).toContain('aria-valuemin="-1"')
    expect(out).toContain('aria-valuemax="1"')
    expect(out).toContain('aria-valuenow="1"')
    expect(out).toContain('aria-valuetext="强烈买入, +1.00; 卖出 4, 中性 9, 买入 13"')
  })

  it('悬停读数：默认带正负号两位小数；不是有限数写「—」；formatScore 可换写法', () => {
    expect(ratingPanelScore(0.324)).toBe('+0.32')
    expect(ratingPanelScore(-0.6)).toBe('-0.60')
    expect(ratingPanelScore(0)).toBe('0.00')
    expect(ratingPanelScore(Number.NaN)).toBe('—')
    expect(ratingPanelScore(-2)).toBe('-1.00')
    expect(ratingPanelScore(0.5, (s) => `${Math.round(s * 100)}%`)).toBe('50%')
    const out = html({ gauges: [gauge('a', 0.32)] })
    expect(out).toMatch(/data-slot="rating-panel-readout" aria-hidden="true"><b>\+0\.32<\/b><span>买入<\/span>/)
    expect(ratingPanelText(gauge('a', Number.NaN), labels, '—')).toBe('中性, —; 卖出 4, 中性 9, 买入 13')
  })

  it('周期切换：给了 timeframes 才画，选中受控，不给 value 选第一个', () => {
    expect(html()).not.toContain('rating-panel-timeframe')
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'].map((v) => ({ value: v, label: v }))
    const out = html({ timeframes, value: '1D' })
    expect(out).toContain('aria-label="周期"')
    expect(text(out)).toContain('1m5m15m1h4h1D1W1M')
    const on = (markup: string) => [...markup.matchAll(/data-state="on"[^>]*>(.*?)<\/button>/g)].map((m) => text(m[1]!))
    expect(on(out)).toEqual(['1D'])
    expect(on(html({ timeframes }))).toEqual(['1m'])
  })

  it('整件 role=group，读屏名取 labels.panel；footer 画在仪表下', () => {
    const out = html({ footer: '只汇总指标读数，不是交易建议。' })
    expect(out).toContain('role="group" aria-label="技术评级"')
    expect(out).toContain('<div class="k-rpanel-footer">只汇总指标读数，不是交易建议。</div>')
  })
})
