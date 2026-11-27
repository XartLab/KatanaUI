# ExposureSlider

刻度尺式的双向调节：中间一根定位线，左右拖动刻度尺，对准的刻度亮起，上方的环形读数左半圆表示负、右半圆表示正。拿来调净敞口、仓位偏移、杠杆这类中点是 0 的量；松手吸附到刻度。tone=pnl 时正负按涨跌色着色。

## Provide

`*` marks a required prop.

### ExposureSlider

role=slider：aria-valuenow 是当前值，aria-valuetext 是 format 的结果。受控 value 与 onValueChange。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the dial, for example "Net exposure". |
| `min` | `number` | `-20` | Lowest value, at the left end of the ruler. |
| `max` | `number` | `20` | Highest value, at the right end of the ruler. |
| `step` | `number` | `1` | Distance between two notches. |
| `value` | `number` | — | Value (controlled). |
| `defaultValue` | `number` | `0` | Value at first render when uncontrolled. |
| `onValueChange` | `(value: number) => void` | — | Called with the new value whenever the notch under the line changes. |
| `format` | `(value: number) => string` | `defaultFormat` | Turn the number into text; the default prints it with a sign. |
| `tone` | `'accent' \| 'pnl'` | `'accent'` | pnl paints positive values with the gain colour and negative ones with the loss colour; accent paints both with the accent. |
| `showIndicator` | `boolean` | `true` | Draw the ring and the number above the ruler. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ExposureSlider } from '@katana-ui/react'

export function ExposureSliderUsage() {
  const [value, setValue] = useState(0)
  return <ExposureSlider label="Net exposure" min={-20} max={20} value={value} onValueChange={setValue} tone="pnl" />
}
```

## States

- 拖动：刻度尺跟手，弹簧平滑，松手吸附。
- 键盘：← → 一格，PageUp / PageDown 十格，Home / End 到两端。
- 值为 0：环不画弧，数字用中性色。

## Don't

- 不要用来输入精确数字：刻度尺适合粗调，精确值用 NumberInput。
- 不要用于只有正数的量：用 RulerSlider。

## Composition

```
ExposureSlider
  div
    div（环形读数）
    div（role=slider）
      motion.ul
        Notch
```

## Keyboard

- `← → / ↑ ↓`：一格
- `PageUp / PageDown`：十格
- `Home / End`：到最小 / 最大
