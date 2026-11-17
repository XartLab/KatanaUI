# TiltCard

指针在卡上移动时，卡跟着转（最多 12 度），一道高光跟着走，可选让带 data-tilt-depth 的子元素按深度错位出视差。装饰件：适用首页、营销页的功能卡；行情与下单区要稳，不进交易主界面。

## Provide

`*` marks a required prop.

### TiltCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | What goes inside. |
| `glare` | `boolean` | `true` | Draw a highlight that follows the pointer. |
| `glareOpacity` | `number` | `DEFAULTS.glareOpacity` | Peak opacity of the highlight, 0 to 1. |
| `maxTilt` | `number` | `DEFAULTS.maxTilt` | Tilt at the card edge, degrees. |
| `parallax` | `boolean` | `false` | Shift children marked data-tilt-depth by their depth. |
| `perspective` | `number` | `DEFAULTS.perspective` | CSS perspective, px. |
| `scale` | `number` | `DEFAULTS.scale` | Scale while tilted. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TiltCard } from '@katana-ui/react'

export function TiltCardUsage() {
  return (
    <TiltCard>
      <div style={{ padding: 24, width: 220 }}>Feature card: tilts with the pointer.</div>
    </TiltCard>
  )
}
```

## States

- 静止：平放。
- 悬停（精细指针）：倾斜加放大，高光跟着指针。
- 键盘聚焦：固定的小倾斜。
- 触屏：不倾斜。

## Don't

- 不要放进交易主界面。
- 不要在要读的长文字卡上用：转动时文字会糊。

## Composition

```
TiltCard
  div（透视）
    motion.div（倾斜）
      内容
      div（高光）
```
