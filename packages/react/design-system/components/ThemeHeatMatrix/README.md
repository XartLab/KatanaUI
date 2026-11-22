# ThemeHeatMatrix

开盘啦「题材库 / 板块强度」对照（#11）：行是题材、列是近 5 到 10 个交易日（最新一列的日期主文字色），格内大字写涨停只数、右上角 9px 写当日名次；底色是五档（分档与 CalendarHeatmap 换手视图同一条规则：档位 = ⌊只数 / 全表最大 × 5⌋，封顶 4），颜色是主文字色 10% / 20% / 34% / 52% / 74% 混透明的中性浓度，不用品牌橙（#50：橙只给焦点角括号；tokens 里的 seq-* 是橙系，没有不含橙的顺序档），0 只与没有数据不着色。表格手感照 TradingView 列表：28px 格高、2px 格距、tabular-nums。题材次序、只数、名次都由调用方给，件不排序、不算热度。

## Provide

`*` marks a required prop.

### ThemeHeatMatrix

一行是 ThemeHeatRow { id, name, cells }，cells 跟 dates 一一对应，没有数据给 null。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dates` * | `readonly string[]` | — | Column headers, oldest first, already formatted (「11-12」). |
| `rows` * | `readonly ThemeHeatRow[]` | — | Theme rows in the caller's order. |
| `labels` * | `ThemeHeatMatrixLabels` | — | Texts. |
| `selected` | `ThemeHeatPos \| null` | `null` | Selected cell (controlled); null for none. |
| `onSelect` | `(row: ThemeHeatRow, col: number) => void` | — | Pick a cell with click, Enter or Space: gets the row and the day index (link the board list to it). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ThemeHeatMatrix, type ThemeHeatPos, type ThemeHeatRow } from '@katana-ui/react/quant'

// 演示数据：题材名与每格的涨停只数、名次都是编出来的（闭式公式），不是真实行情。
export const HEAT_DATES: readonly string[] = ['11-11', '11-12', '11-13', '11-14', '11-17', '11-18']

const THEMES = ['示例机器人', '示例算力', '示例低空', '示例固态电池', '示例医药', '示例军工']
const counts = THEMES.map((_, r) =>
  HEAT_DATES.map((_, c) => Math.max(0, Math.round((11 - r * 2) * (0.55 + 0.45 * Math.sin(r * 1.3 + c * 0.9))))),
)

export const HEAT_ROWS: readonly ThemeHeatRow[] = THEMES.map((name, r) => ({
  id: `t${r}`,
  name,
  cells: HEAT_DATES.map((_, c) => {
    const count = counts[r]![c]!
    // 当天名次：这一列里只数比它多的题材数 + 1。
    const rank = counts.filter((row) => row[c]! > count).length + 1
    return r === 5 && c === 0 ? null : { count, rank }
  }),
}))

export function ThemeHeatMatrixUsage() {
  const [selected, setSelected] = useState<ThemeHeatPos | null>({ row: 0, col: 5 })
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <ThemeHeatMatrix
        dates={HEAT_DATES}
        rows={HEAT_ROWS}
        selected={selected}
        onSelect={(row, col) => setSelected({ row: HEAT_ROWS.indexOf(row), col })}
        labels={{
          grid: '题材热度矩阵（演示数据）',
          theme: '题材',
          rank: (n) => `#${n}`,
          cell: (row, date, count, rank) =>
            count === null ? `${row.name} ${date}：没有数据` : `${row.name} ${date}：涨停 ${count} 只，第 ${rank}`,
          legend: { low: '少', high: '多' },
          empty: '没有题材数据',
        }}
      />
    </div>
  )
}
```

## States

- 字色按档换：0–2 档主文字色，3–4 档（浅灰底）换深色字（selectable-bold-foreground-selected），Graphite 与 Console 都过 4.5:1。
- 悬停：格子内描 1px 分隔粗线；选中：内描 1px 主文字色；键盘焦点：外描 1px，偏移 1px。
- 没有数据的格不写字，读屏读调用方写的「没有数据」句子。
- 空：rows 或 dates 为空时画空态文字。

## Don't

- 不要用涨跌色或品牌橙给只数上底色：大小用中性浓度，涨跌色只给方向，橙只给焦点。
- 不要把名次当只数排序依据塞进件里，次序由调用方定。

## Composition

```
ThemeHeatMatrix
  grid
    列头行：题材 | 日期 × N
    行：题材名（rowheader）| 格 × N（只数 + 名次）
  图例：少 | 五档 | 多
```

## Keyboard

- `← → ↑ ↓`：在格子间移动
- `Home / End`：到这一行的第一天 / 最新一天
- `Enter / Space`：选中当前格（onSelect）
