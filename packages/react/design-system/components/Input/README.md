# Input

单行文本框：30 高（sm 26 高），4% 白底 8% 白边；聚焦边变亮，禁用降到 45%。可选 floatingLabel：标签从框里升到框上。

## Provide

`*` marks a required prop.

### Input

其余属性透传给原生 input；type 默认 text。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `"default" \| "sm"` | — | Height: default is 30px, sm is 26px with the data type size. |
| `floatingLabel` | `string` | — | Label that rests inside the box like a placeholder and floats into a 14px band above it on focus or when there is a value; the placeholder prop is ignored. |

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
- aria-invalid 时边框变危险色。
- 焦点：边框提亮（focus-ring）。
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
