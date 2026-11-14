// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PanelFrame } from '../../src/blocks'
import {
  TechnicalRating,
  type RatingGroup,
  type RatingRow,
  type RatingVerdict,
  type TechnicalRatingLabels,
} from '../../src/quant'

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

// 技术评级仪表（#20）的演示：读数与结论从合成价格算出来，不是行情；分数与个数在这里按「买 − 卖」除以总数现算，真实调用方自己算。
const RATING_TIMEFRAMES = [
  { value: '1m', label: '1 分' },
  { value: '15m', label: '15 分' },
  { value: '1h', label: '1 小时' },
  { value: '4h', label: '4 小时' },
  { value: '1d', label: '1 日' },
  { value: '1w', label: '1 周' },
  { value: '1M', label: '1 月' },
]
const RATING_ZONES = ['强卖', '卖', '中性', '买', '强买'] as const
const RATING_LABELS: TechnicalRatingLabels = {
  zones: RATING_ZONES,
  verdict: { sell: '卖', neutral: '中性', buy: '买' },
  total: (n) => `共 ${n} 项指标`,
  columns: { name: '指标', reading: '读数', verdict: '结论' },
  timeframe: '时间周期',
  list: '技术评级',
  empty: '没有数据',
}

// 演示价格：每个周期一条固定种子的合成收盘价（随机游走加慢波），读数与结论都从它算出来，规则照 TradingView 的技术评级
//（tradingview.com/support/solutions/43000614331，2026-11-15 读）：RSI 30 以下买、70 以上卖；随机指标 20 / 80；CCI ±100；Williams %R −80 / −20；
// 动量、ROC、AO 看正负；MACD 线在信号线上为买；均线是价格在均线上为买。只用收盘价合成（真实调用方用 K 线），所以是演示，不是行情。
const sma = (xs: readonly number[], n: number) => xs.slice(-n).reduce((a, b) => a + b, 0) / n
const emaSeries = (xs: readonly number[], n: number) => {
  const k = 2 / (n + 1)
  const out: number[] = []
  xs.forEach((x, i) => out.push(i === 0 ? x : x * k + out[i - 1]! * (1 - k)))
  return out
}
const smaSeries = (xs: readonly number[], n: number) => xs.map((_, i) => (i + 1 < n ? NaN : sma(xs.slice(0, i + 1), n)))
function indicators(close: readonly number[]) {
  const last = close.at(-1)!
  const gains = close.slice(1).map((c, i) => Math.max(0, c - close[i]!))
  const losses = close.slice(1).map((c, i) => Math.max(0, close[i]! - c))
  let ag = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14
  let al = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14
  for (let i = 14; i < gains.length; i += 1) {
    ag = (ag * 13 + gains[i]!) / 14
    al = (al * 13 + losses[i]!) / 14
  }
  const rsi = al === 0 ? 100 : 100 - 100 / (1 + ag / al)
  const raw = close.map((c, i) => {
    const w = close.slice(Math.max(0, i - 13), i + 1)
    const [lo, hi] = [Math.min(...w), Math.max(...w)]
    return hi === lo ? 50 : ((c - lo) / (hi - lo)) * 100
  })
  const stoch = sma(
    smaSeries(raw.slice(13), 3).filter((x) => !Number.isNaN(x)),
    3,
  )
  const w20 = close.slice(-20)
  const m20 = sma(close, 20)
  const cci = (last - m20) / (0.015 * (w20.reduce((a, b) => a + Math.abs(b - m20), 0) / 20))
  const w14 = close.slice(-14)
  const [lo14, hi14] = [Math.min(...w14), Math.max(...w14)]
  const willr = ((hi14 - last) / (hi14 - lo14)) * -100
  const macdLine = emaSeries(close, 12).map((v, i) => v - emaSeries(close, 26)[i]!)
  const macd = macdLine.at(-1)!
  const signal = emaSeries(macdLine, 9).at(-1)!
  const sign = (v: number): RatingVerdict => (v > 0 ? 'buy' : v < 0 ? 'sell' : 'neutral')
  const band = (v: number, lo: number, hi: number): RatingVerdict => (v < lo ? 'buy' : v > hi ? 'sell' : 'neutral')
  const f = (v: number) => v.toFixed(2)
  const osc: [string, number, RatingVerdict][] = [
    ['RSI (14)', rsi, band(rsi, 30, 70)],
    ['Stochastic %K (14, 3, 3)', stoch, band(stoch, 20, 80)],
    ['CCI (20)', cci, band(cci, -100, 100)],
    ['Williams %R (14)', willr, band(willr, -80, -20)],
    ['Awesome Oscillator', sma(close, 5) - sma(close, 34), sign(sma(close, 5) - sma(close, 34))],
    ['Momentum (10)', last - close.at(-11)!, sign(last - close.at(-11)!)],
    ['Rate of Change (9)', (last / close.at(-10)! - 1) * 100, sign(last - close.at(-10)!)],
    ['MACD (12, 26)', macd, sign(macd - signal)],
  ]
  const avg = [10, 20, 30, 50, 100, 200].flatMap((n) => {
    const e = emaSeries(close, n).at(-1)!
    const m = sma(close, n)
    return [
      [`EMA (${n})`, e, sign(last - e)],
      [`SMA (${n})`, m, sign(last - m)],
    ] as [string, number, RatingVerdict][]
  })
  const row =
    (group: string) =>
    ([name, value, verdict]: [string, number, RatingVerdict], i: number): RatingRow => ({
      key: `${group}${i}`,
      name,
      group,
      reading: f(value),
      verdict,
    })
  return [...osc.map(row('osc')), ...avg.map(row('ma'))]
}

