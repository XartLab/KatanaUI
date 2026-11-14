# ScrollArea

Radix 的自绘滚动条，4px 宽，平时不出现，指针到了这一块才出一条淡线（18% 墨色，指到滚动条上 32%）。调用方要给它一个确定的高。

## Provide

`*` marks a required prop.

### ScrollArea

其余属性透传给 Radix ScrollArea.Root。给 Root 一个确定的高（或 max-height），内容比它高才滚。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `viewportClassName` | `string` | — | Extra class name on the scrolling viewport inside. |

### ScrollBar

自己拼时用；orientation 默认 vertical。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ScrollArea } from '@katana-ui/react'

export function ScrollAreaUsage() {
  return (
    <ScrollArea style={{ height: 120, width: 200 }}>
      {Array.from({ length: 30 }, (_, index) => (
        <div key={index}>{`Row ${index + 1}`}</div>
      ))}
    </ScrollArea>
  )
}
```

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
