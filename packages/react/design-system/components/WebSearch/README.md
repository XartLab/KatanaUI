# WebSearch

联网检索的来源：一枚药丸（带进度环的地球、状态文字、叠起来的来源小标）点开是一排来源卡片；WebSearchCitation 是回答正文里的行内引用，悬停或键盘聚焦弹出预览。不存也不开 URL，来源小标是站名首字母。学自 rare-ui。

## Provide

`*` marks a required prop.

### WebSearch

检索中的进度环每来一条结果补上剩下的 30%，不会自己走满；第四条起最后一格是「还有 N 条」。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sources` * | `readonly WebSource[]` | — | The sources, each with id, site, title and an optional snippet (required). |
| `status` | `WebSearchStatus` | `'done'` | Searching shows a shimmer and a progress ring, with empty skeletons where results have not arrived. |
| `label` * | `string` | — | Status text inside the pill (required), for example "Searching" or "Searched 3 sites"; the text slides when the string changes. |
| `progress` | `number` | — | Progress ring from 0 to 1; computed from the number of sources when omitted. |
| `moreLabel` * | `(count: number) => string` | — | Text of the "N more" card (required). |
| `lessLabel` * | `string` | — | Text of the "collapse" card (required). |
| `open` | `boolean` | — | Whether the source area is expanded. |
| `defaultOpen` | `boolean` | `true` | Initial expanded state when uncontrolled. |
| `onOpenChange` | `(open: boolean) => void` | — | Called when the source area expands or collapses. |
| `onOpen` | `(source: WebSource) => void` | — | When given, source cards become clickable and call it. |
| `className` | `string` | — | Extra class name on the root. |

### WebSearchCitation

悬停停 300ms 才开、离开 150ms 才收；键盘聚焦立即开。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `source` * | `WebSource` | — | The source this citation points to. |
| `index` | `number` | — | Inline number (1-based); nothing is written when omitted. |
| `className` | `string` | — | Extra class name on the root. |

### useHoverIntent

钩子 (openDelay = 300, closeDelay = 150)：返回 { active, set(next, delay), hover }，hover 展开到触发处与弹层上。触屏不处理。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { WebSearch, type WebSource } from '@katana-ui/react'

const SOURCES: readonly WebSource[] = [
  { id: 'a', site: 'Reuters', title: 'Central bank cuts reserve ratio', snippet: 'About 1 trillion yuan released.' },
  { id: 'b', site: 'Bloomberg', title: 'Tech leads the rally' },
]

export function WebSearchUsage() {
  return (
    <WebSearch
      sources={SOURCES}
      status="done"
      label="Searched 2 sites"
      moreLabel={(count) => `${count} more`}
      lessLabel="Collapse"
    />
  )
}
```

## States

- 药丸：进度环、状态文字、叠起来的来源小标。
- 点开是一排来源卡片；「还有 N 条」展开全部。
- 行内引用：悬停或键盘聚焦弹出预览。

## Don't

- 不存也不开 URL：要打开来源由调用方在 onOpen 里处理。

## Composition

```
WebSearch
  button（药丸：地球 + 文字 + 小标 + 箭头）
  ol（来源卡片 / 骨架 / 更多 / 收起）
WebSearchCitation
  button（行内小标）
  span role=tooltip（预览）
```

## Keyboard

- `Enter / Space`：展开或收起来源区；在「还有 N 条」上展开全部
- `Tab`：药丸、卡片（给了 onOpen 时）、行内引用；聚焦行内引用立即弹出预览
