# AiResponse

流式的助手文字：词到了才进场（淡入、去模糊、上移 2px），不是定时器逐字打；正文里的 [n] 换成行内引用小标，直接用 WebSearchCitation。切词用 Intl.Segmenter，中文也一词一词进。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiResponse

text 随流增长重新传入；citations 里没有的 [n] 保持普通文字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` * | `string` | — | The response so far; re-render it as it grows. |
| `citations` | `readonly AiResponseCitation[]` | — | Sources referenced by `[n]` markers in the text; unknown markers stay plain text. |
| `isStreaming` | `boolean` | `false` | Shows a caret after the last word. |
| `locale` | `string` | — | BCP 47 locale for word segmentation, such as "zh-CN"; defaults to the page language. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiResponse } from '@katana-ui/react'

export function AiResponseUsage() {
  return (
    <AiResponse
      text="批价继续回落 [1]，融资净卖出 [2]。"
      citations={[
        { index: 1, source: { id: 'a', site: '财新', title: '批发价连续下行' } },
        { index: 2, source: { id: 'b', site: '上交所', title: '融资净卖出居前' } },
      ]}
      locale="zh-CN"
    />
  )
}
```

## States

- 流式中：末尾有明灭的光标。
- 新来的词进场，已画出的词不再动。
- 引用：悬停停一会儿或聚焦弹出站名、标题、摘要。

## Don't

- 不要自己用定时器切 text 来模拟打字：节奏要跟真实的流走。
- locale 不传时按页面语言切词，混排时建议显式传。

## Composition

```
AiResponse
  p
    span（词）
    WebSearchCitation（引用小标）
    span（光标）
```

## Keyboard

- `Tab`：聚焦行内引用，立即弹出预览
