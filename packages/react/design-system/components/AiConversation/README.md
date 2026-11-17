# AiConversation

对话的滚动容器：只在读者本来就贴着底部时才跟着往下，往上翻读东西时不拽人；不再跟时冒出「回到最新」药丸。页上是一整段交易助手的演示：问「600519 今天为什么跌」→ 推理 → 调工具 → 带来源的回答 → 一条减仓建议进审批。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiConversation

role=log，读屏名取 label；contentKey 变了（消息数或流式文字长度）且读者在底部时跟随。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | The messages. |
| `label` * | `string` | — | Accessible name of the log region (required). |
| `jumpLabel` * | `string` | — | Text of the "jump to latest" pill (required). |
| `contentKey` | `string \| number` | — | Changes whenever content grows (message count, or streamed text length); decides when to follow the bottom. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiConversation, AiMessage } from '@katana-ui/react'

export function AiConversationUsage() {
  return (
    <div style={{ height: 160 }}>
      <AiConversation label="对话" jumpLabel="回到最新" contentKey={2} className="h-full">
        <AiMessage from="user">600519 今天为什么跌</AiMessage>
        <AiMessage>更像板块与资金面共振。</AiMessage>
      </AiConversation>
    </div>
  )
}
```

## States

- 贴着底部：内容长高时即时滚到底（不用平滑，平滑滚动途中会把「贴底」误判成「已离开」）。
- 离开底部：冒出药丸，点击平滑滚回。

## Don't

- 不要在读者往上翻时把他拽回底部。
- label 与 jumpLabel 必传。

## Composition

```
AiConversation
  div role=log（滚动区，可聚焦）
  button（回到最新药丸，离底时出现）
```

## Keyboard

- `Tab`：聚焦滚动区
- `方向键 / PageUp / PageDown`：滚动
