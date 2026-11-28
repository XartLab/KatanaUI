# Popover

点触发器打开的一块浮层，跟菜单同一块材质；三种皮肤：panel（带内边的面板）、menu（菜单容器）、bare（只给定位）。

## Provide

`*` marks a required prop.

### Popover

其余属性透传给 Radix Popover.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Whether the popover is open (controlled). |
| `defaultOpen` | `boolean` | `false` | Whether it starts open (uncontrolled). |
| `onOpenChange` | `(open: boolean) => void` | — | Called when it opens or closes. |
| `closeOnScroll` | `boolean` | `true` | Closes the popover when the page or a container holding its trigger scrolls, so it never floats away open. |
| `modal` | `boolean` | — | Whether the rest of the page is inert while it is open; false by default. |
| `children` | `ReactNode` | — | The content. |

### PopoverContent

其余属性透传给 Radix Popover.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onEscapeKeyDown` | `(event: KeyboardEvent) => void` | — | Called when Escape is pressed; call `preventDefault()` to keep it open. |
| `onPointerDownOutside` | `(event: Event) => void` | — | Called on a pointer press outside; call `preventDefault()` to keep it open. |
| `onFocusOutside` | `(event: Event) => void` | — | Called when focus moves outside; call `preventDefault()` to keep it open. |
| `onInteractOutside` | `(event: Event) => void` | — | Called on any interaction outside (pointer or focus); call `preventDefault()` to keep it open. |
| `onOpenAutoFocus` | `(event: Event) => void` | — | Called when focus moves into the content; preventDefault keeps focus where it is. |
| `onCloseAutoFocus` | `(event: Event) => void` | — | Called when focus returns on close; preventDefault keeps focus where it is. |
| `forceMount` | `true` | — | Keep the content in the page while closed (hidden). |
| `asChild` | `boolean` | — | Merge the content's props onto its only child. |
| `hideWhenDetached` | `boolean` | — | Close when the anchor scrolls out of view; ignored (closeOnScroll on Popover decides). |
| `avoidCollisions` | `boolean` | — | Whether the popover flips to stay on screen; always on. |
| `variant` | `keyof typeof skin` | `'panel'` | Skin of the popup. |
| `children` | `ReactNode` | — | The content. |

### PopoverTrigger / PopoverAnchor / PopoverClose

透传 Radix 同名部件；Anchor 用来把弹层定位在触发器以外的元素上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `asChild` | `boolean` | — | Merge the trigger's props onto its only child instead of rendering a button. |
| `children` | `ReactNode` | — | The content. |

### PopoverHeader / PopoverTitle / PopoverDescription

面板里的标题区，纯排版。

### useHoverOpen

Radix 没有悬停打开，这个钩子补上：返回 open、setOpen 与挂在触发器和内容上的 hover 事件。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `openDelay` * | `number` | — | Milliseconds the pointer must rest on the trigger before it opens. |
| `closeDelay` * | `number` | — | Milliseconds after the pointer leaves the trigger and content before it closes. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Button, Popover, PopoverContent, PopoverTrigger } from '@katana-ui/react'

export function PopoverUsage() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Details</Button>
      </PopoverTrigger>
      <PopoverContent>The default trading day is the latest one.</PopoverContent>
    </Popover>
  )
}
```

## States

- 收起；打开后焦点落进去，Esc 收起并还回焦点。
- 三种皮肤：panel、menu、bare。

## Don't

- 不要在弹层里再开弹层。
- 只读的说明用 Tooltip 或 HoverCard，不要用 Popover。
- 要打断用户、必须裁决的事用 Dialog。

## Composition

```
Popover
  PopoverTrigger
  PopoverContent
    PopoverHeader
      PopoverTitle
      PopoverDescription
    PopoverClose
```

## Keyboard

- `Enter / Space`：在触发器上打开
- `Tab`：焦点在弹层里循环
- `Esc`：收起，焦点回触发器
