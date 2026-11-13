# WebSearch

联网检索的来源：一枚药丸（带进度环的地球、状态文字、叠起来的来源小标）点开是一排来源卡片；WebSearchCitation 是回答正文里的行内引用，悬停或键盘聚焦弹出预览。不存也不开 URL，来源小标是站名首字母。学自 rare-ui。

## Provide

### WebSearch

检索中的进度环每来一条结果补上剩下的 30%，不会自己走满；第四条起最后一格是「还有 N 条」。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sources` | `WebSource[]` | — | { id, site, title, snippet? }（必填）。 |
| `status` | `'searching' \| 'done'` | `'done'` | 检索中带流光与进度环、没到的位置画空骨架。 |
| `label` | `string` | — | 药丸里的状态文字（必填）；换了字符串就上下滑着换。 |
| `moreLabel / lessLabel` | `(n) => string / string` | — | 「还有 N 条」与「收起」卡片的文字（必填）。 |
| `open / defaultOpen / onOpenChange` | `boolean` | `true` | 来源区展开与否。 |
| `onOpen` | `(source) => void` | — | 给了，来源卡片才可点。 |

### WebSearchCitation

悬停停 300ms 才开、离开 150ms 才收；键盘聚焦立即开。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `source` | `WebSource` | — | 这条引用指向的来源。 |
| `index` | `number` | — | 行内序号（1 起），不给不写。 |

### useHoverIntent

钩子 (openDelay = 300, closeDelay = 150)：返回 { active, set(next, delay), hover }，hover 展开到触发处与弹层上。触屏不处理。

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
