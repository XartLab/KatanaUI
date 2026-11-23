# RulerSlider

只有一侧的量用的刻度尺：中间一根定位线，左右拖动刻度尺，从 min 到当前值的刻度都亮，上方的环从 12 点顺时针画到当前值占全程的比例。拿来调仓位比例、杠杆、数量占可用的百分比；手感照 ExposureSlider，点一下刻度就滑到那一格（交互照 TradingView 下单面板的数量滑块）。

## Provide

`*` marks a required prop.

### RulerSlider

role=slider：aria-valuenow 是当前值，aria-valuetext 是 format 的结果。受控 value 与 onValueChange；带数字的大刻度只标 majorEvery × step 整数倍上的值。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name of the ruler, for example "Position size". |
| `min` | `number` | `0` | Lowest value, at the left end of the ruler; the lit notches start here. |
| `max` | `number` | `100` | Highest value, at the right end of the ruler. |
| `step` | `number` | `1` | Distance between two notches. |
| `majorEvery` | `number` | `10` | Notches in one large step: values on a multiple of it get a number, and PageUp / PageDown or Shift with an arrow move this far. |
| `value` | `number` | — | Value (controlled). |
| `defaultValue` | `number` | — | Value at first render when uncontrolled; defaults to min. |
| `onValueChange` | `(value: number) => void` | — | Called with the new value whenever the notch under the line changes. |
| `format` | `(value: number) => string` | `String` | Turn the number into text for the readout, the numbered notches and the spoken value. |
| `showIndicator` | `boolean` | `true` | Draw the ring and the number above the ruler. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RulerSlider } from '@katana-ui/react'

export function RulerSliderUsage() {
  const [value, setValue] = useState(25)
  return (
    <RulerSlider
      label="Position size"
      min={0}
      max={100}
      majorEvery={25}
      value={value}
      onValueChange={setValue}
      format={(v) => `${v}%`}
    />
  )
}
```

## States

- 拖动：刻度尺跟手，弹簧平滑，松手吸附。
- 点按：挪不到 4px 算点，点的那一格滑到定位线下。
- 键盘：← → 一格，Shift + ← → 与 PageUp / PageDown 一大格，Home / End 到两端。
- 值在 min：环不画弧，数字用中性色。

## Don't

- 不要用于有正有负、中点是 0 的量：用 ExposureSlider。
- 不要用来输入精确数字：刻度尺适合粗调，精确值用 NumberInput。

## Composition

```
RulerSlider
  div
    div（环形读数）
    div（role=slider）
      motion.ul
        Notch（大刻度带数字）
```

## Keyboard

- `← → / ↑ ↓`：一格
- `Shift + ← → / PageUp / PageDown`：一大格（majorEvery 格）
- `Home / End`：到最小 / 最大
