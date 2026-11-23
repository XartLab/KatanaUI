# SymbolSearch

品种搜索：输入框、市场分段、结果列表；空查询先列最近搜索。焦点在图表这类容器里直接打字（useTypeToSearch）就弹出 SymbolSearchDialog，框里带着打的字。每行 SymbolMark 徽标 + 代码 + 名称与类型标签 + 右侧交易所，命中段加粗提亮。↑↓ 走行、回车选中、Esc 关。数据与搜索都由调用方传（onQuery 可异步，换词时上一次 abort），组件不带行情。功能参照 TradingView 图表的品种搜索（2026-11-18 实测），实现原创。

## Provide

`*` marks a required prop.

### SymbolSearch

面板本体，可以直接摆进页里。底座是 Command（cmdk），过滤关掉，行的先后照 onQuery 返回的。最近搜索：传 recent + onRecentChange 受控；不传时有 recentKey 就经 usePersistedState 存进 localStorage（版本 1，形状不对当没存过），没有就只在内存里。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onQuery` * | `SymbolSearchQuery` | — | Search: return matching items for the query and segment; may be async. |
| `onSelect` * | `(item: SymbolSearchItem) => void` | — | Called when a row is chosen (Enter or click). |
| `segments` | `readonly SymbolSearchSegment[]` | — | Market segments, in order; the first is the default. |
| `segment` | `string` | — | Controlled segment id. |
| `defaultSegment` | `string` | — | Initial segment id when uncontrolled. |
| `onSegmentChange` | `(segment: string) => void` | — | Called when the segment changes. |
| `defaultQuery` | `string` | `''` | Initial text in the input (the character typed to open the search). |
| `recent` | `readonly SymbolSearchItem[]` | — | Controlled recent searches, newest first. |
| `onRecentChange` | `(recent: SymbolSearchItem[]) => void` | — | Called with the new recent list after a selection. |
| `recentKey` | `string` | — | Storage key to persist recent searches (uncontrolled); without it they live in memory only. |
| `recentStorage` | `StorageLike` | — | Storage for recentKey; defaults to localStorage. |
| `recentLimit` | `number` | `8` | Most recent searches kept. |
| `allSegment` | `string` | `'all'` | Segment id that means "every market" for filtering recent searches. |
| `debounceMs` | `number` | `80` | Delay before onQuery runs after typing, in ms. |
| `labels` * | `SymbolSearchLabels` | — | Text. |
| `className` | `string` | — | Extra class name on the root. |

### SymbolSearchDialog

Dialog 的 bare 皮：顶部 12dvh、宽 min(640px, 100vw−24px)、圆角 14。选中后默认关上（keepOpen 留着）；每次打开重新挂载面板，defaultQuery 就是这次打的字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onQuery` * | `SymbolSearchQuery` | — | Search: return matching items for the query and segment; may be async. |
| `onSelect` * | `(item: SymbolSearchItem) => void` | — | Called when a row is chosen (Enter or click). |
| `segments` | `readonly SymbolSearchSegment[]` | — | Market segments, in order; the first is the default. |
| `segment` | `string` | — | Controlled segment id. |
| `defaultSegment` | `string` | — | Initial segment id when uncontrolled. |
| `onSegmentChange` | `(segment: string) => void` | — | Called when the segment changes. |
| `defaultQuery` | `string` | — | Initial text in the input (the character typed to open the search). |
| `recent` | `readonly SymbolSearchItem[]` | — | Controlled recent searches, newest first. |
| `onRecentChange` | `(recent: SymbolSearchItem[]) => void` | — | Called with the new recent list after a selection. |
| `recentKey` | `string` | — | Storage key to persist recent searches (uncontrolled); without it they live in memory only. |
| `recentStorage` | `StorageLike` | — | Storage for recentKey; defaults to localStorage. |
| `recentLimit` | `number` | — | Most recent searches kept. |
| `allSegment` | `string` | — | Segment id that means "every market" for filtering recent searches. |
| `debounceMs` | `number` | — | Delay before onQuery runs after typing, in ms. |
| `labels` * | `SymbolSearchLabels` | — | Text. |
| `className` | `string` | — | Extra class name on the root. |
| `open` * | `boolean` | — | Whether the dialog is open. |
| `onOpenChange` * | `(open: boolean) => void` | — | Called to open or close (Esc, click outside, after a selection). |
| `keepOpen` | `boolean` | `false` | Keep the dialog open after a selection. |

### useTypeToSearch(ref, { onOpen, enabled?, accept? })

