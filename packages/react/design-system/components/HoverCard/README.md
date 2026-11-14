# HoverCard

指针停在触发器上（或键盘焦点到了它）弹出的一小块补充信息，跟弹层同一块材质；延迟用 Radix 默认（700ms 开、300ms 关）。卡里不放必须操作的东西。

## Provide

### HoverCard

其余属性透传给 Radix HoverCard.Root。openDelay、closeDelay 在这里改。

### HoverCardContent

其余属性透传给 Radix HoverCard.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | 对齐触发器的哪一边。 |
| `sideOffset` | `number` | `4` | 离触发器的距离。 |

## States

- 悬停约 700ms 后出，移开约 300ms 后收；键盘焦点到触发器也出。
- Esc 收起。

## Don't

- 不要把必须读到的信息只放在悬停卡里，触屏没有悬停。
- 不要放可点的主要操作，用 Popover。
- 不要放太长的内容，它是补充。

## Composition

```
HoverCard
  HoverCardTrigger
  HoverCardContent
```

## Keyboard

- `Tab`：焦点到触发器时卡也出来
- `Esc`：收起
