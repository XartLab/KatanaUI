# MotionLoader

一组连续运动的小加载指示：轨道、彗星、雷达、波形条、点环、呼吸光、方块蛇、变形环；都从 size 一个数缩放，颜色跟文字色。波形条与行情的条形很搭，点环适合行内。与 GridLoader 的分工：GridLoader 是像素点阵，MotionLoader 是连续运动的圆形。

## Provide

`*` marks a required prop.

### MotionLoader

role=status，label 必填；speed 是倍率。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name, for example "Syncing positions". |
| `variant` | `MotionLoaderVariant` | `'orbit'` | Which animation to draw. |
| `size` | `number` | `24` | Side of the square in pixels; every variant scales from it. |
| `speed` | `number` | `1` | Speed multiplier; 2 runs twice as fast. |
| `color` | `string` | — | Any CSS colour, tokens included; defaults to the current text colour. |
| `className` | `string` | — | Extra class name on the root. |

### MOTION_LOADER_VARIANTS

常量：八个款式的名字。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MotionLoader } from '@katana-ui/react'

export function MotionLoaderUsage() {
  return <MotionLoader label="Syncing positions" variant="orbit" size={32} />
}
```

## States

- 八个款式各自循环；size 缩放到 16px 也能读出。
- speed 2 为两倍速。

## Don't

- 不要拿它当进度条：它不表示进度。
- 不要给它加文字说明靠颜色：说明写在 label 里。

## Composition

```
MotionLoader
  span（role=status）
    （款式的运动层）
```
