# InputGroup

一个外框包住输入框与前后附件（图标、币种、单位、按钮），里面的 Input 去掉自己的边与底；焦点环画在外框里。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### InputGroup

其余属性透传给 div（role=group）。

### InputGroupAddon

其余属性透传给 div。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `align` | `'start' \| 'end'` | `'start'` | Put the addon before the input (start) or after it (end). |

### InputGroupText

其余属性透传给 span。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Input, InputGroup, InputGroupAddon, InputGroupText } from '@katana-ui/react'

export function InputGroupUsage() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>¥</InputGroupText>
      </InputGroupAddon>
      <Input aria-label="Limit price" placeholder="0.00" />
      <InputGroupAddon align="end">
        <InputGroupText>CNY</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
```

## States

- 默认、聚焦（外框边提亮并画焦点环）、禁用、里面的 Input aria-invalid（外框变危险色）。

## Don't

- 附件里的按钮必须有 aria-label。
- 只要一个单位后缀的数字框用 NumberInput 的 unit。

## Composition

```
InputGroup
  InputGroupAddon（start）
    InputGroupText
  Input
  InputGroupAddon（end）
```

## Keyboard

- `Tab`：聚焦输入框，再到附件里的按钮
