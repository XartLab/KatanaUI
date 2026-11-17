# Pagination

分页器：当前页的底块在页码之间用弹簧滑过去，页码错开 30ms 进场，页数多时首尾常驻、当前页两侧留 siblings 页、其余折成省略号。

## Provide

`*` marks a required prop.

### Pagination

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` * | `number` | — | Current page, counting from 1. |
| `totalPages` * | `number` | — | How many pages there are. |
| `onPageChange` * | `(page: number) => void` | — | Called with the page the user picked. |
| `siblings` | `number` | `1` | How many neighbours to keep on each side of the current page. |
| `labels` * | `PaginationLabels` | — | All visible and spoken text (required). |
| `className` | `string` | — | Extra classes for the root element. |

### buildPageRange

页码列表的算法，导出给单测与自定义渲染。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Pagination } from '@katana-ui/react'

export function PaginationUsage() {
  const [page, setPage] = useState(5)
  return (
    <Pagination
      page={page}
      totalPages={20}
      onPageChange={setPage}
      labels={{ nav: 'Pagination', previous: 'Previous', next: 'Next', page: (n) => `Go to page ${n}` }}
    />
  )
}
```

## States

- 当前页：带底块，aria-current="page"。
- 第一页时上一页禁用，最后一页时下一页禁用。
- 总页数不超过 siblings*2+5：全部列出，没有省略号。

## Don't

- 不要用它翻无限流（行情、新闻流）：那是加载更多。
- 不要把 siblings 设成 0：当前页与首尾页会连成一团。

## Composition

```
Pagination
  nav
    ul
      li > Button（上一页）
      li > Button（页码，当前页内含滑动底块）
      li（省略号）
      li > Button（下一页）
```

## Keyboard

- `Tab`：在按钮间走
- `Enter / Space`：翻到该页
