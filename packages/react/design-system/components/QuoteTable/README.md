# QuoteTable

上面一排页签（指数、自选、热门……），下面是当前这组的行情表：名称与代码、迷你图、最新价、涨跌幅。由 Tabs 与 Sparkline 组出来；行就是 Watchlist 的行（统一行情行加 spark），值是数，价格文字由 formatPrice 写。

## Provide

`*` marks a required prop.

### CodeChip · CodeName · UnitValue · CompactValue

表格格内排版的共用件（#92，DataGrid、QuoteTable、Watchlist、LimitLadder、EventCalendar 同一份）：CodeChip 代码芯片（12px w600、面底、圆角 6、高 24）；CodeName 芯片后的全称；UnitValue 数后的单位小字（10px w500 次要色，空一格）；CompactValue 按 locale 缩写（en-US 是 K/M/B/T 两位小数；zh-CN ≥1 亿写 x.xx 亿，1 万–1 亿写千分位整数「8,800 万」，去掉 .00）。

### QuoteTable

页签值可受控（value / onValueChange）也可不受控（defaultValue，默认第一组）。文字在 labels（{ list, columns, empty }）；点行 onSelect。行有 symbol 与 name 时代码画成芯片、后跟全称（#92）；labels.columns.volume 给了才画成交量列，行的 volume 按 locale 缩写（K / M / B ↔ 万 / 亿），volumeUnit 写成单位小字。旧的 label / columns / empty / onRow 与字符串行（price / percent / tone）照认一个版本（@deprecated）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` * | `readonly QuoteGroup[]` | — | The groups, one tab each. |
| `labels` | `QuoteTableLabels` | — | Header, empty and accessible texts. |
| `columns` | `QuoteTableLabels['columns']` | — | Deprecated: use labels.columns. |
| `empty` | `string` | — | Deprecated: use labels.empty. |
| `label` | `string` | — | Deprecated: use labels.list. |
| `formatPrice` | `FormatPrice` | `plainPrice` | Writes the last price; two decimals when omitted. |
| `locale` | `string` | — | Locale of the volume abbreviations (en-US K/M/B/T, zh-CN 万/亿); defaults to en-US. |
| `volumeUnit` | `string` | — | Unit written small after the volume (shares, USD). |
| `value` | `string` | — | The selected group id when controlled. |
| `defaultValue` | `string` | — | The initially selected group id when uncontrolled. |
| `onValueChange` | `(id: string) => void` | — | Called with the group id when the tab changes. |
| `onSelect` | `(row: QuoteTableRow \| LegacyQuoteRow) => void` | — | When given, rows are clickable and focusable and trigger on Enter. |
| `onRow` | `(row: QuoteTableRow \| LegacyQuoteRow) => void` | — | Deprecated: use onSelect. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { QuoteTable } from '@katana-ui/react/quotes'

export function QuoteTableUsage() {
  return (
    <QuoteTable
      labels={{
        list: 'Watchlists',
        columns: { name: 'Name', trend: 'Trend', price: 'Last', change: 'Chg %', volume: 'Volume' },
        empty: 'No symbols in this group',
      }}
      volumeUnit="USD"
      groups={[
        {
          id: 'main',
          label: 'Main',
          rows: [
            { id: 'a', symbol: 'AAA', name: 'Alpha', last: 11.8, change: 1.8, changePct: 18, volume: 42_800_000 },
            { id: 'b', symbol: 'BRV', name: 'Bravo Semi', last: 10.2, change: -1.8, changePct: -15, volume: 835_490 },
          ],
        },
      ]}
    />
  )
}
```

## States

- 默认：第一组页签选中，下面是该组行情表。
- 最新价变了：只闪变了的尾数（与 Watchlist 同一个 FlashPrice）；涨跌幅变了整格闪涨跌色。
- 行可点：悬停提亮，键盘 Tab 到行、Enter 触发。
- 空组：写调用方给的说明，不画表头。
- 没有迷你图数据的行：走势列留空。

## Don't

- 不要在包里写死列名与空态文案，由调用方传。
- 不要把几十个品种塞进一组不分页：这是总览，不是完整自选表。

## Composition

```
QuoteTable
  Tabs
    TabsList > TabsTrigger（一组一个）
    TabsContent
      table（表头 · 行：代码芯片 + 名称 · Sparkline · 价 · 涨跌幅 · 成交量（可选））
```

## Keyboard

- `← →`：在页签间移动（Radix Tabs）
- `Tab / Enter`：到可点的行、触发
