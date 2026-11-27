# DerivativesBoard

永续合约的「交易数据」（OKX 永续页，XartLab/KatanaUI#245）：六张卡的网格，每张自己的标题、信息提示与周期按钮。持仓量及成交量（成交量柱在左轴、持仓量线在右轴，两轴共用一套网格）、资金费率（柱按正负着色，零线居中，周期近 7 / 14 天）、主动买卖量（买入在零线上、卖出镜像在零线下）、多空账户比与精英多空趋向（多空 100% 堆叠柱，加多空比折线在右轴）、合约基差（上面合约价与指数价两条线，下面基差柱）。数据按卡由调用方给（时间戳加数值的序列），缺哪张就显示那张的空态，不画假数；没有数的点留缺口，不当零画。周期可受控（period）也可不受控（defaultPeriod），切换只发 onPeriodChange(kind, period)，换数据是调用方的事。悬停或 ← → 扫读出悬停窗。卡可以单独用：DerivativesCard 一个 kind 一张。文字走 labels（必填，包里不带语言；演示用的简体中文那份在 gallery/usage/derivatives-labels-zh.ts）。

## Provide

`*` marks a required prop.

### DerivativesBoard

渲染一个 section；data、periods、period、defaultPeriod 都按 kind 给。kinds 选画哪几张与次序。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra class name on the card. |
| `labels` * | `DerivativesLabels` | — | Texts; required, the package carries no language. |
| `onPeriodChange` | `(kind: DerivativesKind, period: string) => void` | — | Called with the card's kind and the period just picked. |
| `formatAmount` | `DerivativesFormats['formatAmount']` | — | Volumes and open interest; defaults to an English compact number. |
| `formatPrice` | `DerivativesFormats['formatPrice']` | — | Prices and basis; defaults to thousands separators and at most two decimals. |
| `formatTime` | `DerivativesFormats['formatTime']` | — | A bucket time in milliseconds; defaults to UTC `MM-DD HH:mm`. |
| `chartHeight` | `number` | — | Height of the plot area in px; 168 by default. |
| `data` | `{ [K in DerivativesKind]?: DerivativesData[K] \| null }` | `{}` | The series of each card; a card with no entry (or an empty one) shows its own empty state. |
| `kinds` | `readonly DerivativesKind[]` | `DERIVATIVES_KINDS` | Which cards to draw and in what order; all six by default. |
| `periods` | `Partial<Record<DerivativesKind, readonly string[]>>` | — | Period ids each card offers, by kind; the defaults of the card where a kind is missing. |
| `period` | `Partial<Record<DerivativesKind, string>>` | — | Selected period of each card (controlled), by kind; a kind left out is uncontrolled. |
| `defaultPeriod` | `Partial<Record<DerivativesKind, string>>` | — | Initial period of each card when uncontrolled, by kind. |
| `minCardWidth` | `number` | `360` | Narrowest a card gets before the grid drops a column, in px; 360 by default. |

### DerivativesCard

kind 决定画法，data 的形状跟着 kind 走（见下面各点的类型）；onPeriodChange 带上 kind。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `periods` | `readonly string[]` | — | Period ids the buttons offer; defaults to 5m / 1h / 1d (7d / 14d for the funding rate). |
| `period` | `string` | — | Selected period (controlled). |
| `defaultPeriod` | `string` | — | Initial period when uncontrolled; the first of `periods` by default. |
| `onPeriodChange` | `(kind: DerivativesKind, period: string) => void` | — | Called with the card's kind and the period just picked. |
| `labels` * | `DerivativesLabels` | — | Texts; required, the package carries no language. |
| `formatAmount` | `DerivativesFormats['formatAmount']` | — | Volumes and open interest; defaults to an English compact number. |
| `formatPrice` | `DerivativesFormats['formatPrice']` | — | Prices and basis; defaults to thousands separators and at most two decimals. |
| `formatTime` | `DerivativesFormats['formatTime']` | — | A bucket time in milliseconds; defaults to UTC `MM-DD HH:mm`. |
| `chartHeight` | `number` | — | Height of the plot area in px; 168 by default. |
| `className` | `string` | — | Extra class name on the card. |
| `kind` * | `K` | — | Which card to draw; it decides the shape of `data`. |
| `data` | `DerivativesData[K] \| null` | — | The series of this card, old to new; missing, empty or all-missing shows the empty state. |

