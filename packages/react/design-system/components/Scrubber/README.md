# Scrubber

一条带填充的擦洗控件：左边写名字，右边写读数，在条上按下并拖动就把值擦到那里，松手停住，值按步长吸附。拿来擦回测的回看时间点、拖下单数量、调价格偏移。把手平时小而淡，悬停、聚焦与拖动时变实。

## Provide

`*` marks a required prop.

### Scrubber

role=slider：名字取 label，aria-valuetext 是 format 的结果。受控 value 与 onValueChange；不给 value 就自己持有。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Name shown on the left of the bar and read by screen readers, for example "Quantity". |
| `value` | `number` | — | Controlled value. |
| `defaultValue` | `number` | `0` | Initial value when uncontrolled. |
| `onValueChange` | `(value: number) => void` | — | Called whenever the value changes while dragging or pressing keys. |
| `min` | `number` | `0` | Lowest value, at the left end. |
| `max` | `number` | `1` | Highest value, at the right end. |
| `step` | `number` | `0.01` | Distance between two values; the value snaps to it. |
| `ticks` | `number` | `9` | Number of tick dots between the ends; 0 hides them. |
| `format` | `(value: number) => string` | `(v) => v.toFixed(2)` | Turns the value into the text on the right, for example a price or a date; two decimals when omitted. |
| `className` | `string` | — | Extra class name on the root. |

### scrubSnap

纯函数 (value, min, max, step)：夹进范围并吸附到步长。

### scrubValueAt

纯函数 (x, width, min, max, step)：条上的横坐标换成值；宽为 0 返回 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Scrubber } from '@katana-ui/react'

export function ScrubberUsage() {
  const [qty, setQty] = useState(200)
  return (
    <Scrubber
      label="Quantity"
      min={0}
      max={1000}
      step={10}
      value={qty}
      onValueChange={setQty}
      format={(v) => `${v} sh`}
    />
  )
}
```

## States

- 静止：把手小而淡，填充到当前值。
- 悬停或聚焦：把手变实放大。
- 拖动：填充与把手跟手，没有过渡；松手停在吸附后的值。
- 到两端：值夹在最小或最大，不越界。

## Don't

- 不要用来填表单里的必填数值：表单里的单值与区间用 Slider，精确数字用 NumberInput。
- 不要不写读数格式：调用方用 format 给单位或日期，条里只有一个读数。

## Composition

```
Scrubber
  div（role=slider）
    填充 · 刻度点 · 把手
    名字 · 读数
```

## Keyboard

- `← → / ↑ ↓`：走一步
- `Shift + 方向键 / PageUp / PageDown`：走十步
- `Home / End`：到最小 / 最大
