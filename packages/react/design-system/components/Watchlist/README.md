# Watchlist

照 TradingView 右侧自选栏（2026-11-15 实测）：列 Symbol / Last / Chg / Chg%，行首小旗标与字母圆徽标；最新价变动时只有变了的尾数闪涨跌色、约 1 秒落回；点列头排序（升序、降序、回原顺序）。价格怎么写由 formatPrice 定，数与文字由调用方传。

## Provide

`*` marks a required prop.

### Watchlist

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `WatchlistRow[]` | — | 统一行情行 QuoteRow { id, symbol, name?, last, change, changePct }（都是数）加 { flagged?, logoSrc? }；旧的 key / code 照认一个版本。 |
| `labels` | `WatchlistLabels` | — | { columns: { symbol, last, chg, chgPct }, list, empty, flag(row) }。 |
| `formatPrice` | `(n: number) => string` | `toFixed(2)` | 最新价与涨跌额怎么写；闪色按它写出来的文字比尾数。 |
| `sort / onSortChange` | `WatchlistSort \| null` | — | 排序（受控）；不给就自己记。 |
| `onSelect / onFlag` | `callbacks` | — | 点行（旧名 onRow）；点旗标（行 + 新状态）。 |

### QuoteRow · plainPrice · rowTone

统一的行情行（2026-11-18）：Watchlist、QuoteTable、PeerCards、QuoteCard 都用 { id, symbol, name, last, change, changePct }，值是数，文字由 formatPrice 写；plainPrice 是不给 formatPrice 时的两位小数，rowTone(row) 由 change（再看 changePct）定涨跌。

### changedTail(prev, next)

新旧价格文字从哪一位开始不同：返回 { head, tail }。

### nextSort / sortRows

列头点击的循环与排序，纯函数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Watchlist, type WatchlistRow } from '@katana-ui/react/quotes'

const ROWS: readonly WatchlistRow[] = [
  { id: 'a', symbol: 'AAA', name: 'Alpha Devices', last: 212.4, change: 1.77, changePct: 0.84, flagged: true },
  { id: 'b', symbol: 'BRV', name: 'Bravo Semi', last: 1044.1, change: -24.7, changePct: -2.31 },
  { id: 'c', symbol: 'CHL', name: 'Charlie Software', last: 418.77, change: 4.64, changePct: 1.12 },
]

export function WatchlistUsage() {
  const [rows, setRows] = useState(ROWS)
  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <Watchlist
        rows={rows}
        labels={{
          columns: { symbol: 'Symbol', last: 'Last', chg: 'Chg', chgPct: 'Chg%' },
          list: 'Watchlist',
          empty: 'No symbols',
          flag: (row) => `Flag ${row.symbol}`,
        }}
        onFlag={(row, flagged) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, flagged } : r)))}
      />
    </div>
  )
}
```

## States

- 最新价变大：变了的尾数起闪涨色；变小闪跌色；约 1 秒落回原色。
- 当前排序列的列头带 ▲ / ▼，th 的 aria-sort 跟着变。
- 旗标：悬停才显示，标上的常亮；没有行画空态。

## Don't

- 不要给整个价格闪色：只有变了的尾数。
- 不要放真实公司标志。
- 不要传写好的价格字符串：行是数，位数交给 formatPrice。

## Composition

```
Watchlist table
  thead：列头按钮 × 4
  tbody tr：旗标 · SymbolMark · 代码 | 最新价（尾数闪色）| 涨跌额 | 涨跌幅
```

## Keyboard

- `Tab / Enter`：列头排序、旗标