### DerivativesLabels

必填。卡名与信息提示、周期按钮的字、序列名、空态、读屏名与读数之间的分隔符（separator）；包里不带语言，整份由调用方传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `region` * | `string` | — | Accessible name of the board. |
| `cards` * | `Record<DerivativesKind, { title: string; info: string }>` | — | Title and the hint behind the info button of each card. |
| `periods` * | `Record<string, string>` | — | Words of the period buttons, by period id (`1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `7d`, `14d`); an id without a word is shown as is. |
| `periodGroup` * | `(title: string) => string` | — | Accessible name of the period group of one card. |
| `infoButton` * | `(title: string) => string` | — | Accessible name of the info button of one card. |
| `series` * | `{ openInterest: string volume: string rate: string buy: string sell: string long: string short: string ratio: string contract: string index: string basis: string }` | — | Names of the drawn series (legend, tooltip, summary). |
| `separator` * | `string` | — | Joins the readings in one sentence read aloud (latest values, hover readings), e.g. |
| `empty` * | `string` | — | Text of a card with no data. |
| `plotAria` * | `(title: string, latest: string) => string` | — | Accessible name of a plot: card title plus the latest values, e.g. |
| `noLatest` * | `string` | — | Said when a card has data but no value of the latest bucket can be read. |

### OpenInterestVolumePoint

{ time, openInterest, volume }；缺的值写 null，留缺口。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `number` | — | Bucket time in milliseconds. |
| `openInterest` * | `Maybe` | — | Open interest at the end of the bucket. |
| `volume` * | `Maybe` | — | Volume traded in the bucket. |

### FundingRatePoint

{ time, rate }；rate 是百分数，0.01 就是 0.01%。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `number` | — | Settlement time in milliseconds. |
| `rate` * | `Maybe` | — | Rate in percent (0.01 means 0.01%). |

### TakerVolumePoint

{ time, buy, sell }；两个都是非负数，卖出由卡镜像到零线下。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `number` | — | Bucket time in milliseconds. |
| `buy` * | `Maybe` | — | Taker buy volume. |
| `sell` * | `Maybe` | — | Taker sell volume. |

### LongShortPoint

{ time, long, short }；账户数或持仓量都行，只画比例，多空比是 long / short。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `number` | — | Bucket time in milliseconds. |
| `long` * | `Maybe` | — | Long side (accounts or positions). |
| `short` * | `Maybe` | — | Short side, in the same unit as the long side. |

### BasisPoint

{ time, contract, index }；基差是两者之差，有一个缺就没有基差柱。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `number` | — | Bucket time in milliseconds. |
| `contract` * | `Maybe` | — | Contract price. |
| `index` * | `Maybe` | — | Index price. |

### hasData(kind, points)

纯函数：卡有没有东西可画；空、缺、全是缺失值都是没有。

### alignedAxes(left, right, count, lockLeft)

纯函数：左右双轴取同样个数的刻度，右轴的字落在左轴的网格线上；lockLeft 时左轴不动（百分比轴不能长过 100）。

### symmetricAxis(values, count)

纯函数：以零为中心、盖住最大绝对值的轴，给带符号的柱用。

### longShare(point)

纯函数：多头占比 0 到 1；缺值、负数或两边都是零给 null。

### longShortRatioOf(point)

纯函数：多空比；空头不是正数给 null。

### basisOf(point)

纯函数：合约价减指数价；缺一个给 null。

### signedBars(values)

纯函数：带符号的柱：序号、值与方向；缺失值没有柱。

### DERIVATIVES_KINDS

六种 kind，次序同 OKX。

### DEFAULT_PERIODS

每种卡默认给的周期 id；字由 labels.periods 给。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DerivativesBoard, type DerivativesData } from '@katana-ui/react/blocks'
import { derivativesLabelsZh } from './derivatives-labels-zh.ts'

// 演示数据：编出来的（闭式公式，不是行情）；整点一根，从 2026-11-24 00:00 UTC 起。
const HOUR = 3600 * 1000
const START = Date.UTC(2026, 10, 24)
const hours = (count: number) => Array.from({ length: count }, (_, i) => ({ i, time: START + i * HOUR }))

export const DERIVATIVES_DEMO: DerivativesData = {
  openInterestVolume: hours(24).map(({ i, time }) => ({
    time,
    openInterest: Math.round(52000 + 1800 * Math.sin(i / 3.1) + i * 40),
    volume: Math.round(900 + 700 * Math.abs(Math.sin(i * 0.9)) + 120 * Math.cos(i / 2)),
  })),
  fundingRate: Array.from({ length: 21 }, (_, i) => ({
    time: START + i * 8 * HOUR,
    rate: +(0.012 * Math.sin(i / 2.2) + 0.004 * Math.cos(i * 1.3) - 0.001).toFixed(4),
  })),
  takerVolume: hours(24).map(({ i, time }) => ({
    time,
    buy: Math.round(420 + 260 * (1 + Math.sin(i / 2))),
    sell: Math.round(380 + 240 * (1 + Math.cos(i / 2.4))),
  })),
  longShortRatio: hours(24).map(({ i, time }) => ({
    time,
    long: Math.round(5200 + 900 * Math.sin(i / 4)),
    short: Math.round(4300 + 700 * Math.cos(i / 3)),
  })),
  topTraderRatio: hours(24).map(({ i, time }) => ({
    time,
    long: Math.round(3100 + 500 * Math.sin(i / 5 + 1)),
    short: Math.round(2400 + 400 * Math.cos(i / 4)),
  })),
  basis: hours(24).map(({ i, time }) => {
    const index = 67000 + 400 * Math.sin(i / 5)
    return {
      time,
      index: Math.round(index * 10) / 10,
      contract: Math.round((index + 25 * Math.sin(i / 2.5) - 4) * 10) / 10,
    }
  }),
}

export function DerivativesBoardUsage() {
  return <DerivativesBoard data={DERIVATIVES_DEMO} labels={derivativesLabelsZh} />
}
```

## States

- 周期：每张卡自己一组按钮，选中项高亮；资金费率默认近 7 / 14 天，别的卡 5 分钟 / 1 小时 / 1 天（待核对 OKX 的实际档位，用 periods 改）。
- 空态：没给 data、空序列、序列里全是缺失值，这张卡写 labels.empty，高度与有图时一样，别的卡不受影响。
- 缺值：折线断开、柱不画，不当零；悬停窗里写「—」。
- 悬停或 ← → 扫读：竖线加悬停窗，写时间与这一格各序列的值；Home / End 到头尾，Esc 清掉。
- 涨跌色：正资金费率、买入、多头、升水读 --pnl-up，反之读 --pnl-down，随 data-updown 互换；图例与悬停窗写字，不只靠颜色。

## Don't

- 不要在件里取数或轮询：数据与周期由调用方按 onPeriodChange 换。
- 不要把缺失值补成 0：传 null。
- 不要拿它画单品种的 K 线：用图表包。

## Composition

```
DerivativesBoard
  DerivativesCard × 6（article）
    标题 · 信息钮（Tooltip）· 周期按钮（ToggleGroup）
    图例
    图（面板 × 1–2 · 左右轴 · 十字线与悬停窗 · 时间轴）或 空态
```

## Keyboard

- `Tab`：到信息钮、周期按钮、图（图是一个停靠点）
- `← / →`：图上扫读一格；Shift 一次三格
- `Home / End`：图上到头尾
- `Esc`：清掉扫读
