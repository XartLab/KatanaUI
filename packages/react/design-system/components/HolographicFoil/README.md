# HolographicFoil

一张带全息箔的卡：条纹箔层随指针（或设备倾斜）漂移、色相偏转，上面掠过一道柔光，整张卡轻微 3D 倾斜；四种箔（prism、aurora、gold、oil），颜色全由 token 混出。适合年度最佳策略、里程碑这类奖牌卡；不进盯盘界面。

## Provide

`*` marks a required prop.

### HolographicFoil

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | Card content. |
| `className` | `string` | — | Extra classes for the card surface. |
| `foilOver` | `boolean` | `false` | Lay the foil over the content instead of printing it underneath. |
| `glare` | `number` | `0.5` | Strength of the highlight that passes over the content, `0` to `1`. |
| `intensity` | `number` | `0.6` | Foil strength, `0` (barely there) to `1` (full holo). |
| `pattern` | `HolographicFoilPattern` | `'prism'` | Which foil material the card is printed with. |
| `sheenSpeed` | `number` | `1` | Speed multiplier for the idle sheen sweep. |
| `tilt` | `boolean` | `true` | Couple the foil to a subtle 3D card tilt. |
| `useDeviceOrientation` | `boolean` | `false` | Opt into device tilt on touch devices. |
| `orientationLabel` | `string` | — | Label of the button that asks for device-tilt permission (iOS); without it no button is shown. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { HolographicFoil } from '@katana-ui/react'

export function HolographicFoilUsage() {
  return (
    <HolographicFoil pattern="prism">
      <div style={{ padding: 20, minHeight: 120 }}>Best strategy of the year: +38.2%</div>
    </HolographicFoil>
  )
}
```

## States

- 无精细指针：箔层静止，只有一道缓慢的掠光。
- 有精细指针：箔、柔光与卡面按指针偏移，卡倾斜最多 9 度。
- useDeviceOrientation：触屏设备按陀螺仪倾斜；iOS 要点 orientationLabel 那个按钮授权。

## Don't

- 不要在卡里放要读的小字而不给底色：箔在内容下面也会透出来。
- 不要整页铺：每张卡都是一堆混合层，列表里放几十张会掉帧。

## Composition

```
HolographicFoil
  motion.div（卡面，倾斜）
    div（箔层）
    div（children）
    div（掠光、柔光）
    button（orientationLabel，可选）
```
