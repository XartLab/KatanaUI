# Select

单选下拉：触发器 30 高，列表贴在触发器下面（不盖住当前项），当前项加粗。

## Provide

`*` marks a required prop.

### Select

其余属性透传给 Radix Select.Root。

### SelectTrigger

其余属性透传给 Radix Select.Trigger。没有可见文字时要给 aria-label。

### SelectValue

其余属性透传给 Radix Select.Value。

### SelectItem

其余属性透传给 Radix Select.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `leading` | `ReactNode` | — | Content before the label (a color swatch, say); it is not shown in the trigger value. |

### SelectContent

其余属性透传给 Radix Select.Content。位置固定在触发器下方，偏移 2px。

### SelectArrow

触发器右边的小箭头，自己拼触发器时用。

### selectTriggerVariants / selectItemClass

触发器与列表项的类名，MultiSelect 与应用里别的下拉用它们跟单选下拉长一个样。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@katana-ui/react'
import { useState } from 'react'

export function SelectUsage() {
  const [kind, setKind] = useState('line')
  return (
    <Select value={kind} onValueChange={setKind}>
      <SelectTrigger aria-label="Chart type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="line">Line</SelectItem>
        <SelectItem value="candles">Candles</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

## States

- 默认、已选、未选（占位）、禁用。
- 展开：列表项左侧留一列放勾；当前项加粗。

## Don't

- 不要把可以直接点的两三个选项藏进下拉。

## Composition

```
Select
  SelectTrigger
    SelectValue
    SelectArrow
  SelectContent
    SelectItem
```

## Keyboard

- `Enter / Space / ↓`：在触发器上打开列表
- `↑ ↓`：在项之间走
- `Enter`：选中并收起
- `Esc`：收起，焦点回触发器
- `打字`：跳到以它开头的项
