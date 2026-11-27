# AiPromptInput

多行自动长高（到 8 行封顶再滚）、回车发送、Shift+回车换行；流式中发送钮变停止；附件一排小标；字数到上限的 80% 才显示计数。中文输入法选词时的回车不发送。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiPromptInput

label 与 labels.send / labels.stop 必传；state 为 streaming 时发送钮是停止，error / done 画一圈语义色。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the text field (required). |
| `labels` * | `AiPromptInputLabels` | — | Names of the send / stop / attach buttons (required). |
| `placeholder` | `string` | — | Placeholder text in the UI language. |
| `state` | `AiState` | `'idle'` | Shared AI state; `streaming` turns send into stop, `error` and `done` draw a semantic ring. |
| `onSubmit` | `(value: string) => void` | — | Called with the trimmed draft on Enter or send. |
| `onStop` | `() => void` | — | Called when the stop button is pressed while `state` is `streaming`. |
| `value` | `string` | — | Controlled draft; leave undefined to let the component own it. |
| `onValueChange` | `(value: string) => void` | — | Called with the new draft on every change. |
| `attachments` | `readonly AiPromptAttachment[]` | `[]` | Files already attached to the draft. |
| `onAttach` | `() => void` | — | Shows the attach button when given. |
| `onRemoveAttachment` | `(id: string) => void` | — | Shows a remove button on every attachment when given. |
| `maxLength` | `number` | — | Shows a counter once the draft passes 80% of the limit; past it the counter turns red. |
| `disabled` | `boolean` | `false` | Disables the field and its buttons. |
| `children` | `ReactNode` | — | Extra controls on the left of the toolbar, such as a model picker. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiPromptInput } from '@katana-ui/react'

export function AiPromptInputUsage() {
  return (
    <AiPromptInput
      label="向交易助手提问"
      placeholder="问点什么……"
      labels={{ send: '发送', stop: '停止生成' }}
      onSubmit={(text) => console.log(text)}
    />
  )
}
```

## States

- 空：发送钮禁用。
- streaming：发送钮变停止（scale 与淡入淡出换字形）。
- error / done：边上一圈红 / 绿。
- 附件：一排小标，可移除。

## Don't

- 别靠 placeholder 当读屏名：label 必传。
- 不要在流式中禁用停止钮。

## Composition

```
AiPromptInput
  ul（附件）
  textarea
  div（附件钮 + children + 计数 + 发送钮）
```

## Keyboard

- `Enter`：发送（输入法选词中的回车不发送）
- `Shift + Enter`：换行
