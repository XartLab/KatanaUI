# AiSuggestions

提示词建议的药丸：对话的空态与回答后的追问一行。从中间向两边错开进场，因为这些是同等分量的备选，不是从左到右的优先级。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiSuggestions

药丸是我们的 Button；换一组 suggestions 时旧的淡出、新的进场。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `suggestions` * | `readonly AiSuggestion[]` | — | The chips. |
| `onSelect` | `(suggestion: AiSuggestion) => void` | — | Called with the chosen suggestion. |
| `label` | `string` | — | Optional heading, such as "Follow-ups". |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiSuggestions } from '@katana-ui/react'

export function AiSuggestionsUsage() {
  return (
    <AiSuggestions
      label="可以接着问"
      suggestions={[
        { id: 'a', label: '同板块还有哪些在跌' },
        { id: 'b', label: '把止损收紧会怎样' },
      ]}
      onSelect={() => undefined}
    />
  )
}
```

## States

- 进场：中间先出，两边依次跟上。
- 换组：旧的缩淡出，新的进场。

## Don't

- 不要超过一行半，太多就失去「建议」的意思。
- 选中后由调用方决定是否清掉这一排。

## Composition

```
AiSuggestions
  p（标题）
  ul > li > Button
```

## Keyboard

- `Tab`：依次聚焦
- `Enter / Space`：选中
