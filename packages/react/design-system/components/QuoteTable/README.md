# QuoteTable

上面一排页签（指数、自选、热门……），下面是当前这组的行情表：名称与代码、迷你图、最新价、涨跌幅。由 Tabs 与 Sparkline 组出来。

## Provide

`*` marks a required prop.

### QuoteTable

页签值可受控（value / onValueChange）也可不受控（defaultValue，默认第一组）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` * | `readonly QuoteGroup[]` | — | The groups, one tab each; a QuoteRow is { id, name, symbol?, price, percent?, tone?, spark?, sparkLabel? |
| `columns` * | `{ name: string; trend: string; price: string; change: string }` | — | Text of the four header columns (name, trend, price, change). |
| `empty` * | `string` | — | Text written when a group has no rows. |
| `label` * | `string` | — | Accessible name of the tab strip. |
| `value` | `string` | — | The selected group id when controlled. |
| `defaultValue` | `string` | — | The initially selected group id when uncontrolled. |
| `onValueChange` | `(id: string) => void` | — | Called with the group id when the tab changes. |
| `onRow` | `(row: QuoteRow) => void` | — | When given, rows are clickable and focusable and trigger on Enter. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { QuoteTable } from '@katana-ui/react'

export function QuoteTableUsage() {
  return (
    <QuoteTable
      label="Watchlists"
      columns={{ name: 'Name', trend: 'Trend', price: 'Last', change: 'Chg %' }}
      empty="No symbols in this group"
      groups={[
        {
          id: 'main',
          label: 'Main',
          rows: [{ id: 'a', name: 'Alpha', symbol: 'AAA', price: '11.80', percent: '+18.00%', tone: 'up' }],
        },
      ]}
    />
  )
}
```

## States

- 默认：第一组页签选中，下面是该组行情表。
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
      table（表头 · 行：名称 · Sparkline · 价 · 涨跌幅）
```

## Keyboard

- `← →`：在页签间移动（Radix Tabs）
- `Tab / Enter`：到可点的行、触发
