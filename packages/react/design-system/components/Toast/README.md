# Toast

固定在窗口一角的弹出提示：只管样子与读屏语义（live region），条目表、定时、暂停由调用方管（应用里 AlertToasts 配 toast-queue.ts）。进出走 translate 与不透明度的过渡。

## Provide

### ToastViewport

其余属性透传给 div。role=region、aria-live=assertive：新插进来的条目读屏马上读；aria-label 由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | 哪个角。下面两个角新的贴着窗口边往上叠，上面两个角往下叠。 |

### Toast

其余属性透传给 div。过渡的起点与终点由 data-starting-style、data-ending-style 给（phase 换的）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `phase` | `'entering' \| 'open' \| 'closing'` | `'open'` | entering 是刚插进来（画一帧再改成 open，过渡才有起点）；closing 是收起中，过了 TOAST_EXIT_MS 调用方再摘节点。 |

### ToastClose

其余属性透传给 Button（icon 变体）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 读屏名（必填，包里不放文案）。 |

### ToastClear / ToastIcon / ToastText / ToastTitle / ToastDescription / ToastContent

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
