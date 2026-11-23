# ExperimentCard

两到五组参数或两个策略的回测对比：头一行标题、状态、小注；指标切换（只有一个指标不画）；每组一行写徽标字母、名字（基准、领先各一个小标）、当前指标的值、值条、相对基准的变化（好坏色加箭头，越小越好的指标变小才是好）、样本数与置信度。点一行或 Space 选为胜者，再点撤回；选了胜者底栏出动作按钮。卡一直展开，不做悬停才展开。指标方向与数值写法由调用方给。功能参照 affectUI 的 Experiment Card（affectui.com/components/experiment-card，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### ExperimentCard

指标切换受控或不受控（metric / defaultMetric），胜者同（winner / defaultWinner，null 是没选）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` * | `ReactNode` | — | Card title. |
| `label` * | `string` | — | Accessible name of the card. |
| `variants` * | `readonly ExperimentVariant[]` | — | Variants in display order; the one marked control (or the first) is the baseline. |
| `metrics` * | `readonly ExperimentMetric[]` | — | Metrics the variants were measured on. |
| `metric` | `string` | — | Controlled metric id. |
| `defaultMetric` | `string` | — | Metric id shown first when uncontrolled; defaults to the first metric. |
| `onMetricChange` | `(metricId: string) => void` | — | Called when the metric switch changes. |
| `winner` | `string \| null` | — | Controlled winner id; null when nothing is picked. |
| `defaultWinner` | `string \| null` | `null` | Winner id picked first when uncontrolled. |
| `onWinnerChange` | `(winnerId: string \| null) => void` | — | Called with the new winner id, or null when the pick is withdrawn. |
| `onAction` | `(variant: ExperimentVariant) => void` | — | Called when the action button of the picked winner is pressed; omit to show no button. |
| `status` | `{ label: string; tone: Severity }` | — | Status tag next to the title, such as running or finished. |
| `note` | `ReactNode` | — | Short note next to the status, such as the sample period. |
| `formatChange` | `(change: number) => string` | `defaultChange` | How the change against the baseline is written; defaults to a signed percent with one decimal. |
| `labels` * | `ExperimentCardLabels` | — | Texts. |
| `source` | `string` | — | Source line under the card. |
| `className` | `string` | — | Extra class name on the root. |

### baselineOf

纯函数：基准是标了 control 的第一个，都没标取第一个。

### changeVerdict

纯函数：变化是好是坏，越小越好的指标反过来。

### leaderOf

纯函数：在一个指标上领先的变体，跳过没测出的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key, also the key into each variant's values. |
| `lowerIsBetter` | `boolean` | — | Smaller values win (drawdown, slippage). |

### relativeChange

纯函数：(值 − 基准) ÷ |基准|，基准为 0 或没测出时 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ExperimentCard, type ExperimentMetric, type ExperimentVariant } from '@katana-ui/react/quant'

// 示例数据：三组双均线参数的回测对比，数是手写的演示值，不是回测结果。A 是基准；回撤越小越好。
const METRICS: readonly ExperimentMetric[] = [
  { id: 'cagr', label: '年化', format: (v) => `${(v * 100).toFixed(1)}%` },
  { id: 'sharpe', label: '夏普', format: (v) => v.toFixed(2) },
  { id: 'mdd', label: '最大回撤', format: (v) => `${(v * 100).toFixed(1)}%`, lowerIsBetter: true },
]

const VARIANTS: readonly ExperimentVariant[] = [
  {
    id: 'a',
    badge: 'A',
    name: '快 10 / 慢 40',
    control: true,
    values: { cagr: 0.124, sharpe: 1.08, mdd: 0.162 },
    samples: 312,
  },
  {
    id: 'b',
    badge: 'B',
    name: '快 13 / 慢 60',
    values: { cagr: 0.151, sharpe: 1.31, mdd: 0.148 },
    samples: 268,
    confidence: 0.93,
  },
  {
    id: 'c',
    badge: 'C',
    name: '快 8 / 慢 30',
    values: { cagr: 0.139, sharpe: 0.97, mdd: 0.211 },
    samples: 401,
    confidence: 0.71,
  },
]

export function ExperimentCardUsage() {
  const [adopted, setAdopted] = useState<string | null>(null)
  return (
    <div className="gal-wide" style={{ maxWidth: 560 }} data-gallery-experiment="main">
      <ExperimentCard
        title="双均线参数对比"
        label="示例：实验卡"
        status={{ label: '已跑完', tone: 'ok' }}
        note="2024-01 → 2026-10"
        variants={VARIANTS}
        metrics={METRICS}
        defaultMetric="sharpe"
        onAction={(variant) => setAdopted(variant.name)}
        labels={{
          metric: '指标',
          variants: '参数组',
          baseline: '基准',
          leader: '领先',
          hint: '点一行选为胜者',
          preview: (variant, value) => `${variant.badge}：${value}`,
          picked: (variant) => `已选 ${variant.badge}（${variant.name}）`,
          action: (variant) => `采用参数 ${variant.badge}`,
          samples: (count) => `${count} 笔`,
          confidence: (confidence) => `置信 ${Math.round(confidence * 100)}%`,
          missing: '–',
          empty: '没有参数组',
        }}
        source={adopted === null ? '来源 / 示例数据' : `来源 / 示例数据 · 已采用 ${adopted}`}
      />
    </div>
  )
}
```

## States

- 默认：领先的一行标「领先」，基准行标「基准」，基准行不写变化。
- 悬停或聚焦一行：底栏预览这一行的值。
- 选了胜者：这一行左边一道强调线、徽标变强调色，底栏写「已选」并出动作按钮（给了 onAction 才有）。
- 没测出的指标写 missing，值条为空，不参与领先。
- 没有变体：写 empty。

## Don't

- 不要拿它比五组以上：用 ParallelAttempts 或参数散点图。
- 不要看一段时间的走势：用 KpiChart 或权益曲线。
- 不要在件里定「好坏」：指标方向由调用方给 lowerIsBetter。

## Composition

```
ExperimentCard
  头（标题 · 状态 · 小注）
  ToggleGroup（指标切换）
  radiogroup（每组一行：徽标 · 名字与小标 · 值 · 值条 · 变化 · 样本与置信）
  底栏（提示或已选 · Button）
```

## Keyboard

- `Tab`：指标切换、每一组、动作按钮依次聚焦
- `← →`：在指标切换里换指标
- `Space / Enter`：在一组上：选为胜者；再按撤回
