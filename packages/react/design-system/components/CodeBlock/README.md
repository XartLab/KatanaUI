# CodeBlock

带文件名头、行号、一键复制的代码块；配色由一个强调色混出来（关键字取强调色，字符串、数字、函数是它与正文色的不同比例，注释灰），两个主题自动跟着换。词法切分是自己写的，不加依赖。学自 rare-ui。

## Provide

`*` marks a required prop.

### CodeBlock

认得 ts / tsx / js / json / py / sh / css；别的语言当纯文本。开头的空行与结尾的空白会去掉。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `code` * | `string` | — | The source code (required). |
| `language` | `string` | `'plain'` | Language: ts, tsx, js, json, py, sh, css and so on; unknown ones are plain text. |
| `accent` | `string` | `'var(--signal-orange)'` | Accent color, any CSS color; the whole palette is mixed from it. |
| `filename` | `string` | — | Name written in the header; the language is written when omitted. |
| `showHeader` | `boolean` | `true` | Whether to draw the header; without it the copy button floats at the top right. |
| `showLineNumbers` | `boolean` | `true` | Whether to draw line numbers. |
| `showCopyButton` | `boolean` | `true` | Whether to draw the copy button. |
| `highlightLines` | `readonly number[]` | — | Lines to highlight (1-based). |
| `copyLabel` * | `string` | — | Accessible name of the copy button (required). |
| `copiedLabel` * | `string` | — | Accessible name of the copy button after a successful copy (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CodeBlock } from '@katana-ui/react'

export function CodeBlockUsage() {
  return (
    <CodeBlock
      code={`export const answer = 42`}
      language="ts"
      filename="answer.ts"
      copyLabel="Copy code"
      copiedLabel="Copied"
    />
  )
}
```

## States

- 带文件名头、行号、复制钮；复制后钮上写 copiedLabel。
- 可高亮指定的行。

## Don't

- 复制钮的文案由调用方传（copyLabel、copiedLabel）。

## Composition

```
CodeBlock
  div（头：名字 + 复制钮）
  div role=region（滚动区，可聚焦）
    pre > 每行一个 div（行号 + token）
```

## Keyboard

- `Tab`：复制钮、再到滚动区
- `方向键`：滚动区聚焦时滚动
- `Enter / Space`：复制
