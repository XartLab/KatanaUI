# AiMessage

一条消息：气泡加不碍事的动作（复制、重试、赞踩）。动作从气泡自己的边上滑出来，悬停与键盘聚焦都显出，始终挂着只是淡掉，所以行高不跳。助手自带卡片的回合关掉气泡。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiMessage

动作按钮用我们的 Button 图标款；哪个动作有 labels 里的名字才画哪个。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | The message body. |
| `from` | `AiMessageAuthor` | `'assistant'` | Who wrote it; named `from` rather than `role` because `role` is an ARIA attribute. |
| `bubble` | `boolean` | `true` | Draw the tinted bubble; turn it off for assistant turns that carry their own surfaces (reasoning, tool calls, diffs). |
| `avatar` | `ReactNode` | — | Rendered beside the bubble, such as an avatar or an orb. |
| `timestamp` | `string` | — | Preformatted timestamp, such as "14:32". |
| `copyText` | `string` | — | Plain text for the clipboard; the copy action needs this and `labels.copy`. |
| `onRetry` | `() => void` | — | Called by the retry action (needs `labels.retry`). |
| `onVote` | `(vote: 'up' \| 'down') => void` | — | Called by the vote actions on assistant messages (need `labels.good` and `labels.bad`). |
| `labels` | `AiMessageLabels` | — | Action names in the UI language; an action is drawn only when its name is given. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiMessage } from '@katana-ui/react'

export function AiMessageUsage() {
  return (
    <AiMessage timestamp="14:32" copyText="更像板块与资金面共振。" labels={{ copy: '复制', copied: '已复制' }}>
      更像板块与资金面共振。
    </AiMessage>
  )
}
```

## States

- 用户 / 助手：气泡朝向与底色不同。
- 悬停或聚焦：动作滑出；复制后图标换成对勾并弹一下。
- 赞踩只在助手消息上。

## Don't

- 别给自己的消息画赞踩。
- 助手回合里有推理、工具、diff 卡片时用 bubble={false}。

## Composition

```
AiMessage
  div（avatar）
  div（气泡）
  div（时间戳 + 动作按钮）
```

## Keyboard

- `Tab`：进入消息后依次聚焦各动作（聚焦时动作显出）
- `Enter / Space`：触发动作
