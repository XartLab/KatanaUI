# Switcher

一行放几块；容器窄于 threshold（px）时整体变成竖排，不是一块一块地往下掉：要么全在一行，要么全竖着。靠的是容器宽度，不是视口宽度，所以放在窄边栏里也对。什么时候用：两三张并列的卡、一对图表。预览里的框右下角能拖宽窄。

## Provide

`*` marks a required prop.

### Switcher

其余属性透传给渲染出的元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `threshold` | `number` | `SWITCHER_THRESHOLD` | Container width in pixels below which all children stack. |
| `gap` | `SpaceStep` | `'space-3'` | Gap between children, a spacing step name. |
| `as` | `LayoutTag` | `'div'` | Element to render. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Switcher } from '@katana-ui/react'

export function SwitcherUsage() {
  return (
    <Switcher threshold={480} gap="space-3">
      <div>甲</div>
      <div>乙</div>
      <div>丙</div>
    </Switcher>
  )
}
```

## States

- 容器宽于 threshold：子节点平分一行。
- 容器窄于 threshold：子节点各占一行，上下叠。
- 默认 threshold 480px：待定的起始值，看 KATANAview 样板时量。

## Don't

- 不要拿它做块数很多的网格：多了用 Grid。
- 不要把 threshold 当视口断点：它量的是容器。

## Composition

```
Switcher
  两个或更多子节点
```
