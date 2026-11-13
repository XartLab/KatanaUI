# DurationPicker

平时是连成一整条的药丸「2 时 30 分」加笔钮；点笔钮三段用弹簧分开、内侧圆角长出来，数字变成可输入的框，笔变对勾；点对勾确认。输入超上限夹住并抖一下。学自 rare-ui。

## Provide

### DurationPicker

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value / defaultValue / onChange` | `{ hours, minutes }` | — | 当前时长；打字时即时回调（已夹进范围）。 |
| `onConfirm` | `(value) => void` | — | 点对勾或 Enter 确认时触发。 |
| `onEditingChange / defaultEditing` | `(editing) => void / boolean` | — | 编辑状态。 |
| `maxHours / maxMinutes` | `number` | `24 / 59` | 上限；超过的输入夹到上限。 |
| `labels` | `DurationPickerLabels` | — | { hours, minutes, edit, save, hoursInput, minutesInput }（必填）。 |
| `disabled` | `boolean` | — | 禁用。 |

## States

- 平时：连成一整条的药丸加笔钮。
- 编辑中：三段分开，数字变成输入框，笔变对勾。
- 输入超上限：夹住并抖一下。
- 禁用：笔点不动。

## Don't

- 上限 maxHours、maxMinutes 由调用方定，不要省略。

## Composition

```
DurationPicker
  div（时 + 数字框）
  div（分 + 数字框）
  button（笔 / 对勾）
```

## Keyboard

- `Enter`：确认
- `Esc`：放弃这次编辑，回到编辑前的值
- `↑ ↓`：当前字段加减 1
