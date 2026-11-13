# ScrollArea

Radix 的自绘滚动条，4px 宽，平时不出现，指针到了这一块才出一条淡线（18% 墨色，指到滚动条上 32%）。调用方要给它一个确定的高。

## Provide

### ScrollArea

其余属性透传给 Radix ScrollArea.Root。给 Root 一个确定的高（或 max-height），内容比它高才滚。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | `'hover' \| 'always' \| 'scroll' \| 'auto'` | `'hover'` | hover：指到才显示；always：一直；scroll：滚动时；auto：内容溢出就显示。 |
| `viewportClassName` | `string` | — | 给里面可滚动的 Viewport。 |

### ScrollBar

自己拼时用；orientation 默认 vertical。

## States

- 平时没有滚动条；指到或滚动时出 4px 的线。
- 悬停滚动条提亮；视口可键盘聚焦，方向键能滚。

## Don't

- 不要给应用里已经靠全局原生滚动条的容器再套一层，两套并存会重复。
- 不要隐藏视口的键盘聚焦。
- 不要在需要原生滚动行为（回弹、系统设置）的地方用。

## Composition

```
ScrollArea
  （内部：Viewport、ScrollBar 竖与横、Corner）
```

## Keyboard

- `Tab`：聚焦滚动区
- `↑ ↓ PageUp PageDown Home End`：滚动
