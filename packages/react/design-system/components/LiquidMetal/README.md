# LiquidMetal

WebGL2 着色器画一块流动的金属面（铬、金、水银、油膜四种），指针推动流场；maskText 时把材质裁进字形。金属的明、暗、色调三色由 token 混出，跟主题走。适用会员、高级功能的徽标与标题；不进行情与下单区。

## Provide

`*` marks a required prop.

### LiquidMetal

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Content rendered above the metal surface, or clipped to it when `maskText` is on. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `distortion` | `number` | `DEFAULT_DISTORTION` | Strength of the domain warp. |
| `maskText` | `boolean` | `false` | Clip the material to the shape of the text instead of filling the box. |
| `paused` | `boolean` | `false` | Freeze the surface on its current frame. |
| `pointerInfluence` | `boolean` | `true` | Let the pointer push the flow field around. |
| `speed` | `number` | `DEFAULT_SPEED` | Time multiplier for the flow. |
| `variant` | `LiquidMetalVariant` | `'chrome'` | Material preset: chrome, gold, mercury or oil. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { LiquidMetal } from '@katana-ui/react'

export function LiquidMetalUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <LiquidMetal className="h-full w-full" variant="chrome">
        <div style={{ padding: 16 }}>Premium</div>
      </LiquidMetal>
    </div>
  )
}
```

## States

- 面：WebGL2 着色器，屏外停。
- maskText：CSS 渐变裁进字形，横向缓扫。
- WebGL2 不可用：CSS 圆锥渐变，不动。

## Don't

- 不要拿 maskText 的字当唯一的信息：字形里是渐变，浅色主题下对比不稳。
- 不要在行情区用：金属反光会抢走涨跌色的注意力。

## Composition

```
LiquidMetal
  div（aria-hidden）
    canvas
  div（children）
```
