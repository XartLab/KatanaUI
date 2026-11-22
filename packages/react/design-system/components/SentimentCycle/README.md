# SentimentCycle

开盘啦「市场情绪」对照（#11）：左上大号情绪分（28px 600 无衬线、tabular-nums）与昨日差（涨跌 tone）、当前阶段（语气色方块 + 名字）；右上 0–100 刻度仪表（Meter gauge，语气取当前阶段的 tone）；中间近 N 日走势线（ink 主色 1.5px，50 分处一根虚中线），线下叠阶段带与图例（RegimeStrip，阶段色取状态语气 --k-status-*：Graphite 的油画颜料信号色，不用偏艳的类别色；今天的阶段标「当前」）；底下一排小线图（SmallMultiples，同步十字线，每项自己的写法，线与值都是中性前景色，不用品牌橙）。A 股面板在根上设 data-updown="cn"，文档站这一组的演示与组件截图都按 cn（红涨绿跌）。情绪分、阶段的划分与阈值都由调用方算好传，件里不带口径。

## Provide

`*` marks a required prop.

### SentimentCycle

数据形状 SentimentDay、SentimentStage、SentimentMetric 见类型；文字全在 labels。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `days` * | `readonly SentimentDay[]` | — | Days oldest first; the last one is today. |
| `stages` * | `readonly SentimentStage[]` | — | Stages in legend order. |
| `metrics` | `readonly SentimentMetric[]` | `[]` | Side metrics, one value per day. |
| `labels` * | `SentimentCycleLabels` | — | Texts. |
| `formatScore` | `(score: number) => string` | `(score) => String(Math.round(score))` | How a score is written; defaults to a whole number. |
| `activeStage` | `string \| null` | `null` | Highlight a stage on the band (others dim). |
| `onStageSelect` | `(stage: SentimentStage \| null) => void` | — | Legend items become toggles: pick a stage, null to clear. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SentimentCycle, type SentimentDay, type SentimentMetric, type SentimentStage } from '@katana-ui/react/blocks'

// 演示数据：20 个交易日的情绪分、阶段与四项小线图都是编出来的（闭式公式），不是行情，也不是任何口径的真实结果。
// 阶段与阈值是演示用的划分：调用方自己定口径，件不带算法。
export const SENTIMENT_STAGES: readonly SentimentStage[] = [
  { id: 'ice', name: '冰点', tone: 'neutral' },
  { id: 'repair', name: '修复', tone: 'warn' },
  { id: 'ferment', name: '发酵', tone: 'ok' },
  { id: 'climax', name: '高潮', tone: 'danger' },
]

const stageOf = (score: number) => (score < 25 ? 'ice' : score < 50 ? 'repair' : score < 75 ? 'ferment' : 'climax')
const SCORES = Array.from({ length: 20 }, (_, i) => Math.round(48 + 34 * Math.sin((i - 4) / 3.2) + (i % 3) * 3))

export const SENTIMENT_DAYS: readonly SentimentDay[] = SCORES.map((score, i) => ({
  date: `${i < 8 ? '10' : '11'}-${String(i < 8 ? 20 + i : i - 6).padStart(2, '0')}`,
  score,
  stage: stageOf(score),
}))

export const SENTIMENT_METRICS: readonly SentimentMetric[] = [
  { key: 'limitUp', label: '涨停数', values: SCORES.map((s) => Math.round(s * 1.1 + 12)), format: (v) => `${v} 只` },
  {
    key: 'height',
    label: '连板高度',
    values: SCORES.map((s) => Math.max(2, Math.round(s / 12))),
    format: (v) => `${v} 板`,
  },
  { key: 'losers', label: '亏钱数', values: SCORES.map((s) => Math.round((100 - s) * 0.9)), format: (v) => `${v} 只` },
  { key: 'seal', label: '封板率', values: SCORES.map((s) => Math.round(50 + s * 0.35)), format: (v) => `${v}%` },
]

export function SentimentCycleUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <SentimentCycle
        days={SENTIMENT_DAYS}
        stages={SENTIMENT_STAGES}
        metrics={SENTIMENT_METRICS}
        labels={{
          title: '情绪周期（演示数据）',
          score: '情绪分',
          gauge: '情绪温度',
          trend: '近 20 日',
          band: '情绪阶段带',
          metrics: '情绪分项',
          current: '当前',
          empty: '没有情绪数据',
        }}
      />
    </div>
  )
}
```

## States

- 默认：读数、仪表、走势、阶段带、分项五块都在；分项不传就不画那一排。
- 昨日差：涨取 --k-tone-up、跌取 --k-tone-down（根上 data-updown="cn" 时红涨绿跌），取整后为 0 不着色；不够两天写「—」。
- 分项小线图的线与值统一主文字色：涨停数、亏钱数这类不是涨跌，不按序列方向着色，线也不用 SmallMultiples 默认的 series-1 橙（#50：橙只给焦点角括号）。
- 选阶段：给了 onStageSelect，图例每项是开关，选中后带上别的阶段降到 25% 不透明。
- 空：days 为空数组时只画一行空态文字。

## Don't

- 不要在件里算情绪分或判阶段；口径由调用方定并写明依据（[T] 的 75/25 是第三方示例，不能当口径）。
- 阶段色只用状态语气（neutral / ok / warn / danger），不用类别色，也不用涨跌色表示「好坏」（cn 下涨跌色会对调，状态色不会）。
- 情绪分按 0 到 100 传：仪表刻度固定 0 / 25 / 50 / 75 / 100。

## Composition

```
SentimentCycle
  读数（role=status）：名字 | 情绪分 + 昨日差 | 阶段
  Meter（gauge）
  走势：标题与起止日 | 折线 + 末点 | RegimeStrip（带 + 图例）
  SmallMultiples（分项）
```

## Keyboard

- `← / →`：在分项小线图上逐日扫读（SmallMultiples）
