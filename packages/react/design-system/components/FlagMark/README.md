# FlagMark

自选表行最左端的彩色小旗（照 TradingView 自选表，主会话 2026-11-18 实看）：点一下插上最近用过的那面、再点拔掉；右键菜单里选色；表上方一排旗标按钮按旗过滤。颜色只用状态色（danger / warn / ok / neutral），几面旗、各叫什么由调用方给；不用品牌橙。

## Provide

`*` marks a required prop.

### FlagMark

插着是实心状态色旗，没插是空心灰旗、平时藏着（行悬停或键盘落在这一行才出）。没给 onToggle 是只读标记。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `flag` | `FlagDef` | — | The flag on this row; omit for none (a hollow gray flag shows only on row hover or focus). |
| `onToggle` | `() => void` | — | Click handler, usually toggle(id) from useFlags; without it the mark is read-only. |
| `label` * | `string` | — | Accessible name written by the caller (e.g. |
| `focusable` | `boolean` | `true` | Set false inside single-tab-stop containers such as DataGrid; keyboard users flag through the row menu. |
| `alwaysShown` | `boolean` | — | Keep the hollow flag visible when unflagged (outside a hover row); by default it shows only on row hover or focus. |
| `className` | `string` | — | Extra class name. |

### FlagFilter

只出插了至少一行的旗与正在过滤的那面；按下的那面是当前过滤，再点取消。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `flags` * | `Flags` | — | The store returned by useFlags. |
| `label` * | `string` | — | Accessible name of the group (e.g. |
| `itemLabel` | `(flag: FlagDef, count: number) => string` | — | Name of one flag button; defaults to the flag label and its count. |
| `showEmpty` | `boolean` | — | Also show flags that no row carries; by default only used flags and the active filter show. |
| `className` | `string` | — | Extra class name. |

### useFlags({ flags, value?, defaultValue?, onValueChange?, filter?, defaultFilter?, onFilterChange? })

受控或不受控：value 是「行 id → 旗 id」。返回 flagOf、setFlag、toggle（插最近用过的那面，头一次是第一面）、clearAll、counts、filter / setFilter、filterRows(rows, rowId)、menu(id, unflagLabel)（接 DataGrid 的 rowActions 或 menu）。

### setFlagIn / countFlags

插旗、数旗的纯函数，存盘与服务端同步用。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FlagFilter, FlagMark, useFlags, type FlagDef } from '@katana-ui/react'

const FLAGS: readonly FlagDef[] = [
  { id: 'watch', label: 'Watch', color: 'danger' },
  { id: 'setup', label: 'Setup', color: 'warn' },
  { id: 'held', label: 'Held', color: 'ok' },
]
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']

export function FlagMarkUsage() {
  const flags = useFlags({ flags: FLAGS, defaultValue: { BTCUSDT: 'watch', ETHUSDT: 'held' } })
  return (
    <div style={{ display: 'grid', gap: 6, width: 200 }}>
      <FlagFilter flags={flags} label="Filter by flag" />
      {flags
        .filterRows(SYMBOLS, (symbol) => symbol)
        .map((symbol) => (
          <div key={symbol} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FlagMark
              flag={flags.flagOf(symbol)}
              onToggle={() => flags.toggle(symbol)}
              label={`Flag ${symbol}`}
              alwaysShown
            />
            {symbol}
          </div>
        ))}
    </div>
  )
}
```

## States

- 插着：实心旗，颜色是这面旗的状态色。
- 没插：空心三级灰，平时透明；行悬停或键盘落在这一行时出现。
- 过滤中：过滤按钮浅底加描边，表里只剩插了这面旗的行。

## Don't

- 不要自己造旗的颜色：只在 danger / warn / ok / neutral 里挑，名字由调用方起。
- 不要用品牌橙当旗色：橙只给焦点角括号。
- 不要只靠颜色区分旗：菜单与过滤按钮都带旗名，读屏念名字。

## Composition

```
FlagMark（button | span）
  FlagGlyph（svg 燕尾旗）
FlagFilter（group）
  按钮 × n（旗 + 个数）
```

## Keyboard

- `Enter / Space`：在旗上：插上 / 拔掉（DataGrid 里旗不进 Tab 顺序，键盘走行菜单）
- `Tab`：在过滤按钮间移动；Enter 切换过滤
