# DeleteButton

危险操作不弹对话框：点一下按钮在原地展开出「确认」「取消」，垃圾桶的盖子掀开。Esc、点外面、Tab 走开都是取消。学自 rare-ui。

## Provide

`*` marks a required prop.

### DeleteButton

外层是 div（data-phase：idle / armed / done / kept）；原按钮 aria-expanded 表达是否展开。文字都在 label 与 labels 里，包里不带语言。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the original button, for example "Delete workspace" (required). |
| `labels` | `DeleteButtonLabels` | — | Texts: confirm and cancel (required unless the deprecated confirmLabel / cancelLabel are given), done and kept. |
| `confirmLabel` | `string` | — | Old name of labels.confirm, kept for one release. |
| `cancelLabel` | `string` | — | Old name of labels.cancel, kept for one release. |
| `doneLabel` | `string` | — | Old name of labels.done, kept for one release. |
| `keptLabel` | `string` | — | Old name of labels.kept, kept for one release. |
| `onConfirm` | `() => void` | — | Called when the confirm button is clicked; the first click on the original button does not call it. |
| `onCancel` | `() => void` | — | Called on cancel (including Esc, a click outside, and tabbing away). |
| `disabled` | `boolean` | — | Disable the original button. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DeleteButton } from '@katana-ui/react'

export function DeleteButtonUsage() {
  return (
    <DeleteButton
      label="Delete workspace"
      labels={{ confirm: 'Confirm delete', cancel: 'Cancel' }}
      onConfirm={() => {}}
    />
  )
}
```

## States

- 静止：垃圾桶图标按钮。
- 展开：原地出现「确认」「取消」，垃圾桶的盖子掀开。
- Esc、点外面、Tab 走开都算取消。
- 禁用：不响应。

## Don't

- 不要在它旁边再叠一个确认对话框。
- 确认、取消与完成的文案由调用方传，包里不写。

## Composition

```
DeleteButton
  button（垃圾桶，aria-expanded）
  button（确认）
  button（取消，展开后默认焦点）
```

## Keyboard

- `Enter / Space`：展开；在确认或取消上则执行它
- `Esc`：取消并把焦点还给原按钮
- `Tab`：确认与取消之间移动；走出去算取消
