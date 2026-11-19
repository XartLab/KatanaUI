# Orb

WebGL2 画的一颗带光照的球，内部是 OkLab 混色的缓慢流动，循环首尾无缝；高光、边缘亮、内部散射、虹彩都可调。适合 AI 思考中、连接中的占位；要表达听与想的状态用 MatrixOrb。读屏看不到它：状态要用文字另外说。

## Provide

`*` marks a required prop.

### Orb

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aberration` | `number` | — | Rim dispersion. |
| `balance` | `number` | — | Which colour dominates. |
| `blobScale` | `number` | — | Interior cell size. |
| `chroma` | `number` | — | Hue ripple through the palette. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `colors` | `string[]` | — | Two to four stops. |
| `contrast` | `number` | — | Lightness contrast around the midpoint. |
| `duration` | `number` | — | Seconds for one full, seamless loop. |
| `flow` | `number` | — | How far the flow field carries the field over a loop. |
| `glow` | `number` | — | A halo cast outside the silhouette. |
| `grain` | `number` | — | Film grain. |
| `inner` | `number` | — | Internal scatter, offset away from the highlight. |
| `iridescence` | `number` | — | Fresnel-driven hue rotation — thin-film sheen. |
| `lightX` | `number` | — | Light direction, x. |
| `lightY` | `number` | — | Light direction, y. |
| `paused` | `boolean` | — | Freeze on the current frame. |
| `refraction` | `number` | — | Bends the noise lookup by the surface normal. |
| `rim` | `number` | — | Fresnel edge brightness. |
| `shading` | `number` | — | Blends the palette toward plain diffuse shading. |
| `shift` | `number` | — | Rotates the palette. |
| `size` | `number \| string` | `240` | Rendered size. |
| `softness` | `number` | — | Edge feather. |
| `specular` | `number` | — | Specular highlight strength. |
| `turbulence` | `number` | — | Strength of the second, nested warp — marbling rather than blobs. |
| `wobble` | `number` | — | Silhouette deformation, so the orb is a drop rather than a ball. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Orb } from '@katana-ui/react'

export function OrbUsage() {
  return <Orb size={96} />
}
```

## States

- 运行：约 60 帧封顶，离开屏幕就停。
- 暂停（paused）：停在当前帧。
- WebGL2 不可用：一块径向渐变的圆。

## Don't

- 不要拿它表达数据：颜色只是氛围。
- 不要不配文字：画布是 aria-hidden，状态要用文字说。

## Composition

```
Orb
  canvas（aria-hidden）
```
