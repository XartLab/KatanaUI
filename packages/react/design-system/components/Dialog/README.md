# Dialog

模态对话框，560 宽，从下方升起。由代码打开（没有触发器）的对话框，关闭后焦点回到打开前的元素。

## Provide

`*` marks a required prop.

### Dialog

其余属性透传给 Radix Dialog.Root。

### DialogContent

其余属性透传给 Radix Dialog.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `closeLabel` | `string` | — | When given, draws a close button at the top right of the title bar and uses this as its accessible name. |
| `bare` | `boolean` | — | Skip the skin and the position; the caller's class names style the content. |
| `overlayClassName` | `string` | — | Extra class name on the backdrop. |

### DialogTitle

其余属性透传给 Radix Dialog.Title。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bare` | `boolean` | — | Skip the title style. |

### DialogHeader / DialogBody / DialogFooter

标题栏（50 高）、正文、按钮栏，纯排版。

### DialogTrigger / DialogClose / DialogDescription / DialogPortal / DialogOverlay

透传 Radix 同名部件。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@katana-ui/react'

export function DialogUsage() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Reset layout</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close">
        <DialogHeader>
          <DialogTitle>Reset layout</DialogTitle>
        </DialogHeader>
        <DialogBody>Widgets you added will be removed.</DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">Reset</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## States

- 收起；打开后焦点圈在对话框里，Esc 关闭并还回焦点。

## Don't

- 不要用对话框放不重要的通知。
- 对话框必须有标题。

## Composition

```
Dialog
  DialogTrigger
  DialogContent
    DialogHeader
      DialogTitle
    DialogBody
      DialogDescription
    DialogFooter
      DialogClose
```

## Keyboard

- `Esc`：关闭，焦点回到打开前的元素
- `Tab / Shift+Tab`：焦点在对话框里循环，不出去
