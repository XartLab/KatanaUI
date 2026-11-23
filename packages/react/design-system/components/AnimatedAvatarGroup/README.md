# AnimatedAvatarGroup

重叠的 SymbolMark 堆：ETF 前几大持仓、板块成分、相关品种一行放得下；悬停时拉开、略放大，超出的折成「+n」。外圈用底色描边把相邻两枚隔开。只有有鼠标的设备才展开。与 Avatar / AvatarGroup 的分工：那是人的头像，这是品种徽标。

## Provide

`*` marks a required prop.

### AnimatedAvatarGroup

每枚的 name 是读屏名与悬停提示；label 是整组的读屏名。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly AnimatedAvatarGroupItem[]` | — | The symbols to stack, in order from front to back. |
| `label` * | `string` | — | Accessible name of the group, for example "Top holdings". |
| `maxVisible` | `number` | `4` | How many marks to draw before folding the rest into "+n". |
| `size` | `number` | `28` | Diameter of one mark in pixels. |
| `overlap` | `number` | `0.3` | Fraction of the diameter that neighbours overlap. |
| `expandOnHover` | `boolean` | `true` | Spread the marks out while the pointer is over the group. |
| `className` | `string` | — | Extra class name on the group. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AnimatedAvatarGroup } from '@katana-ui/react'

export function AnimatedAvatarGroupUsage() {
  return (
    <AnimatedAvatarGroup
      label="Top holdings"
      maxVisible={3}
      items={[
        { code: 'NVDA', name: 'NVIDIA' },
        { code: 'AAPL', name: 'Apple' },
        { code: 'MSFT', name: 'Microsoft' },
        { code: 'TSLA', name: 'Tesla' },
      ]}
    />
  )
}
```

## States

- 收拢：按 overlap 比例重叠，层级前高后低。
- 悬停（有鼠标）：拉开 4px 间隔、放大 1.05，依次错开 30ms。
- 超出 maxVisible：末尾一个「+n」圆。

## Don't

- 不要用它放要点击的品种：徽标是装饰性的堆，要点的用 Watchlist。
- 不要超过 6 枚可见：再多就读不出谁是谁。

## Composition

```
AnimatedAvatarGroup
  div（role=group）
    motion.span
      SymbolMark
    motion.span（+n）
```
