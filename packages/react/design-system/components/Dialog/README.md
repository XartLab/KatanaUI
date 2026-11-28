# Dialog

模态对话框，560 宽，从下方升起。由代码打开（没有触发器）的对话框，关闭后焦点回到打开前的元素。

## Provide

`*` marks a required prop.

### Dialog

其余属性透传给 Radix Dialog.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onOpenChange` | `(open: boolean) => void` | — | Called when the dialog opens or closes. |

### DialogContent

其余属性透传给 Radix Dialog.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onEscapeKeyDown` | `(event: KeyboardEvent) => void` | — | Called when Escape is pressed; call `preventDefault()` to keep it open. |
| `onPointerDownOutside` | `(event: Event) => void` | — | Called on a pointer press outside; call `preventDefault()` to keep it open. |
| `onFocusOutside` | `(event: Event) => void` | — | Called when focus moves outside; call `preventDefault()` to keep it open. |
| `onInteractOutside` | `(event: Event) => void` | — | Called on any interaction outside (pointer or focus); call `preventDefault()` to keep it open. |
| `onOpenAutoFocus` | `(event: Event) => void` | — | Called when focus moves into the content; preventDefault keeps focus where it is. |
| `onCloseAutoFocus` | `(event: Event) => void` | — | Called when focus returns on close; preventDefault keeps focus where it is. |
| `forceMount` | `true` | — | Keep the content in the page while closed (hidden). |
| `asChild` | `boolean` | — | Merge the content's props onto its only child. |
| `children` | `ReactNode` | — | The content. |
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

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `asChild` | `boolean` | — | Merge the trigger's props onto its only child. |
| `children` | `ReactNode` | — | The content. |

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
- 打开：surface-raised 底、9% 白边（--k-overlay-dialog-borderColor）、--k-overlay-dialog-shadow，背后压一层遮罩。
- 头脚：标题栏 50 高、按钮栏上下各一道 5% 白分隔（--k-separable-subtle-borderColor）；正文太长时只滚正文。
- 确认类（.k-dlg.confirm）：边换成 line-200。

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
