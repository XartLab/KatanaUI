# Dialog

模态对话框，560 宽，从下方升起。由代码打开（没有触发器）的对话框，关闭后焦点回到打开前的元素。

## Provide

### Dialog

其余属性透传给 Radix Dialog.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open / onOpenChange` | `boolean / (open: boolean) => void` | — | 受控的开合；代码开的对话框用它。 |

### DialogContent

其余属性透传给 Radix Dialog.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `closeLabel` | `string` | — | 给了就在标题栏右上角画关闭钮，读屏读这个名字；包里不放文案。 |
| `bare` | `boolean` | — | 不带皮肤，样子由调用方的类名给。 |
| `overlayClassName` | `string` | — | 遮罩上追加的类名。 |

### DialogTitle

其余属性透传给 Radix Dialog.Title。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bare` | `boolean` | — | 不带标题样式。 |

### DialogHeader / DialogBody / DialogFooter

标题栏（50 高）、正文、按钮栏，纯排版。

### DialogTrigger / DialogClose / DialogDescription / DialogPortal / DialogOverlay

透传 Radix 同名部件。

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
