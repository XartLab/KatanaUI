# Popover

点触发器打开的一块浮层，跟菜单同一块材质；三种皮肤：panel（带内边的面板）、menu（菜单容器）、bare（只给定位）。

## Provide

`*` marks a required prop.

### Popover

其余属性透传给 Radix Popover.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `closeOnScroll` | `boolean` | `true` | Closes the popover when the page or a container holding its trigger scrolls, so it never floats away open. |

### PopoverContent

其余属性透传给 Radix Popover.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `keyof typeof skin` | `'panel'` | Skin of the popup. |

### PopoverTrigger / PopoverAnchor / PopoverClose

透传 Radix 同名部件；Anchor 用来把弹层定位在触发器以外的元素上。

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
