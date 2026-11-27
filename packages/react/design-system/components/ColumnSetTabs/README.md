# ColumnSetTabs

表上方的一行页签（概览、估值、分红…），点一个就把 DataGrid 的列换成这一套。照 TradingView 选股器的列组标签（主会话 2026-11-15 实测）；与 ColumnPicker 里的列集芯片是同一份数据与同一个纯函数。不存状态：哪个亮着由看得见的列恰好等于它的列推出来，手动改过列之后没有页签亮着。

## Provide

`*` marks a required prop.

### ColumnSetTabs

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `layout / onLayoutChange` | `GridColumnLayout[]` | — | DataGrid 的列摆法，受控。 |
| `sets` | `ColumnSet[]` | — | { id, label, columns: 列 id[] }。 |
| `label` | `string` | — | 整行的读屏名。 |
| `children` | `ReactNode` | — | 右侧按钮位（刷新、全屏）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ColumnSetTabs, type ColumnSet, type GridColumnLayout } from '@katana-ui/react/blocks'

const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: '代码', width: 160, visible: true },
  { id: 'price', label: '价格', width: 100, visible: true },
  { id: 'pe', label: '市盈率', width: 90, visible: true },
  { id: 'mcap', label: '市值', width: 120, visible: true },
]

const SETS: readonly ColumnSet[] = [
  { id: 'overview', label: '概览', columns: ['symbol', 'price', 'pe', 'mcap'] },
  { id: 'valuation', label: '估值', columns: ['symbol', 'pe', 'mcap'] },
]

export function ColumnSetTabsUsage() {
  const [layout, setLayout] = useState<GridColumnLayout[]>([...LAYOUT])
  return <ColumnSetTabs layout={layout} onLayoutChange={setLayout} sets={SETS} label="列集" />
}
```

## States

- 选中：白底黑字小胶囊。
- 手动改过列：没有页签选中。

## Don't

- 不要自己存「当前列集」：它由列推出来。
- 不要拿它代替 ColumnPicker：页签只套整套列，单列的显隐与次序在 ColumnPicker 里改。
- 页签不要超过一行能放下的数量（约 8 个）；更多的套用放进 ColumnPicker 的列集芯片。

## Composition

```
ColumnSetTabs
  tablist
    tab × n
  右侧按钮位
```

## Keyboard

- `Tab`：在页签间移动
- `Enter`：套用这一套列
