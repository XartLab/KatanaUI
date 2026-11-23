# Input

单行文本框：30 高（sm 26 高），4% 白底 8% 白边；聚焦边变亮，禁用降到 45%。可选 floatingLabel：标签从框里升到框上。

## Provide

`*` marks a required prop.

### Input

其余属性透传给原生 input；type 默认 text。caption / unit / align / wrapperClassName 见属性表与状态。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `InputSize \| 'default' \| null` | — | Height: sm is 26px, md (default) is 30px; `'default'` is the deprecated name of md. |
| `floatingLabel` | `string` | — | Label that rests inside the box like a placeholder and floats into a 14px band above it on focus or when there is a value; the placeholder prop is ignored. |
| `caption` | `ReactNode` | — | Label inside the box on the left (a string becomes a real label for the input; a node, such as a select, is rendered as is and needs its own accessible name). |
| `unit` | `string` | — | Unit inside the box on the right, such as USDT or ×. |
| `align` | `'start' \| 'end'` | — | Text alignment of the value; with caption or unit the value is usually `end`, right next to the unit. |
| `wrapperClassName` | `string` | — | Extra class name on the outer box when caption or unit is given (the box height, for example); `className` always goes to the input. |

### inputVariants

返回类名的函数，给 textarea 等非 input 元素用。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Input } from '@katana-ui/react'

export function InputUsage() {
  return <Input aria-label="Quantity" placeholder="0.00" />
}
```

## States

- 默认、有值、禁用。
- 尺寸：md（默认，30 高）、sm（26 高，字 12）；旧名 size="default" 等于 md。
- aria-invalid 时边框变危险色。
- 焦点：边框提亮（focus-ring）。
- caption / unit / align：框内左边的标签、右边的单位、值靠右（下单面板的数字框，#104）。外面一个有边有底的框，里面的 input 去掉自己的边与底；焦点、无效、禁用都画在外框上。caption 传字串就是这个输入框的 label，传节点（如填法下拉）原样画、读屏名自己给；wrapperClassName 调外框（如高度）。
- floatingLabel：标签静止时盖在框里，聚焦或有内容时缩小升到框上面一条 14px 的留白里（改自 SmoothUI float-input，MIT）。

## Don't

- 不要不带 label 就放出去。
- 不要在占位符里放必须读的信息。
- 用 floatingLabel 时 placeholder 不显示，提示写进标签或说明。

## Composition

```
Input
```

## Keyboard

- `Tab`：聚焦；聚焦时边框提亮
