# AlertDialog

要用户明确选一个才关的对话框：平仓、撤单、删除这类不能撤回的事。点背板不关，打开时焦点落在「取消」，Esc 关掉（不点任何钮）；样子同 Dialog，Console 下边粗一档。

## Provide

`*` marks a required prop.

### AlertDialog

其余属性透传给 Radix AlertDialog.Root。

### AlertDialogContent

size：default 560 宽（同 Dialog）、sm 320 宽（一句话说得清的确认）。其余属性透传给 Radix AlertDialog.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `'default' \| 'sm'` | `'default'` | Width: default is 560px like Dialog, sm is 320px for a one-line confirmation. |
| `overlayClassName` | `string` | — | Extra class name on the backdrop. |

### AlertDialogAction

variant：primary（默认）、danger（不能撤回的）、default。画成 Button，点了关闭。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `ButtonSize \| 'default' \| null` | — | Height: sm is 26px, md (default) is 30px, icon is a 28px square. |
| `asChild` | `boolean` | — | Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. |
| `effect` | `ButtonEffect` | — | Optional hover effect from SmoothUI: magnetic leans toward the pointer, dot-morph stretches a leading dot into a bar, clip-corners cuts the corners wider. |
| `magnetStrength` | `number` | — | How far a magnetic button leans: the fraction of the pointer offset it follows (0 to 1). |
| `magnetRadius` | `number` | — | Distance in px from the button center within which a magnetic button reacts. |
| `pending` | `boolean` | — | The action is running. |
| `spinIcon` | `boolean` | — | Use with pending when the button's own icon already means the action (refresh, sync): that icon turns from the press, at least one whole turn, and stops on a whole turn; no separate spinner. |
| `variant` | `'primary' \| 'danger' \| 'default'` | `'primary'` | Button style: primary by default, danger for an action that cannot be undone. |

### AlertDialogCancel

画成 Button；打开时焦点在它上面。Esc 关掉但不点它，取消要做的事写在 AlertDialog 的 onOpenChange 里。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"link" \| "default" \| "danger" \| "primary" \| "ghost" \| "icon"` | — | Visual style: primary is the solid light button, danger uses the danger text color, icon is a borderless 28px icon button. |
| `size` | `ButtonSize \| 'default' \| null` | — | Height: sm is 26px, md (default) is 30px, icon is a 28px square. |
| `asChild` | `boolean` | — | Render the child element itself (a link, a menu trigger) instead of wrapping it in a button. |
| `effect` | `ButtonEffect` | — | Optional hover effect from SmoothUI: magnetic leans toward the pointer, dot-morph stretches a leading dot into a bar, clip-corners cuts the corners wider. |
| `magnetStrength` | `number` | — | How far a magnetic button leans: the fraction of the pointer offset it follows (0 to 1). |
| `magnetRadius` | `number` | — | Distance in px from the button center within which a magnetic button reacts. |
| `pending` | `boolean` | — | The action is running. |
| `spinIcon` | `boolean` | — | Use with pending when the button's own icon already means the action (refresh, sync): that icon turns from the press, at least one whole turn, and stops on a whole turn; no separate spinner. |

### AlertDialogHeader / AlertDialogBody / AlertDialogFooter

标题栏（50 高）、正文、按钮栏，纯排版，同 Dialog。

### AlertDialogTrigger / AlertDialogTitle / AlertDialogDescription / AlertDialogPortal / AlertDialogOverlay

透传 Radix 同名部件。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@katana-ui/react'

export function AlertDialogUsage() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Close position</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close BTCUSDT long</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>Sells 0.250 contracts at market. This cannot be undone.</AlertDialogDescription>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger">Close position</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

## States

- 收起；打开后焦点落在「取消」，圈在对话框里；关闭后焦点回触发器，没有触发器时回到打开前的元素。
- 打开：同 Dialog 的底、阴影与升起动效；Console 下边换成粗一档的分隔色（--k-separable-bold-borderColor），Graphite 下同其它浮层是玻璃边。
- 点背板不关：只有「取消」「确认」与 Esc 能关。

## Don't

- 能撤回的操作不要用确认对话框，直接做并给撤销。
- 按钮写动作本身（「平仓」「删除」），不要写「确定」「是」。
- 要填表、要多步的用 Dialog。

## Composition

```
AlertDialog
  AlertDialogTrigger
  AlertDialogContent
    AlertDialogHeader
      AlertDialogTitle
    AlertDialogBody
      AlertDialogDescription
    AlertDialogFooter
      AlertDialogCancel
      AlertDialogAction
```

## Keyboard

- `Esc`：关闭（不点任何钮，只触发 onOpenChange(false)），焦点回到打开前的元素
- `Tab / Shift+Tab`：焦点在「取消」与「确认」之间循环，不出去
- `Enter / Space`：按下拿着焦点的钮
