# GravityStars

canvas 上的一片星点，缓缓漂移、明暗闪烁，指针像一口引力井，星点被吸过去再带着动量甩出，近处的星更大更快；可连线成星座。适用文档站首页、未连接的占位页；只当底。屏外与标签页隐藏时停。

## Provide

`*` marks a required prop.

### GravityStars

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Foreground content, always painted above the decorative starfield. |
| `className` | `string` | — | Extra classes for the positioned wrapper element. |
| `color` | `string` | `DEFAULT_COLOR` | Base star colour. |
| `connect` | `boolean` | `true` | Draws thin, distance-faded links between stars that are close together. |
| `connectDistance` | `number` | `DEFAULT_CONNECT_DISTANCE` | Maximum distance in CSS pixels at which two stars are linked. |
| `count` | `number` | `DEFAULT_COUNT` | Number of stars in the pool. |
| `drag` | `number` | `DEFAULT_DRAG` | Velocity damping per frame, from 0 (frictionless) to 1 (frozen). |
| `glow` | `number` | `DEFAULT_GLOW` | Halo radius multiplier for the glow sprite. |
| `gravity` | `number` | `DEFAULT_GRAVITY` | Strength of the pointer gravity well. |
| `paused` | `boolean` | `false` | Freezes the animation on the current frame. |
| `speed` | `number` | `DEFAULT_SPEED` | Ambient drift speed multiplier. |
| `starSize` | `number` | `DEFAULT_STAR_SIZE` | Base star radius in CSS pixels, before the depth multiplier. |
| `tint` | `number` | `DEFAULT_TINT` | How far individual stars are tinted away from `color` towards a cool blue-white and a warm amber, from 0 (one flat colour) to 1 (full spread). |
| `twinkle` | `number` | `DEFAULT_TWINKLE` | Brightness oscillation amount, from 0 (steady) to 1 (strong). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GravityStars } from '@katana-ui/react'

export function GravityStarsUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <GravityStars className="h-full w-full" count={120}>
        <div style={{ padding: 16 }}>Not connected</div>
      </GravityStars>
    </div>
  )
}
```

## States

- 运行：每帧步进并重画；窄屏自动减星。
- 指针在画面里：星点被吸引；离开：回到漂移。
- 暂停或屏外：停在当前帧。
- canvas 不可用：CSS 点阵。

## Don't

- 不要放进行情区：连线会被读成关联关系。
- 不要把 count 开到几百再放多个：每帧都要重算星点与连线。

## Composition

```
GravityStars
  div（aria-hidden）
    canvas
  div（children）
```
