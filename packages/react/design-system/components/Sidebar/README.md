# Sidebar

一窄一宽并排，放不下时上下叠。恰好两个子节点：side 是 start 时第一个是窄的，是 end 时最后一个是窄的。窄的固定一个宽度（sideWidth），宽的拿走剩下的；宽的不到 contentMin（容器的一半，起始值）就整体叠成上下两块。sideWidth 收间距刻度名或像素数：刻度最大才 32px，放不下一块侧栏，所以也收数字。预览里的框右下角能拖宽窄。

## Provide

`*` marks a required prop.

### Sidebar

其余属性透传给渲染出的元素。子节点恰好两个。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `side` | `'start' \| 'end'` | `'start'` | Which child is the narrow one: the first (start) or the last (end). |
| `sideWidth` | `SpaceStep \| number` | `SIDEBAR_SIDE_WIDTH` | Width of the narrow child: a spacing step name or a number of pixels. |
| `contentMin` | `number` | `SIDEBAR_CONTENT_MIN` | Smallest share of the container the wide child keeps before the two stack (0 to 1). |
| `gap` | `SpaceStep` | `'space-3'` | Gap between the two children, a spacing step name. |
| `as` | `LayoutTag` | `'div'` | Element to render. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Sidebar } from '@katana-ui/react'

export function SidebarUsage() {
  return (
    <Sidebar side="start" sideWidth={240} gap="space-3">
      <nav aria-label="目录">窄的一块（第一个子节点）</nav>
      <main>宽的一块（最后一个子节点）</main>
    </Sidebar>
  )
}
```

## States

- 放得下：窄的在 side 指的那一边，宽的占满其余。
- 放不下（宽的不到 contentMin）：两块各占一整行，上下叠。
- 默认窄的 240px、contentMin 50%：都是待定的起始值，看 KATANAview 样板时量。

## Don't

- 不要放两个以上的子节点：多的块要自己包一层。
- 不要用它做三栏：嵌两层 Sidebar，或用 Grid。

## Composition

```
Sidebar
  窄的一块
  宽的一块
```
