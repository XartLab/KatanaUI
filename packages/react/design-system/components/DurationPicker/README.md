# DurationPicker

平时是连成一整条的药丸「2 时 30 分」加笔钮；点笔钮三段用弹簧分开、内侧圆角长出来，数字变成可输入的框，笔变对勾；点对勾确认。输入超上限夹住并抖一下。学自 rare-ui。

## Provide

`*` marks a required prop.

### DurationPicker

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `DurationValue` | — | The current duration; typing calls back immediately, already clamped. |
| `defaultValue` | `DurationValue` | — | Initial duration when uncontrolled. |
| `onChange` | `(value: DurationValue) => void` | — | Called with the new duration. |
| `onConfirm` | `(value: DurationValue) => void` | — | Called with the confirmed value when the check mark is clicked or Enter is pressed. |
| `onEditingChange` | `(editing: boolean) => void` | — | Called when the editing state changes. |
| `defaultEditing` | `boolean` | `false` | Start in the editing state. |
| `maxHours` | `number` | `24` | Upper bound for hours; larger input is clamped. |
| `maxMinutes` | `number` | `59` | Upper bound for minutes; larger input is clamped. |
| `labels` * | `DurationPickerLabels` | — | Texts for the controls: hours, minutes, edit, save, hoursInput and minutesInput (required). |
| `disabled` | `boolean` | — | Disable the picker. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DurationPicker } from '@katana-ui/react'

export function DurationPickerUsage() {
  return (
    <DurationPicker
      defaultValue={{ hours: 2, minutes: 30 }}
      labels={{
        hours: 'h',
        minutes: 'm',
        edit: 'Edit duration',
        save: 'Confirm duration',
        hoursInput: 'Hours',
        minutesInput: 'Minutes',
      }}
    />
  )
}
```

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
