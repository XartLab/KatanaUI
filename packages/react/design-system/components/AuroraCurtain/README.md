# AuroraCurtain

WebGL2 着色器在内容后面画几条缓缓飘动的光带，可调条数、柔度、亮度、方向与胶片颗粒。适用工作台的空状态、登录页、加载页的底；只当底，不承载数据，内容在它上面。屏外与标签页隐藏时停，WebGL2 不可用时退回 CSS 渐变。

## Provide

`*` marks a required prop.

### AuroraCurtain

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bands` | `number` | `DEFAULT_BANDS` | Number of aurora ribbons rendered behind the content. |
| `blur` | `number` | `DEFAULT_BLUR` | Softness of every ribbon edge, from 0 (crisp) to 1 (very diffuse). |
| `children` | `ReactNode` | — | Foreground content, always painted above the decorative curtain. |
| `className` | `string` | — | Extra classes for the positioned wrapper element. |
| `colors` | `string[]` | `DEFAULT_COLORS` | Ribbon colours. |
| `direction` | `AuroraDirection` | `'up'` | Direction the light flows towards. |
| `intensity` | `number` | `DEFAULT_INTENSITY` | Overall brightness multiplier, from 0 to 1. |
| `noise` | `number \| boolean` | `0` | Film-grain strength from `0` (clean) to `1` (heavily filmic). |
| `paused` | `boolean` | `false` | Freezes the animation on the current frame. |
| `speed` | `number` | `DEFAULT_SPEED` | Drift speed multiplier. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AuroraCurtain } from '@katana-ui/react'

export function AuroraCurtainUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <AuroraCurtain className="h-full w-full">
        <div style={{ padding: 16 }}>No strategy open</div>
      </AuroraCurtain>
    </div>
  )
}
```

## States

- 运行：屏内且标签页可见时每帧画；DPR 封顶 2。
- 暂停（paused）或屏外：停在当前帧。
- WebGL2 不可用：CSS 径向渐变，不动。

## Don't

- 不要在它上面放要读的小字而不加底色：光带亮处对比不够。
- 不要拿它承载数据或状态：颜色只是氛围，状态用 Led、Badge。
- 不要在一屏里放很多个：每个占一个 WebGL 上下文。

## Composition

```
AuroraCurtain
  div（aria-hidden）
    canvas
  div（children）
```
