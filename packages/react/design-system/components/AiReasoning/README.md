# AiReasoning

可折叠的推理过程：摘要行只在模型真在想的时候有流光；结束后停一拍自动收起并报耗时。手动开合过就不再替你决定。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiReasoning

labels 三条文案必传；duration 不给就自己计时。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | The reasoning trace. |
| `labels` * | `AiReasoningLabels` | — | Summary texts in the UI language (required). |
| `isStreaming` | `boolean` | `false` | Whether the model is still reasoning; the summary shimmers only while true. |
| `collapseWhenDone` | `boolean` | `true` | Collapse itself once streaming ends, unless the reader has toggled it by hand. |
| `defaultOpen` | `boolean` | — | Start expanded; defaults to the value of `isStreaming`. |
| `duration` | `number` | — | Seconds the model spent; the component times it itself when omitted. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiReasoning } from '@katana-ui/react'

export function AiReasoningUsage() {
  return (
    <AiReasoning
      isStreaming
      labels={{ thinking: '思考中', reasoning: '推理过程', thought: (seconds) => `思考了 ${seconds.toFixed(1)} 秒` }}
    >
      先看是个股事件还是板块行情，再查新闻与资金流向。
    </AiReasoning>
  )
}
```

## States

- 流式中：展开，摘要流光。
- 结束：停 600ms 后收起，摘要报耗时。
- 手动开合后不再自动。

## Don't

- 流光只给「还在干活」，不要常亮。
- 要展示最终回答别放在这里，用 AiResponse。

## Composition

```
AiReasoning
  button（展开钮 + 摘要）
  div（推理内容，左侧竖线）
```

## Keyboard

- `Enter / Space`：展开或收起
