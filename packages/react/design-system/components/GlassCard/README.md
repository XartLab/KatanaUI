# GlassCard

毛玻璃底、内沿高光、随指针的镜面高光，悬停轻轻抬起。装饰件：适用压在图片或渐变上的首页、营销页卡片；压在纯色底上没有意义，不进交易主界面。没有搬原件的 SVG 折射环。

## Provide

`*` marks a required prop.

### GlassCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | What goes inside. |
| `blur` | `number` | `11` | Backdrop blur in px. |
| `radius` | `number` | `20` | Corner radius in px. |
| `tint` | `string` | `'var(--alpha-white-6)'` | Frosted tint, any CSS colour; a token such as var(--alpha-white-6) works. |
| `interactive` | `boolean` | `true` | Follow the pointer with a highlight and lift on hover. |
| `dispersion` | `boolean` | `true` | Draw the coloured dispersion at the edges. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GlassCard } from '@katana-ui/react'

export function GlassCardUsage() {
  return (
    <div style={{ padding: 24, background: 'linear-gradient(135deg, var(--signal-orange-dim), var(--bg-300))' }}>
      <GlassCard>Backtests, factors and a news wire in one workbench.</GlassCard>
    </div>
  )
}
```

## States

- 静止：毛玻璃与内沿高光。
- 悬停（精细指针）：抬起 3px，镜面高光跟着指针。
- 触屏：不抬起、没有镜面高光。

## Don't

- 不要放进交易主界面：背景模糊在大面积重绘时很贵。
- 不要压在纯色底上：看不出玻璃。

## Composition

```
GlassCard
  motion.div
    span（色散边）
    span（镜面高光）
    div（内容）
```
