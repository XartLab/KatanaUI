# MagneticField

指针靠近时，区域里的元素按弹簧被吸、被推或绕着转，离得越近越强；传 items 时件自己把每个元素放进弹簧容器，也可以给子元素加 data-magnetic。只在有精细指针的设备上启用。适合首页的板块标签云；不进有点击目标的操作区（会让人点不准）。

## Provide

`*` marks a required prop.

### MagneticField

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Extra content rendered inside the field. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `damping` | `number` | `DEFAULT_DAMPING` | Spring damping of the followers; higher settles faster. |
| `items` | `MagneticFieldItem[]` | — | Elements pulled by the pointer, each with an id and content. |
| `mode` | `MagneticFieldMode` | `'attract'` | How elements react to the pointer: attract, repel or orbit. |
| `paused` | `boolean` | `false` | Freezes the field in place while true. |
| `radius` | `number` | `DEFAULT_RADIUS` | Pointer influence radius in pixels. |
| `rotate` | `boolean` | `false` | Whether elements also rotate toward the pointer. |
| `stiffness` | `number` | `DEFAULT_STIFFNESS` | Spring stiffness of the followers; higher snaps faster. |
| `strength` | `number` | `DEFAULT_STRENGTH` | How strongly the pointer pulls or pushes, from 0 to 1. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MagneticField } from '@katana-ui/react'

const ITEMS = ['Semis', 'Banks', 'Energy'].map((name) => ({ id: name, element: <span>{name}</span> }))

export function MagneticFieldUsage() {
  return <MagneticField items={ITEMS} mode="attract" />
}
```

## States

- 指针在 radius 内：元素偏移，距离越近偏得越多。
- 指针离开：弹簧回位。
- 触屏或 paused：不启用，元素原位。

## Don't

- 不要用在按钮、输入框上：它们会跑开，点不到。
- 不要给太多元素：每帧要为每个元素算一次。

## Composition

```
MagneticField
  items 的每一项 motion.div > element
  或 children（带 data-magnetic 的子元素）
```
