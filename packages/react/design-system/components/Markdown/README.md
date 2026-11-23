# Markdown

模型写的话与帮助文档的正文：不渲染 HTML、不画图片（只写「[图片：说明]」）、外链只认 http(s) 并在新标签页打开，挡掉把数据带出去的路。占位符 markdownSlot(n) 的位置画调用方给的节点（引用小标）。传 resolveLink 进文档模式：标题带锚点，相对链接交给调用方。从 KATANAview 搬来。

## Provide

`*` marks a required prop.

### Markdown

slots 按序号对应 markdownSlot(n)；超出的占位符当没有。resolveLink 与 labels 要稳定的引用，换了就重画。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` * | `string` | — | The Markdown source. |
| `slots` | `readonly ReactNode[]` | — | Nodes drawn where the text has `markdownSlot(i)` placeholders (by index), such as citation marks. |
| `resolveLink` | `(href: string) => string \| null` | — | Turns on document mode: headings get anchors and relative links go through this (see `renderDoc`). |
| `onOpenLink` | `(target: string) => void` | — | Called with the target `resolveLink` returned when the reader clicks such a link (the page does not navigate). |
| `labels` | `MarkdownLabels` | — | Text for the image placeholder; defaults to Chinese. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Markdown } from '@katana-ui/react'

export function MarkdownUsage() {
  return (
    <Markdown
      text={'**结论**：板块与资金面共振。\n\n- 批价回落\n- 融资净卖出\n\n用 `katana quote 600519` 看原始数据。'}
    />
  )
}
```

## States

- 回话：粗体、列表、表格、代码照常画；HTML 当字、图片写说明。
- 角标槽：占位符的位置画 slots 里的节点。
- 文档：标题带 data-anchor；认得的相对链接点了交给 onOpenLink，不跳页；不认得的只留文字。

## Don't

- 用户自己打的字不要走它：原样写、保留换行就好。
- 流式逐词进场的回答用 AiResponse；整段到齐了再用 Markdown。
- 不要为了画图片放开限制：要图就由调用方自己渲染一个可信的件放进 slots。

## Composition

```
Markdown
  div.k-md（innerHTML）
    span.k-md-slot × n（portal 进 slots[n]）
```
