# Popover

点触发器打开的一块浮层，跟菜单同一块材质；三种皮肤：panel（带内边的面板）、menu（菜单容器）、bare（只给定位）。

## Provide

### Popover

其余属性透传给 Radix Popover.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open / onOpenChange` | `boolean / (open: boolean) => void` | — | 受控的开合。 |

### PopoverContent

其余属性透传给 Radix Popover.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'panel' \| 'menu' \| 'bare'` | `'panel'` | 皮肤。 |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 对齐触发器的哪一边。 |
| `sideOffset` | `number` | `4` | 离触发器的距离。 |

### PopoverTrigger / PopoverAnchor / PopoverClose

透传 Radix 同名部件；Anchor 用来把弹层定位在触发器以外的元素上。

### PopoverHeader / PopoverTitle / PopoverDescription

面板里的标题区，纯排版。

### useHoverOpen

Radix 没有悬停打开，这个钩子补上：返回 open、setOpen 与挂在触发器和内容上的 hover 事件。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `openDelay` | `number` | — | 停在触发器上多少毫秒后开。 |
| `closeDelay` | `number` | — | 离开触发器与弹层多少毫秒后收。 |

## States

- 收起；打开后焦点落进去，Esc 收起并还回焦点。
- 三种皮肤：panel、menu、bare。

## Don't

- 不要在弹层里再开弹层。

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
