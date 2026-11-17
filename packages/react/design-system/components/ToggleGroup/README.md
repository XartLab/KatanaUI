# ToggleGroup

一组互斥的按钮，选中块是一块跟着滑的底（弹簧）。default 是设置页样式，sm 是工具条样式。

## Provide

`*` marks a required prop.

### ToggleGroup

其余属性透传给 Radix ToggleGroup.Root。单选语义：点已选中的项不会取消。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `ToggleGroupSize` | — | Size: md (default) is the bordered settings style, sm is the 26px toolbar style. |
| `variant` | `'default' \| 'sm'` | — | Old name of size: 'default' is md, 'sm' is sm. |
| `pillClassName` | `string` | — | Extra class name on the selected pill. |
| `textClassName` | `string` | — | Extra class name on the text wrapper. |
| `value` * | `string \| null` | — | The selected item; null means none is selected. |
| `onValueChange` * | `(value: string) => void` | — | Called with the newly selected value. |

### ToggleGroupItem

其余属性透传给 Radix ToggleGroup.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `string` | — | The value of this item. |

### toggleGroupVariants / toggleItemVariants

外壳与按钮的类名函数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@katana-ui/react'

export function ToggleGroupUsage() {
  const [frame, setFrame] = useState('d')
  return (
    <ToggleGroup aria-label="Timeframe" value={frame} onValueChange={setFrame}>
      <ToggleGroupItem value="d">Day</ToggleGroupItem>
      <ToggleGroupItem value="w">Week</ToggleGroupItem>
      <ToggleGroupItem value="m">Month</ToggleGroupItem>
    </ToggleGroup>
  )
}
```

## States

- 选中、未选、禁用项。
- size：md（默认，有边框、按钮 24 高、选中 700）与 sm（工具条：无边框、选中块随选中项滑动）；旧名 variant 留一个版本。
- 键盘 Tab 到每个按钮，Space 或 Enter 选中。

## Don't

- 超过五项换 Select。
- 不要拿它切换页面内容，那是 Tabs。
- 不要一组里混着文字项与纯图标项；纯图标项各自要 aria-label。

## Composition

```
ToggleGroup
  ToggleGroupItem
```

## Keyboard

- `Tab`：每个按钮都是停靠点（不是方向键走的一组）
- `Space / Enter`：选中这一项
