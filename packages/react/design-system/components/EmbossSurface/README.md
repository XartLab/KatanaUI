# EmbossSurface

用多层 box-shadow 与 text-shadow 做出压凸、压凹、石膏、金属压印四种浮雕，深度、柔度与光源角度可调，interactive 时光源跟着指针转。适合会员徽章、奖牌卡的面；盘面上的控件用扁平的 token，不要浮雕。

## Provide

`*` marks a required prop.

### EmbossSurface

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `as` | `ElementType` | — | Element or component rendered as the material surface. |
| `children` * | `ReactNode` | — | Content that receives the relief. |
| `className` | `string` | — | Extra classes for the surface. |
| `color` | `string` | `DEFAULT_COLOR` | Base material colour. |
| `depth` | `number` | `DEFAULT_DEPTH` | Relief depth in pixels. |
| `interactive` | `boolean` | `false` | Let the light angle follow the pointer on hover-capable devices. |
| `lightAngle` | `number` | `DEFAULT_LIGHT_ANGLE` | Direction the light comes from, in degrees. |
| `softness` | `number` | `DEFAULT_SOFTNESS` | Shadow diffusion, `0` (hard) to `1` (soft). |
| `variant` | `EmbossSurfaceVariant` | `'emboss'` | Material recipe used to build the relief. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { EmbossSurface } from '@katana-ui/react'

export function EmbossSurfaceUsage() {
  return (
    <EmbossSurface variant="emboss" depth={3}>
      <div style={{ padding: '16px 24px' }}>NVDA</div>
    </EmbossSurface>
  )
}
```

## States

- 静态：光源在 lightAngle，阴影一次算好。
- interactive 且有精细指针：光源跟指针转，过渡走 --dur-snappy。
- 石膏（plaster）：多一层 SVG 高光滤镜。

## Don't

- 不要在行情区用：浮雕让单元格像按钮。
- 不要用 color 传半透明色：高光与阴影是往里混白、混黑，半透明会发灰。

## Composition

```
EmbossSurface
  svg（plaster 才有，aria-hidden，高光滤镜）
  as（默认 div）
```
