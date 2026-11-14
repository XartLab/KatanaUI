# NumberInput

一个框：值加可选的单位后缀，没有 −/+ 按钮；打字、方向键、按住左右拖三种改法，可选框内标签与算式输入。

## Provide

`*` marks a required prop.

### NumberInput

角色是 spinbutton，带当前值与范围；只在值合法时回调，回调的值一定在 min / max 之内。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `number` | — | The current value. |
| `onValue` * | `(value: number) => void` | — | Called when the value changes; empty or non-numeric input does not call it. |
| `unit` | `string` | — | Unit suffix; when given, screen readers read the value together with the unit. |
| `min` | `number` | — | Lower bound; values below it are clamped. |
| `max` | `number` | — | Upper bound; values above it are clamped. |
| `step` | `number` | `1` | Step size. |
| `size` | `'sm'` | — | sm is 26px high; the default is 30px. |
| `width` | `number` | `96` | Width of the box in px. |
| `label` | `string` | — | Accessible name. |
| `invalid` | `boolean` | — | Show the red border. |
| `disabled` | `boolean` | — | Greyed out: cannot type, drag, or step with the arrow keys. |
| `autoValue` | `number` | — | Sentinel value (for example -1 or 0 meaning automatic): while the value equals it and the user is not typing, the box shows autoText. |
| `autoText` | `string` | — | Text shown in place of the sentinel value. |
| `expression` | `boolean` | — | Allow typing an expression, evaluated on Enter or blur (Esc discards); text that is not an expression turns red. |
| `caption` | `string` | — | Text label inside the box on the left (dragging it changes the value like dragging the box); the accessible name still comes from label. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { NumberInput } from '@katana-ui/react'

export function NumberInputUsage() {
  const [width, setWidth] = useState(14)
  return <NumberInput label="Line width" value={width} onValue={setWidth} min={1} max={40} unit="px" />
}
```

## States

- 默认、聚焦、悬停、禁用、错误。
- 可带单位后缀；打字、方向键、按住左右拖都能改值。
- expression 打开时，写 +10%、*2 这类算式；写到一半（如 +1）不会先被当成 1 写进去，回车才算。

## Don't

- 不要加 −/+ 按钮：这个框没有。
- 单位、小数位由调用方传，件里不猜。

## Composition

```
NumberInput
  input[role=spinbutton]
  span.k-unit（有 unit 时）
```

## Keyboard

- `↑ ↓`：按步长加减；Shift 十档，Alt 精调
- `PageUp / PageDown`：十档
- `Ctrl + Home / End`：跳到 min / max
- `Enter`：expression 打开时按当前值算算式；否则收起正在打的字
- `Esc`：放弃正在打的字
- `拖动`：按住左右拖：向右变大；Shift 粗调、Alt 精调
