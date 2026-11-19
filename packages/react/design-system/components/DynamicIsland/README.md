# DynamicIsland

一个胶囊，内容换了它就弹着变成新内容的大小；旧内容模糊淡出、新内容从略小处模糊淡入。拿来放成交回报、炸板提醒、连接状态这类「一眼看到、过会儿退回」的通知。内容与切换时机都由调用方定，件只管那一下弹性变形。

## Provide

`*` marks a required prop.

### DynamicIsland

view 是当前内容的键，换了才触发过渡；内容变了读屏礼貌播报（role=status、aria-live=polite）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `view` * | `string` | — | Key of the content on show; when it changes the island morphs to the new content. |
| `children` * | `ReactNode` | — | The content of the current view. |
| `label` * | `string` | — | Accessible name of the island; its content is announced politely when the view changes. |
| `bounce` | `number` | `DEFAULT_BOUNCE` | Spring bounce of the morph, 0 to 1. |
| `className` | `string` | — | Extra class name on the outer row. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, DynamicIsland } from '@katana-ui/react'

export function DynamicIslandUsage() {
  const [filled, setFilled] = useState(false)
  return (
    <>
      <Button onClick={() => setFilled((value) => !value)}>Toggle</Button>
      <DynamicIsland view={filled ? 'fill' : 'idle'} label="Trade notifications">
        {filled ? <p>Filled BTCUSDT buy 0.50 @ 106,977.4</p> : <p>Connected</p>}
      </DynamicIsland>
    </>
  )
}
```

## States

- 内容换了：胶囊弹簧变到新内容的大小（bounce 默认 0.4），内容模糊淡入。
- 同一 view 内内容变了：只改内容，不触发过渡。

## Don't

- 不要同时放两座岛：一个窗口只有一个通知出口。
- 不要用它承载要处理的事（确认、拒绝）：它会被下一条通知顶掉，要处理的用 Toast 或 Dialog。
- 内容别比 360px 宽：胶囊拉太宽会盖住顶栏。

## Composition

```
DynamicIsland
  div
    motion.div（胶囊，role=status）
      motion.div（内容，key=view）
```