function makeRating(frame: number) {
  const rand = seeded(20 + frame * 7)
  const drift = (rand() - 0.45) * 0.6
  const close: number[] = []
  let price = 100
  for (let i = 0; i < 260; i += 1) {
    price += drift + Math.sin(i / (9 + frame * 3)) * 0.9 + (rand() - 0.5) * 2.4
    close.push(price)
  }
  const rows = indicators(close)
  const tally = (list: readonly RatingRow[]) => ({
    sell: list.filter((r) => r.verdict === 'sell').length,
    neutral: list.filter((r) => r.verdict === 'neutral').length,
    buy: list.filter((r) => r.verdict === 'buy').length,
  })
  const group = (key: string, label: string, list: readonly RatingRow[]): RatingGroup => {
    const counts = tally(list)
    return { key, label, counts, value: (counts.buy - counts.sell) / list.length }
  }
  const groups = [
    group(
      'osc',
      '振荡指标',
      rows.filter((r) => r.group === 'osc'),
    ),
    group('all', '总评', rows),
    group(
      'ma',
      '均线',
      rows.filter((r) => r.group === 'ma'),
    ),
  ]
  return { rows, groups }
}

export function TechnicalRatingUsage() {
  const [frame, setFrame] = useState('1d')
  const { rows, groups } = makeRating(RATING_TIMEFRAMES.findIndex((tf) => tf.value === frame))
  return (
    <div style={{ width: '100%', maxWidth: 520, height: 760 }}>
      <PanelFrame
        index="04"
        title="技术评级"
        object="演示数据"
        meta="DEMO"
        source="SOURCE · 演示数据 · 非行情"
        focused
        labels={{ settings: '设置', maximize: '最大化', restore: '还原', close: '关闭' }}
      >
        <TechnicalRating
          groups={groups}
          rows={rows}
          labels={RATING_LABELS}
          primary="all"
          timeframes={RATING_TIMEFRAMES}
          timeframe={frame}
          onTimeframeChange={setFrame}
          disclaimer="评级只是指标读数的汇总，不是买卖建议。"
        />
      </PanelFrame>
    </div>
  )
}
