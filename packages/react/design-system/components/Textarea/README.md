# Textarea

多行文本框：与 Input 同一套皮肤（4% 白底 7% 白边，聚焦边提亮），默认三行高，竖向可拖。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### Textarea

其余属性透传给原生 textarea。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `'default' \| 'sm'` | — | Font size: sm uses the data type size. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Textarea } from '@katana-ui/react'

export function TextareaUsage() {
  return <Textarea aria-label="Order note" placeholder="Why this entry" rows={3} />
}
```

## States

- 默认、有值、禁用。
- aria-invalid 时边框变危险色。
- 焦点：边框提亮，焦点环画在里面。

## Don't

- 单行文字用 Input。
- 不要不带 label 就放出去。

## Composition

```
Textarea
```

## Keyboard

- `Tab`：聚焦；聚焦时边框提亮
