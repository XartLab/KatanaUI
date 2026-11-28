# Sheet

贴着窗口一边滑出来的面板，行为同对话框（Radix Dialog）：Esc 关、焦点锁在里面、点背板关、关了焦点回打开前拿着它的元素。左右宽 360，上下最高半屏。

## Provide

`*` marks a required prop.

### Sheet

其余属性透传给 Radix Dialog.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onOpenChange` | `(open: boolean) => void` | — | Called when the sheet opens or closes. |

### SheetContent

其余属性透传给 Radix Dialog.Content。要有 SheetTitle（读屏靠它报名字），不想显示就加 sr-only。

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
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `'right'` | Which edge the sheet sticks to; it slides in from that edge. |
| `children` | `ReactNode` | — | The content. |
| `closeLabel` | `string` | — | When given, draws a close button at the top right and uses this as its accessible name. |

### SheetHeader / SheetBody / SheetFooter / SheetTitle / SheetDescription

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@katana-ui/react'

export function SheetUsage() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open drawer</Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel="Close">
        <SheetHeader>
          <SheetTitle>Symbol details</SheetTitle>
          <SheetDescription>Details of the selected symbol.</SheetDescription>
        </SheetHeader>
        <SheetBody>Body</SheetBody>
      </SheetContent>
    </Sheet>
  )
}
```

## States

- 关闭、打开：从所在边滑入滑出，遮罩淡入淡出。
- side：right、left 宽 360，top、bottom 最高半屏。
- 焦点锁在里面，关了回到打开前拿着焦点的元素。

## Don't

- 不要拿它当确认框，要用户裁决的事用 Dialog。
- 不要不带标题与说明，读屏要用。
- 不要在抽屉里再开抽屉。

## Composition

```
Sheet
  SheetTrigger
  SheetContent
    SheetHeader
      SheetTitle
      SheetDescription
    SheetBody
    SheetFooter
      SheetClose
```

## Keyboard

- `Tab`：焦点在抽屉里走一圈，不会出去
- `Esc`：关闭，焦点回触发器
