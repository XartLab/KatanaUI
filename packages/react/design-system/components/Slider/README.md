# Slider

凹槽轨 + 点阵填充 + 发光圆把手；拖动跟手，松手 settle 弹簧吸附到步进；一个值或一段范围。

## Provide

`*` marks a required prop.

### Slider

其余属性透传给 Radix Slider.Root。只做横向，受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `readonly number[]` | — | One value per thumb; two values make a range. |
| `thumbLabels` | `readonly string[]` | — | Accessible name of each thumb (the name goes on the real slider element, not on the Root). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Slider } from '@katana-ui/react'

export function SliderUsage() {
  const [value, setValue] = useState([40])
  return <Slider thumbLabels={['Opacity']} value={value} onValueChange={setValue} min={0} max={100} />
}
```

## States

- 单值、区间、禁用。
- 键盘 ← → 走一格。

## Don't

- 滑钮必须有 thumbLabels。

## Composition

```
Slider
```

## Keyboard

- `← →`：走一个步进
- `Home / End`：跳到最小、最大
- `PageUp / PageDown`：走十个步进
