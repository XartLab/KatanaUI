# Field

标签加控件加说明加错误排成一组，并把它们的 ARIA 关联好：标签点一下聚焦控件，说明与错误进控件的 aria-describedby，出错时 aria-invalid、错误条 role=alert。可选 shakeOnInvalid：变成无效的那一刻整组抖一下（改自 SmoothUI form，MIT）。

## Provide

`*` marks a required prop.

### Field

其余属性透传给 div。控件调 useFieldControl() 拿 { id, aria-describedby, aria-invalid, disabled } 展开到自己身上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `orientation` | `"vertical" \| "horizontal"` | — | Label above the control, or label and description on the left with the control on the right. |
| `invalid` | `boolean` | `false` | Turns the label to the danger color, marks the control aria-invalid and shows FieldError. |
| `disabled` | `boolean` | `false` | Dims the label to 45% and disables the control. |
| `shakeOnInvalid` | `boolean` | `false` | Shake the whole field once (3px) when it turns invalid. |

### FieldError

Field 的 invalid 为真才渲染；children 是调用方写的话。

### Label

其余属性透传给 Radix Label.Root。不在 Field 里单独用也行。

### FieldLabel / FieldDescription / FieldContent / FieldGroup / FieldSet / FieldLegend / FieldSeparator

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Field, FieldDescription, FieldError, FieldLabel, Input, useFieldControl } from '@katana-ui/react'

function StopInput() {
  const control = useFieldControl()
  return <Input defaultValue="abc" {...control} />
}

export function FieldUsage() {
  return (
    <Field invalid>
      <FieldLabel>Stop distance</FieldLabel>
      <StopInput />
      <FieldDescription>In price ticks.</FieldDescription>
      <FieldError>Enter a number.</FieldError>
    </Field>
  )
}
```

## States

- 默认：标签、控件、说明。
- invalid：标签变危险色、控件 aria-invalid、FieldError 显示并进 aria-describedby。
- disabled：控件禁用，标签降到禁用样式。

## Don't

- 不要在 Field 外面调用 useFieldControl 还指望有关联。
- 不要只靠红色表示出错，要写错误文字。
- 不要把标签藏起来，要隐藏用 sr-only。

## Composition

```
FieldSet
  FieldLegend
  FieldGroup
    Field
      FieldLabel（或 FieldContent 里 FieldLabel + FieldDescription）
      控件（useFieldControl）
      FieldDescription
      FieldError
    FieldSeparator
```

## Keyboard

- `Tab`：控件按自己的方式走；点标签聚焦控件
