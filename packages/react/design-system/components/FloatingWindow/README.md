# FloatingWindow

把任意子树放进一个置顶的小窗（照 OKX 下单面板的「在悬浮窗中交易」，2026-11-26 实测）：浏览器有 Document Picture-in-Picture（Chrome / Edge 116+）时开真窗口，开窗时复制当前文档的样式表、根元素的 data-theme 与正文底色字色；没有时退成页内可拖的浮层（popover 顶层，标题栏拖动或方向键移动，关闭钮与 Esc 关）。受控：open 与 onClose，配 useFloatingWindow。子树始终渲染进同一个 host 元素、换窗只搬这个元素，所以输入的半截字、滚动位置、组件状态都不丢；关窗回到原处。

## Provide

`*` marks a required prop.

### FloatingWindow

open 受控，用户关窗时回调 onClose，宿主再把 open 设回 false。placeholder 画在原位（窗开着时）。width / height 只在开窗那一刻读。inPageOnly 强制只用页内浮层。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` * | `boolean` | — | Whether the content is in the small window. |
| `onClose` | `() => void` | — | Called when the user closes the window (closes the picture-in-picture window, clicks the close button, presses Esc). |
| `children` * | `ReactNode` | — | The subtree. |
| `title` * | `string` | — | Title of the window: the title bar of the in-page layer and its accessible name. |
| `placeholder` | `ReactNode` | — | Drawn in place of the subtree while it is in the window (a line saying where it went, with a button to bring it back). |
| `width` | `number` | `380` | Width of the window in pixels. |
| `height` | `number` | `560` | Height of the window in pixels. |
| `inPageOnly` | `boolean` | `false` | Use only the in-page layer even when the browser has picture-in-picture (embedded pages, tests). |
| `labels` * | `FloatingWindowLabels` | — | Accessible names. |
| `className` | `string` | — | Extra class name on the root. |

### useFloatingWindow(initialOpen?)

返回 { open, supported, show, hide, toggle, props }；props 直接展开到 FloatingWindow 上。

### isFloatingWindowSupported()

浏览器现在能不能开真 PiP 窗（每次调用时现读）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, Input } from '@katana-ui/react'
import { FloatingWindow, useFloatingWindow } from '@katana-ui/react/blocks'

// 演示用的小下单区（不是 OrderTicket）：点击计数在换窗时保留，证明子树没有重新挂载。
function MiniTicket() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ display: 'grid', gap: 8, padding: 12, width: 300 }}>
      <Input aria-label="价格" defaultValue="94820.5" />
      <Button onClick={() => setCount((n) => n + 1)}>买入</Button>
      <p data-gallery-count={count} style={{ margin: 0, fontSize: 12 }}>
        已下 {count} 单
      </p>
    </div>
  )
}

export function FloatingWindowUsage() {
  const floating = useFloatingWindow()
  return (
    <div style={{ width: 340 }}>
      <Button onClick={floating.toggle} aria-pressed={floating.open}>
        {floating.open ? '放回原处' : '在悬浮窗中交易'}
      </Button>
      <FloatingWindow
        {...floating.props}
        title="下单"
        width={340}
        height={240}
        labels={{ close: '关闭悬浮窗', move: '移动悬浮窗：拖动标题栏或按方向键' }}
        placeholder={<p style={{ margin: '8px 0', fontSize: 12 }}>下单区已在悬浮窗中。</p>}
      >
        <MiniTicket />
      </FloatingWindow>
    </div>
  )
}
```

## States

- 关着：子树在原处，不画占位。
- 开着、浏览器有 PiP：先在原处，窗一开成功就搬进小窗，原位画 placeholder。
- 开着、没有 PiP（或开窗被拒：没有刚操作过、已有一个窗）：搬进页内浮层，默认贴右下角 16px，拖过之后用 left / top。
- 用户关 PiP 窗、点浮层的关闭钮或在浮层里按 Esc：回调 onClose；宿主设回 open=false，子树回到原处，状态还在。
- 主文档切主题：PiP 窗的 data-theme 等根属性跟着同步。

## Don't

- 不要用 key 或条件渲染在窗内外各放一份：子树只传一份，件自己搬 DOM，状态才不丢。
- 不要在没有用户操作的时候把 open 设成 true：PiP 要用户刚点过，否则被拒、退到页内浮层。
- 开窗之后新加的样式表（懒加载的 CSS）不会跟过去；要用到的样式先在开窗前载入。

## Composition

```
FloatingWindow
  slot（关着时子树的家）· placeholder（窗开着时）
  页内浮层（popover=manual，role=dialog）：标题栏把手 button · 关闭钮 · 内容区
  host（子树的容器，在 slot、浮层内容区、PiP 窗 body 之间被搬动）
```

## Keyboard

- `Tab`：到页内浮层的标题栏把手、关闭钮与子树里的控件
- `← ↑ → ↓`：焦点在标题栏把手上，移动页内浮层 8px；按住 Shift 32px
- `Esc`：焦点在页内浮层里，关窗（onClose）
