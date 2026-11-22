# MorphIcon

图标的线条与形状在两个状态间补间：侧栏收展、列表与网格、菜单与叉、搜索放大、播放与停止、勾选方块。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### MorphIcon

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` * | `MorphIconVariant` | — | Which glyph: sidebar, list, grid, compact, menu, search, play or check. |
| `active` | `boolean` | `false` | false draws the first shape, true the second (menu to close, play to stop, list to grid). |
| `size` | `number` | `DEFAULT_SIZE` | Side length in px. |
| `strokeWidth` | `number` | `DEFAULT_STROKE_WIDTH` | Line width in the 24 x 24 view box. |
| `color` | `string` | `'currentColor'` | Stroke color; any CSS color, defaults to the text color. |
| `duration` | `number` | `DEFAULT_DURATION` | Seconds the shapes take to change. |
| `label` | `string` | — | Accessible name; leave it out when the icon is decoration. |
| `className` | `string` | — | Extra class name on the svg. |

### MORPH_ICON_VARIANTS

八个字形名的只读数组：sidebar、list、grid、compact、menu、search、play、check。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, MorphIcon } from '@katana-ui/react'

export function MorphIconUsage() {
  const [open, setOpen] = useState(false)
  return (
    <Button size="icon" aria-label="Menu" onClick={() => setOpen((value) => !value)}>
      <MorphIcon variant="menu" active={open} size={15} />
    </Button>
  )
}
```

## States

- active 为假：第一个形状；为真：线条补间到第二个形状（时长 duration，默认 0.3 秒）。

## Don't

- 不要拿它做纯装饰的循环动画，它只在状态变化时动。
- 图标放在按钮里时，名字写在按钮上，图标不要再传 label。

## Composition

```
MorphIcon
  svg
    motion 线条 / 矩形 / 路径
```
