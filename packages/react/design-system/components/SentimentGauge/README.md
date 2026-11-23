# SentimentGauge

0–100 的读数加五档色带（冰点 / 低迷 / 中性 / 升温 / 高潮，各占 20 分），读数落在哪一档那一档全亮；色带下面是调用方写的口径说明（如「规则评分 · 未历史校准」）；再下面是今昨对比两列（涨停、跌停、封率、开板）。评分怎么算、口径、历史校准都不在包里：分数与说明由调用方给。冰点取跌色、高潮取涨色（跟 data-updown）。

## Provide

`*` marks a required prop.

### SentimentGauge

渲染一个 section，不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `score` * | `number \| null \| undefined` | — | The score from 0 to 100; null or missing writes a dash. |
| `reason` | `string` | — | Why the score is unavailable (shown on hover). |
| `basis` | `ReactNode` | — | A caller-written line about how the score is made, such as its basis and whether it is calibrated. |
| `today` | `SentimentStats` | — | Today's figures for the comparison; leave both sides out to draw no comparison. |
| `yesterday` | `SentimentStats` | — | Yesterday's figures for the comparison. |
| `labels` | `SentimentLabels` | `cnLabelsZh.sentiment` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### SentimentStats

今日或昨日的四项：limitUp、limitDown、sealRate（百分数）、broken；各自是数或 { value, reason }。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `limitUp` | `CnValue` | — | Limit-up count. |
| `limitDown` | `CnValue` | — | Limit-down count. |
| `sealRate` | `CnValue` | — | Seal rate as a percentage (62.5 means 62.5%). |
| `broken` | `CnValue` | — | Count of stocks that touched the limit and opened. |

### sentimentLevel(score)

纯函数：档位 0–4，每档 20 分；取不到是 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SentimentGauge } from '@katana-ui/react/cn'

export function SentimentGaugeUsage() {
  return (
    <SentimentGauge
      score={62}
      basis="Rule-based score, not calibrated on history"
      today={{ limitUp: 30, limitDown: 62, sealRate: 62.5, broken: 10 }}
      yesterday={{ limitUp: 23, limitDown: 68, sealRate: 48, broken: 24 }}
      labels={{
        region: 'Sentiment',
        levels: ['Frozen', 'Weak', 'Neutral', 'Warm', 'Hot'],
        rows: { limitUp: 'Limit-up', limitDown: 'Limit-down', sealRate: 'Seal rate', broken: 'Opened' },
        today: 'Today',
        yesterday: 'Yesterday',
        scoreCaption: 'Score',
        unavailable: 'Not available',
        scoreAria: (score, level) => `Sentiment ${score}, ${level}`,
      }}
    />
  )
}
```

## States

- 有评分：读数、档名、色带当前档全亮、标记落在分数位置。
- 评分取不到：读数写「—」，不画标记、没有当前档，悬停写 reason，不写 0。
- 给了 basis 才有口径说明；给了 today 或 yesterday 才有今昨对比，缺的格写「—」。

## Don't

- 不要在包里算评分：口径与校准由调用方负责，basis 里写明。
- 不要传色值：档的颜色是语义 token。

## Composition

```
SentimentGauge
  读数 · 档名
  五档色带（含标记）
  口径说明
  今昨对比表
```
