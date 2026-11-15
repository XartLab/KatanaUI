# TechnicalRating

照 TradingView 技术页（2026-11-15 实测）：顶上十个时间周期（选中是灰底胶囊），三个半圆仪表（振荡指标、总评、均线，总评居中放大；弧两端取涨跌色、中段灰；刻度字只写中间三档），指针按 −1…1 的分数转到所在档（分界 −0.5、−0.1、0.1、0.5），下面是档名大字、圆角三列「卖 / 中性 / 买」计数框与指标总数；再下面每组一张并排明细表（名称、读数、结论文字上色，标题带「›」），最底下是整宽的 Pivots 表（R3…S3 × Classic、Fibonacci、Camarilla、Woodie、DM，缺值「—」）。组件只画不算：分数、个数、读数与结论都由调用方传；档名、列名、免责一句也由调用方传，件只留位置。颜色走涨跌语义色与中性灰，不用橙色。放在 PanelFrame 里用。

## Provide

`*` marks a required prop.

### TechnicalRating

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `RatingGroup[]` | — | { key, label, value（−1…1）, counts: { sell, neutral, buy } }；通常三组。空数组画空态。 |
| `rows` | `RatingRow[]` | — | 指标明细：{ key, name, group?（对 groups 的 key，按组分节）, reading?（写好的文字，没有写「—」）, verdict }；不给就只画仪表。 |
| `labels` | `TechnicalRatingLabels` | — | 五档名（从卖到买）、卖 / 中性 / 买、指标总数文字、列名、周期控件与整件的读屏名、空态文字。 |
| `primary` | `string` | — | 放大居中的那一组的 key；不给取中间那一组。窄于 440px 时它独占一行。 |
| `timeframes / timeframe / onTimeframeChange` | `TechnicalRatingTimeframe[] / string / (value) => void` | — | 时间周期分段控件的选项、当前值与回调；不给 timeframes 就没有这一条。切周期后传新的 groups 与 rows。 |
| `disclaimer` | `ReactNode` | — | 免责一句，画在仪表与明细之间；不给就不画。 |
| `pivots` | `PivotTable` | — | { title, columns: string[], rows: { key, label, values: (string \| null)[] }[] }；整宽的枢轴点表，放在明细表下面；值由调用方算好，缺的传 null 画「—」。不给就不画。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import {
  TechnicalRating,
  type RatingGroup,
  type RatingRow,
  type RatingVerdict,
  type TechnicalRatingLabels,
} from '@katana-ui/react/quant'

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

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
      <PanelFrame focused aria-label="技术评级">
        <PanelFrameHeader heading="技术评级" object="演示数据" />
        <PanelFrameBody>
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
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}
```

## States

- 档：分数小于 −0.5 强卖，−0.5 到 −0.1 卖，−0.1 到 0.1 中性，0.1 到 0.5 买，大于 0.5 强买；正好落在 ±0.1 算中性，落在 ±0.5 算卖 / 买。分数 −1 指针在最左，1 在最右，0 竖直。
- 所在档的弧全亮，其余弧 30% 不透明；指针与亮档用 gentle 弹簧过渡。总评只写中间三档的刻度字（两端靠弧色与大字），小仪表不画刻度字。弧：两端涨跌色，中段灰。
- 明细行悬停整行提亮；结论是纯文字上色，不带底色（买取涨色、卖取跌色、中性灰），涨跌色跟 data-updown。

## Don't

- 不要把评级当买卖建议；免责一句由调用方写，别删这个位置。
- 不要在件里算评级或写死中文；分数、个数、文字都由调用方传。
- 没有数据时传空数组，件画空态，不要放样本读数。

## Composition

```
TechnicalRating（group）
  时间周期（分段控件）
  仪表（figure ×3）：组名 | 半圆五档弧 + 刻度字 + 指针 | 档名 | 三列计数框（卖 / 中性 / 买）| 共 n 项指标
  免责一句
  明细表（每组一张 section）：标题 › | 列头 | 行（指标 | 读数 | 结论）
  Pivots 表（section）：列头 | 行（R3…S3）
```

## Keyboard

- `Tab`：依次到周期控件的按钮（← → 在其中移动，Space / Enter 选）
