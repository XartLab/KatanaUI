# MarketBrowser

找品种的入口（照 OKX 永续页的「市场」组件，2026-11-26 实测）：一个搜索框、一排分类页签（自选 / 全部 / 主流币……由调用方给，每类带自己的行）、下面是当前分类的列表：星标、徽标、代码与全称、最新价、24h 涨跌。点价格或涨跌的列头排序（升、降、回原顺序）；点行回调 onSelect；点星标回调 onToggleFavorite，不触发 onSelect。搜索在当前分类里按代码、名称与别名找。表的版式、价格尾数闪色、列头排序都沿用 Watchlist，不另写一份；数据与文字全由调用方传，包里没有数据源。

## Provide

`*` marks a required prop.

### MarketBrowser

categories 是 { id, label, rows }[]，「自选」页签就是调用方把 favorite 为真的行放进第一个分类；行是 QuoteRow 加 favorite / logoSrc / venue / assetClass / keywords。labels 必填。sort 与分类 value 可受控也可不受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `categories` * | `readonly MarketCategory[]` | — | The category tabs, each with its rows. |
| `labels` * | `MarketBrowserLabels` | — | Visible text and accessible names. |
| `formatPrice` | `FormatPrice` | — | Writes the last price; two decimals when omitted. |
| `value` | `string` | — | The selected category id when controlled. |
| `defaultValue` | `string` | — | The initially selected category id when uncontrolled; the first category when omitted. |
| `onValueChange` | `(id: string) => void` | — | Called with the category id when the tab changes. |
| `onQueryChange` | `(query: string) => void` | — | Called with the search word on every keystroke. |
| `sort` | `MarketSort \| null` | — | Sort (controlled); null is the caller's order. |
| `onSortChange` | `(sort: MarketSort \| null) => void` | — | Called with the next sort when the price or change header is clicked. |
| `onSelect` | `(row: MarketRow) => void` | — | Called with the row when it is clicked or Enter is pressed on it; rows become links when given. |
| `onToggleFavorite` | `(row: MarketRow, favorite: boolean) => void` | — | Called when a row's star is toggled, with the state it should become. |
| `className` | `string` | — | Extra class name on the root. |

### filterMarketRows(rows, query)

搜索用的纯函数：代码、名称、别名里含有搜索词（不分大小写）的行。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { MarketBrowser, type MarketRow } from '@katana-ui/react/quotes'

// 演示数据（固定，不是行情）。
const row = (symbol: string, name: string, last: number, changePct: number): MarketRow => ({
  id: symbol,
  symbol,
  name,
  last,
  change: Number((last - last / (1 + changePct / 100)).toFixed(4)),
  changePct,
})

const ROWS: readonly MarketRow[] = [
  { ...row('BTC-USDT', '比特币', 94820.5, 1.62), favorite: true },
  row('ETH-USDT', '以太坊', 3312.4, -0.84),
  { ...row('SOL-USDT', 'Solana', 214.18, 3.27), favorite: true },
  row('DOGE-USDT', '狗狗币', 0.3921, -2.15),
  row('XRP-USDT', '瑞波币', 2.4417, 0.42),
]
const inGroup = (ids: readonly string[]) => ROWS.filter((item) => ids.includes(item.id))

const price = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

export function MarketBrowserUsage() {
  const [stars, setStars] = useState(new Set(ROWS.filter((item) => item.favorite).map((item) => item.id)))
  const [picked, setPicked] = useState('')
  const mark = (rows: readonly MarketRow[]) => rows.map((item) => ({ ...item, favorite: stars.has(item.id) }))
  return (
    <div style={{ width: 420 }}>
      <MarketBrowser
        categories={[
          { id: 'favorites', label: '自选', rows: mark(ROWS).filter((item) => item.favorite) },
          { id: 'all', label: '全部', rows: mark(ROWS) },
          { id: 'major', label: '主流币', rows: mark(inGroup(['BTC-USDT', 'ETH-USDT', 'SOL-USDT'])) },
          { id: 'meme', label: 'Meme', rows: mark(inGroup(['DOGE-USDT'])) },
        ]}
        defaultValue="all"
        formatPrice={price.format}
        labels={{
          search: '搜索币对',
          categories: '市场分类',
          list: '市场',
          columns: { symbol: '币对', last: '最新价', change: '24h 涨跌' },
          empty: '还没有自选，点行首的星标添加。',
          noResults: '没有匹配的币对。',
          favorite: (item) => `自选 ${item.symbol}`,
        }}
        onToggleFavorite={(item, favorite) =>
          setStars((prev) => {
            const next = new Set(prev)
            if (favorite) next.add(item.id)
            else next.delete(item.id)
            return next
          })
        }
        onSelect={(item) => setPicked(item.symbol)}
      />
      <p data-gallery-picked={picked} style={{ margin: '8px 0 0', fontSize: 12 }}>
        {picked ? `已选：${picked}` : '点一行选品种'}
      </p>
    </div>
  )
}
```

## States

- 当前排序列的列头带 ▲ / ▼，th 的 aria-sort 跟着变；换分类、改搜索词，排序保留。
- 星标：没标是描边，标上是实心；常亮，不要等悬停。
- 分类里没有行：写 labels.empty；有行但搜索没找到：写 labels.noResults。
- 最新价与涨跌变了：只闪变了的尾数与涨跌格（同 Watchlist）。

## Don't

- 不要把「自选」做成包里的特殊页签：它就是第一个分类，行由调用方按 favorite 筛。
- 不要传写好的价格字符串：行是数，位数交给 formatPrice。
- 不要在包里放数据源或默认分类：分类名由市场决定（永续、现货、股票各不相同）。

## Composition

```
MarketBrowser
  Input（搜索）
  Tabs · TabsList line（分类，放不下横向滚）
  table（k-watch）：列头按钮 × 2
    tr：星标按钮 · SymbolMark · CodeChip · 全称 | FlashPrice | ChangeText
```

## Keyboard

- `Tab`：搜索框、分类页签、列头、各行、各行的星标，依次走
- `← →`：在分类页签间移动
- `Enter`：在行上选品种；在列头上排序；在星标上切星标
