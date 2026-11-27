// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { IntradaySeries, type IntradaySeriesItem } from './intraday-series.tsx'
import {
  INTRADAY_SEAM,
  intradayAxis,
  intradayMinutes,
  intradayPoints,
  intradayRuns,
  intradaySeams,
  intradayTicks,
  intradayTimes,
  intradayX,
  nearestTimeIndex,
} from './intraday-series-model.ts'
import { parseClock } from './session.ts'

// 盘中分钟线（#260）：示例数据，不是行情。
const x = (clock: string, auction = false) => intradayX(parseClock(clock), { auction })

describe('时段轴', () => {
  it('不画竞价：09:30 在最左，15:00 在最右；午休是一道细缝，不按分钟算', () => {
    expect(intradayMinutes()).toBe(240)
    expect(x('09:30')).toBe(0)
    expect(x('15:00')).toBeCloseTo(1, 10)
    expect(x('11:30')).toBeCloseTo((1 - INTRADAY_SEAM) / 2, 10)
    expect(x('13:00')! - x('11:30')!).toBeCloseTo(INTRADAY_SEAM, 10)
    // 午休里的时刻贴到 11:30；09:30 之前不在轴上。
    expect(x('12:15')).toBe(x('11:30'))
    expect(x('09:20')).toBeNull()
    expect(x('15:01')).toBeNull()
    expect(intradayX(null)).toBeNull()
  })

  it('画竞价：09:15 在最左，竞价与开盘之间、午休各一道缝；09:25–09:30 的时刻贴到竞价末尾', () => {
    expect(intradayMinutes(true)).toBe(250)
    expect(x('09:15', true)).toBe(0)
    expect(x('15:00', true)).toBeCloseTo(1, 10)
    expect(x('09:30', true)! - x('09:25', true)!).toBeCloseTo(INTRADAY_SEAM, 10)
    expect(x('09:27', true)).toBe(x('09:25', true))
    expect(intradaySeams({ auction: true })).toHaveLength(2)
    expect(intradaySeams()).toHaveLength(1)
    const [lunch] = intradaySeams()
    expect(lunch!.from).toBeCloseTo(x('11:30')!, 10)
    expect(lunch!.to).toBeCloseTo(x('13:00')!, 10)
  })

  it('刻度：午休缝写成一个「11:30/13:00」；画竞价最前多一个 09:15；位置按轴算', () => {
    expect(intradayTicks().map((tick) => tick.text)).toEqual(['09:30', '10:30', '11:30/13:00', '14:00', '15:00'])
    expect(intradayTicks({ auction: true })[0]).toEqual({ x: 0, text: '09:15' })
    const lunch = intradayTicks().find((tick) => tick.text === '11:30/13:00')!
    expect(lunch.x).toBeCloseTo((x('11:30')! + x('13:00')!) / 2, 10)
  })
})

describe('缺分钟留空', () => {
  const pts = (clocks: string[], value = 1) => clocks.map((time) => ({ time, value }))
  const runsOf = (clocks: string[], gap?: number) =>
    intradayRuns(intradayPoints(pts(clocks)), gap).map((run) => run.map((point) => point.minutes))

  it('缺一分钟就断成两段；午休前后相邻两分钟（11:30、13:01）不算缺', () => {
    expect(runsOf(['09:31', '09:32', '09:34', '09:35'])).toEqual([
      [parseClock('09:31'), parseClock('09:32')],
      [parseClock('09:34'), parseClock('09:35')],
    ])
    expect(runsOf(['11:29', '11:30', '13:01', '13:02'])).toHaveLength(1)
  })

  it('值是 null（或不是有限数）也断开，不当 0；gapMinutes 放宽后 5 分钟线能连起来', () => {
    const points = intradayPoints([
      { time: '09:31', value: 1 },
      { time: '09:32', value: null },
      { time: '09:33', value: 3 },
      { time: '09:34', value: Number.NaN },
      { time: '09:35', value: 5 },
    ])
    expect(points.map((point) => point.value)).toEqual([1, null, 3, null, 5])
    expect(intradayRuns(points)).toHaveLength(3)
    expect(runsOf(['09:35', '09:40', '09:45'])).toHaveLength(3)
    expect(runsOf(['09:35', '09:40', '09:45'], 5)).toHaveLength(1)
  })

  it('整理：写不对的时刻与不在轴上的点丢掉，按时刻排序', () => {
    const out = intradayPoints([
      { time: '09:33', value: 3 },
      { time: 'x', value: 9 },
      { time: '08:00', value: 9 },
      { time: '09:31', value: 1 },
    ])
    expect(out.map((point) => point.value)).toEqual([1, 3])
    // 不画竞价时 09:20 不在轴上，画竞价就在。
    expect(intradayPoints([{ time: '09:20', value: 1 }])).toEqual([])
    expect(intradayPoints([{ time: '09:20', value: 1 }], { auction: true })).toHaveLength(1)
  })

  it('十字光标走的时刻：全部序列的并集，鼠标位置取最近的一分钟', () => {
    const a = intradayPoints([
      { time: '09:31', value: 1 },
      { time: '09:33', value: 1 },
    ])
    const b = intradayPoints([{ time: '09:32', value: 1 }])
    const times = intradayTimes(a, b)
    expect(times).toEqual([parseClock('09:31'), parseClock('09:32'), parseClock('09:33')])
    expect(nearestTimeIndex(times, x('09:32')! + 1e-4)).toBe(1)
    expect(nearestTimeIndex(times, 0.9)).toBe(2)
    expect(nearestTimeIndex([], 0.5)).toBeNull()
  })

  it('值轴：取整成好看的刻度；全空 null；有柱时把 0 包进来', () => {
    expect(intradayAxis([])).toBeNull()
    expect(intradayAxis([12, 47])!.domain).toEqual([10, 50])
    expect(intradayAxis([12, 47], { includeZero: true })!.domain[0]).toBe(0)
  })
})

