# Toast

固定在窗口一角的弹出提示：只管样子与读屏语义（live region），条目表、定时、暂停由调用方管（应用里 AlertToasts 配 toast-queue.ts）。进出走 translate 与不透明度的过渡。

## Provide

`*` marks a required prop.

### ToastViewport

其余属性透传给 div。role=region、aria-live=assertive：新插进来的条目读屏马上读；aria-label 由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `position` | `ToastPosition` | `'bottom-right'` | Which corner: at the bottom corners new toasts stack upward from the window edge, at the top corners downward. |

### Toast

其余属性透传给 div。过渡的起点与终点由 data-starting-style、data-ending-style 给（phase 换的）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `phase` | `ToastPhase` | `'open'` | entering is just inserted (draw one frame, then switch to open so the transition has a start); closing is leaving, and the caller removes the node after TOAST_EXIT_MS. |

### ToastClose

其余属性透传给 Button（icon 变体）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `asChild` | `boolean` | — | Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. |
| `variant` | `"link" \| "danger" \| "default" \| "primary" \| "ghost" \| "icon"` | — | Visual style: primary is the solid light button, danger uses the danger text color, icon is a borderless 28px icon button. |
| `size` | `ButtonSize \| 'default' \| null` | — | Height: sm is 26px, md (default) is 30px, icon is a 28px square. |
| `effect` | `ButtonEffect` | — | Optional hover effect from SmoothUI: magnetic leans toward the pointer, dot-morph stretches a leading dot into a bar, clip-corners cuts the corners wider. |
| `magnetStrength` | `number` | — | How far a magnetic button leans: the fraction of the pointer offset it follows (0 to 1). |
| `magnetRadius` | `number` | — | Distance in px from the button center within which a magnetic button reacts. |
| `label` * | `string` | — | Accessible name (required; the package ships no text). |

### ToastClear / ToastIcon / ToastText / ToastTitle / ToastDescription / ToastContent

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Toast, ToastContent, ToastClose, ToastDescription, ToastIcon, ToastText, ToastTitle } from '@katana-ui/react'

export function ToastUsage() {
  return (
    <Toast>
      <ToastContent>
        <ToastIcon />
        <ToastText>
          <ToastTitle>BTCUSDT crossed 106,000</ToastTitle>
          <ToastDescription>Trigger price 106,012.4</ToastDescription>
        </ToastText>
        <ToastClose label="Dismiss" />
      </ToastContent>
    </Toast>
  )
}
```

## States

- 进入：从边上平移加淡入（phase=entering 画一帧再切 open）。
- 收起：反向平移淡出，播完（TOAST_EXIT_MS）调用方再摘节点。
- 多条：按位置叠，两条以上出「全部关掉」。

## Don't

- 不要把需要用户处理的事只放在弹出提示里，它会自己消失。
- 不要在包里写死文案，关闭名与「全部关掉」都由调用方传。
- 不要自己再做一套计时与队列放进 Toast，那是调用方的事。

## Composition

```
ToastViewport
  Toast
    ToastContent
      ToastIcon
      ToastText
        ToastTitle
        ToastDescription
      ToastClose
  ToastClear
```

## Keyboard

- `Tab`：走到关闭钮、「全部关掉」
- `Enter / Space`：关掉这一条或全部
