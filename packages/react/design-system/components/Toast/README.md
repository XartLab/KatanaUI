# Toast

固定在窗口一角的弹出提示：只管样子与读屏语义（live region），条目表、定时、暂停由调用方管（应用里 AlertToasts 配 toast-queue.ts）。进出走 translate 与不透明度的过渡。视口 polite 礼貌播报，warn / danger 单条 role=alert；能撤销的操作配 ToastAction 与可选的 ToastCountdown。

## Provide

`*` marks a required prop.

### ToastViewport

其余属性透传给 div。role=region、aria-live=polite：新插进来的条目读屏等空了再读，不打断；aria-label 由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `position` | `ToastPosition` | `'bottom-right'` | Which corner: at the bottom corners new toasts stack upward from the window edge, at the top corners downward. |

### Toast

其余属性透传给 div。过渡的起点与终点由 data-starting-style、data-ending-style 给（phase 换的）。tone（Severity）定色条与图标的颜色，neutral 是主文字色色条加强调色图标。tone 为 warn、danger 时这一条自带 role=alert（插入即打断播报），neutral、ok 不带，靠视口礼貌播报；调用方给的 role 排在后面能盖掉。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `Severity` | `'neutral'` | Tone of the color bar and the icon: neutral (default), ok, warn or danger. |
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
| `pending` | `boolean` | — | The action is running. |
| `spinIcon` | `boolean` | — | Use with pending when the button's own icon already means the action (refresh, sync): that icon turns from the press, at least one whole turn, and stops on a whole turn; no separate spinner. |
| `label` * | `string` | — | Accessible name (required; the package ships no text). |

### ToastAction

其余属性透传给 Button（ghost、sm）。一个文字钮，如「撤销」，文字由调用方给；强调色字，悬停才有底。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"link" \| "danger" \| "default" \| "primary" \| "ghost" \| "icon"` | — | Visual style: primary is the solid light button, danger uses the danger text color, icon is a borderless 28px icon button. |
| `size` | `ButtonSize \| 'default' \| null` | — | Height: sm is 26px, md (default) is 30px, icon is a 28px square. |
| `asChild` | `boolean` | — | Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. |
| `effect` | `ButtonEffect` | — | Optional hover effect from SmoothUI: magnetic leans toward the pointer, dot-morph stretches a leading dot into a bar, clip-corners cuts the corners wider. |
| `magnetStrength` | `number` | — | How far a magnetic button leans: the fraction of the pointer offset it follows (0 to 1). |
| `magnetRadius` | `number` | — | Distance in px from the button center within which a magnetic button reacts. |
| `pending` | `boolean` | — | The action is running. |
| `spinIcon` | `boolean` | — | Use with pending when the button's own icon already means the action (refresh, sync): that icon turns from the press, at least one whole turn, and stops on a whole turn; no separate spinner. |

### ToastCountdown

remaining（0 到 1）是剩余时间的比例，1 刚出现、0 要收了，超出范围收进 0 到 1。计时在调用方（toast-queue），包里不计时；建议每 100ms 更新一次，环随比例变短，中间不写秒数。纯装饰，aria-hidden。其余属性透传给 svg。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `remaining` * | `number` | — | Time left as a fraction, 1 (just shown) down to 0 (about to close). |

### ToastClear / ToastIcon / ToastText / ToastTitle / ToastDescription / ToastContent

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastCountdown,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
} from '@katana-ui/react'

export function ToastUsage() {
  return (
    <div className="flex w-[340px] flex-col gap-2">
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
      {/* An action toast: do the thing first, then offer Undo. remaining (0 to 1) comes from your own clock. */}
      <Toast>
        <ToastContent>
          <ToastIcon />
          <ToastText>
            <ToastTitle>Drawing deleted</ToastTitle>
            <ToastDescription>Trend line BTCUSDT 1H</ToastDescription>
          </ToastText>
          <ToastCountdown remaining={0.6} />
          <ToastAction>Undo</ToastAction>
          <ToastClose label="Dismiss" />
        </ToastContent>
      </Toast>
    </div>
  )
}
```

## States

- 进入：从边上平移加淡入（phase=entering 画一帧再切 open）。
- 收起：反向平移淡出，播完（TOAST_EXIT_MS）调用方再摘节点。
- 多条：按位置叠，两条以上出「全部关掉」。
- 语气：neutral（默认）、ok、warn、danger，色条与图标取 --k-status-*-foreground；说明文字是 ink-2（console 主题下 ink-3 不到 4.5:1）。
- 动作 toast：标题、倒计时环（16px 空心环，随剩余比例变短，中间不写秒数）、一个「撤销」钮、关闭钮并排；撤销以后调用方把同一条改成「已恢复」，约 1.5 秒后收。

## Don't

- 不要把需要用户处理的事只放在弹出提示里，它会自己消失。
- 不要事后 toast 一件不能撤销的事：先确认（AlertDialog），或者做成能撤销的再给「撤销」。
- 不要把价格告警这类系统消息当 toast 用：它是通知，应进铃下的列表（NotificationBell），toast 只是到达提示。
- 不要只靠色条说语气：标题里写明（「下单被拒」而不是「出错了」）。
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
      ToastCountdown（可选）
      ToastAction（可选）
      ToastClose
  ToastClear
```

## Keyboard

- `Tab`：走到「撤销」、关闭钮、「全部关掉」
- `Enter / Space`：撤销，或关掉这一条或全部