const LIMIT_UP: IntradaySeriesItem = {
  key: 'up',
  name: 'Limit-ups',
  points: [
    { time: '09:31', value: 12 },
    { time: '09:32', value: 15 },
    { time: '09:34', value: 20 },
    { time: '13:01', value: 31 },
  ],
  previous: [
    { time: '09:31', value: 8 },
    { time: '09:32', value: 11 },
  ],
  format: (value) => `${value} stocks`,
}
const RATE: IntradaySeriesItem = {
  key: 'rate',
  name: 'Break rate',
  axis: 'right',
  points: [
    { time: '09:31', value: 10 },
    { time: '09:32', value: 12 },
  ],
  format: (value) => `${value}%`,
}
const VOLUME: IntradaySeriesItem = {
  key: 'volume',
  name: 'Volume',
  kind: 'bar',
  points: [
    { time: '09:31', value: 100 },
    { time: '09:32', value: 80 },
  ],
}

describe('IntradaySeries', () => {
  const render = (series: IntradaySeriesItem[], extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(<IntradaySeries series={series} label="Market temperature" {...extra} />)

  it('一条线一个 path，缺分钟（09:33）处断成两段；昨日同时段是同色虚线；午休画一道缝', () => {
    const html = render([LIMIT_UP])
    const line = /data-slot="intraday-line" data-key="up" d="([^"]+)"/.exec(html)![1]!
    expect(line.match(/M/g)).toHaveLength(3)
    expect(html).toContain('data-slot="intraday-previous"')
    expect(html).toContain('data-dashed=""')
    expect(html.match(/data-slot="intraday-seam"/g)).toHaveLength(1)
    // 图例：最新值按 format 写；虚线的钥匙带读屏名。
    expect(html).toMatch(/k-isr-latest">31 stocks</)
    expect(html).toContain('Limit-ups · yesterday')
  })

  it('单位不同分左右两轴：有右轴时画右轴刻度并给绘图区留右边距；柱序列有 0 刻度', () => {
    const both = render([LIMIT_UP, RATE])
    expect(both).toContain('data-slot="intraday-rtick"')
    expect(both).toMatch(/data-slot="intraday-plot" data-right=""/)
    expect(render([LIMIT_UP])).not.toContain('intraday-rtick')
    const bars = render([VOLUME])
    expect(bars).toContain('data-slot="intraday-bars"')
    expect(bars).toMatch(/data-slot="intraday-ytick"[^>]*>0</)
  })

  it('没有数据写空态，不画样本；读屏名是整句加最新值', () => {
    const empty = render([])
    expect(empty).toContain('data-empty="true"')
    expect(empty).toContain('No data')
    expect(render([{ ...RATE, points: [{ time: '09:31', value: null }] }])).toContain('data-empty="true"')
    expect(render([LIMIT_UP, RATE])).toContain('aria-label="Market temperature. Limit-ups 31 stocks, Break rate 12%"')
  })

  it('画竞价：09:15 的刻度与第二道缝', () => {
    const html = render([{ ...RATE, points: [{ time: '09:20', value: 1 }, ...RATE.points] }], { auction: true })
    expect(html).toContain('>09:15<')
    expect(html.match(/data-slot="intraday-seam"/g)).toHaveLength(2)
  })
})