在 ref 指的容器上听 keydown：打出一个字（不是空格，没按 Ctrl / ⌘ / Alt，不在输入框里，不在输入法组字中，不是自动重复，没被别人 preventDefault）就 preventDefault 并调 onOpen(字)。容器要能拿焦点（tabIndex={0}）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onOpen` * | `(initial: string) => void` | — | Called with the typed character; open the search and put the character in its input. |
| `enabled` | `boolean` | — | Turn the listener off (for example while the search is already open). |
| `accept` | `(key: string, event: KeyboardEvent) => boolean` | — | Extra filter after the built-in checks: return false to leave a key alone (digits that open an interval box, say). |

### typeToSearchKey(event)

上面那条判断的纯函数：该打开就返回那个字，否则 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolSearch, type SymbolSearchItem } from '@katana-ui/react/blocks'

// 演示数据，不是行情。
const SYMBOLS: readonly SymbolSearchItem[] = [
  {
    id: 'BINANCE:BTCUSDT',
    symbol: 'BTCUSDT',
    name: 'Bitcoin / TetherUS',
    exchange: 'Binance',
    market: 'crypto',
    type: '现货',
  },
  { id: 'NASDAQ:AAPL', symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', market: 'stock', type: '股票' },
  {
    id: 'NASDAQ:AMD',
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    exchange: 'NASDAQ',
    market: 'stock',
    type: '股票',
  },
  { id: 'SSE:600519', symbol: '600519', name: '贵州茅台', exchange: 'SSE', market: 'stock', type: '股票' },
  { id: 'NASDAQ:QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', market: 'fund', type: 'ETF' },
]

export function SymbolSearchUsage() {
  const [recent, setRecent] = useState<SymbolSearchItem[]>([SYMBOLS[3]!])
  return (
    <div
      style={{
        width: 560,
        height: 300,
        overflow: 'hidden',
        borderRadius: 14,
        border: '1px solid var(--k-overlay-dialog-borderColor)',
      }}
    >
      <SymbolSearch
        defaultQuery="a"
        debounceMs={0}
        segments={[
          { id: 'all', label: '全部' },
          { id: 'stock', label: '股票' },
          { id: 'fund', label: '基金' },
          { id: 'crypto', label: '加密' },
        ]}
        recent={recent}
        onRecentChange={setRecent}
        onQuery={(query, segment) =>
          SYMBOLS.filter(
            (item) =>
              (segment === 'all' || item.market === segment) &&
              `${item.symbol} ${item.name}`.toLowerCase().includes(query.trim().toLowerCase()),
          )
        }
        onSelect={() => {}}
        labels={{
          title: '品种搜索',
          placeholder: '代码或名称',
          segments: '市场',
          recent: '最近搜索',
          empty: '没有匹配的品种',
          loading: '搜索中…',
          clear: '清空',
        }}
      />
    </div>
  )
}
```

## States

- 空查询：先「最近搜索」（按当前分段过滤，最多 recentLimit 条，默认 8），再接 onQuery("") 返回的（调用方可以给热门）；两组都有时才写组名。
- 有查询：只列结果；代码与名称里命中查询的第一段加粗、用主文字色，其余是正文 / 次要色；输入框里显示成大写，传给 onQuery 的是原样。
- 加载中：这次的词还没回来时列表 aria-busy；没有旧行可显示时写 labels.loading；有旧行就先留着旧行，不闪空。
- 没有结果：labels.empty；onQuery 抛错或 reject：labels.error（role=alert）。
- 高亮行：选中底色 --k-selectable-subtle-background-hover，默认第一行，回车就开它。

## Don't

- 不要在包里写搜索逻辑或行情：onQuery 由调用方给，排序也是。
- 不要用颜色单独标命中段：已经用字重区分了，别再加 TradingView 蓝或品牌橙。
- 不要在输入框、文本域里挂 useTypeToSearch：它本来就跳过可编辑元素，挂了也不响应。
- 不要拿它做命令面板：命令搜索用 CommandDialog。

## Composition

```
SymbolSearchDialog（Dialog bare）
  SymbolSearch（Command）
    CommandInput（combobox，清空钮）
    ToggleGroup（市场分段）
    CommandList（listbox）
      CommandGroup「最近搜索」
        行：SymbolMark · 代码 · 名称 + Tag · 交易所
      CommandGroup「结果」
    role=status（结果个数）
```

## Keyboard

- `任意字母 / 数字（焦点在容器里）`：打开搜索，框里带上这个字
- `↑ ↓`：在结果间移动高亮（首尾循环）
- `Enter`：选中高亮行：记进最近搜索、回调 onSelect、关上对话框
- `Esc`：关上对话框，焦点回到打开前的地方
- `Tab`：从输入框到清空钮、市场分段
