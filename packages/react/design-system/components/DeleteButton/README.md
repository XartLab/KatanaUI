# DeleteButton

危险操作不弹对话框：点一下按钮在原地展开出「确认」「取消」，垃圾桶的盖子掀开。Esc、点外面、Tab 走开都是取消。学自 rare-ui。

## Provide

### DeleteButton

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 原按钮的读屏名，如「删除工作区」（必填）。 |
| `confirmLabel / cancelLabel` | `string` | — | 展开后两个小钮的读屏名（必填）。 |
| `doneLabel / keptLabel` | `string` | — | 确认、取消之后读屏播报的话；不给就不播。 |
| `onConfirm` | `() => void` | — | 点了确认。第一次点原按钮不会触发它。 |
| `onCancel` | `() => void` | — | 取消（含 Esc、点外面、Tab 走开）。 |
| `disabled` | `boolean` | — | 禁用原按钮。 |

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
