# GlowHoverCard

指针在卡上移动时，一团强调色的光斑跟着它，边线在光斑处亮起来。装饰件：适用首页的功能入口卡；不进交易主界面。光斑不跨卡（与原件的差别）。

## Provide

`*` marks a required prop.

### GlowHoverCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | What goes inside. |
| `color` | `string` | `'var(--accent)'` | Glow colour, any CSS colour; defaults to the accent token. |
| `intensity` | `number` | `0.18` | Strength of the glow, 0 to 1. |
| `size` | `number` | `320` | Diameter of the light spot in px. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GlowHoverCard } from '@katana-ui/react'

export function GlowHoverCardUsage() {
  return <GlowHoverCard>Strategy lab: move the pointer over this card.</GlowHoverCard>
}
```

## States

- 静止：没有光斑。
- 悬停：光斑与边线亮起，渐入。
- 离开：光斑渐出。

## Don't

- 不要放进交易主界面。
- 不要把 color 写成会和涨跌色混淆的红绿。

## Composition

```
GlowHoverCard
  div
    span（光斑）
    div（内容）
```
