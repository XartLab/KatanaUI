# SmartRecommendation

Agent 给一个建议（options 的第一项是推荐）：写理由、来源与置信度（0–3 格，旁边写成字，不只靠格子）；「其他选项」是一个单选菜单，换了就显示那一项；「采用」把人选的回调出去，之后换成「已采用」与「撤销」。标题本身是开合钮（aria-expanded），默认展开。模型输出只是带来源的建议，人接受才生效，件不替人采用。菜单是我们的 DropdownMenu。功能参照 affectUI 的 Smart Recommendation（affectui.com/components/smart-recommendation，2026-11-23 读；页上标 MIT，这里也只学功能，代码原创）。演示数据是示例。

## Provide

`*` marks a required prop.

### SmartRecommendation

采用与撤销都只回调，状态由件记着；理由与来源由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `options` * | `readonly RecommendationOption[]` | — | Options; the first one is recommended. |
| `onAccept` | `(option: RecommendationOption) => void` | — | Called when the person accepts an option. |
| `onUndo` | `(option: RecommendationOption) => void` | — | Called when an accept is undone. |
| `defaultOpen` | `boolean` | `true` | Whether the card starts open. |
| `title` * | `ReactNode` | — | Heading (also the fold button). |
| `labels` * | `SmartRecommendationLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### clampSignal

纯函数：置信度夹到 0–3 的整数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SmartRecommendation } from '@katana-ui/react'

// 示例数据：风控 Agent 对一个持仓的止损建议，理由与置信度是手写的演示值。
export function SmartRecommendationUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 420 }} data-gallery-srec="main">
      <SmartRecommendation
        title="止损建议（示例）"
        options={[
          {
            id: 'raise',
            label: '把止损上移到 1820',
            reason: '近 5 日低点逐日抬高，原止损离现价 9%',
            signal: 2,
            source: '来源：风控 Agent · 波动止损规则',
          },
          { id: 'trail', label: '改成 5% 跟踪止损', reason: '波动大时会被扫出去', signal: 1 },
          { id: 'keep', label: '不动', reason: '原计划持有到财报', signal: 1 },
        ]}
        labels={{
          signal: (signal) => ['没把握', '把握不大', '较有把握', '很有把握'][signal]!,
          recommended: '推荐',
          alternatives: '其他选项',
          accept: '采用',
          undo: '撤销',
          accepted: (label) => `已采用：${label}`,
        }}
      />
    </div>
  )
}
```

## States

- 默认：推荐项带「推荐」小标，置信度按级点亮。
- 换了一项：显示那一项的理由与置信度，没有「推荐」小标。
- 已采用：ok 色「已采用」加撤销，菜单与采用钮收起。
- 收起：只剩标题。

## Don't

- 不要在没有明显更好的一项时用：把几项并排给人比（ExperimentCard）。
- 不要拿它批下单这种高风险动作：用 AiApproval（按住确认）。

## Composition

```
SmartRecommendation
  h4 > button（开合）
  内容（选中项 · 推荐小标 · 理由 · 来源 · 置信度格与字）
  动作（DropdownMenu 单选 · Button 采用 / 已采用 · Button 撤销）
```

## Keyboard

- `Enter / Space`：在标题上开合；在「其他选项」上打开菜单；在「采用」上采用
- `↑ ↓`：菜单里换一项
- `Esc`：关上菜单
