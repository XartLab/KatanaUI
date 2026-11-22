# BoardStrengthRank

开盘啦「板块强度」对照（#11）：DataGrid 一行一个板块，按调用方给的强度从高到低（同分保持传入次序）：名次（粗体）与名次变化（▲n 升、▼n 降、新上榜，跟上一期名次比）、板块名、强度数值、行内强度线（Sparkline line 画法、96 × 20、不交互）、涨停只数、涨跌幅。强度口径不在件里。

## Provide

`*` marks a required prop.

### BoardStrengthRank

板块 BoardStrength { id, name, strength, series?, prevRank?, limitUps?, change? }；名次与变化由件按 strength 排出。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `boards` * | `readonly BoardStrength[]` | — | Boards in any order; ranked by strength here. |
| `labels` * | `BoardStrengthRankLabels` | — | Texts. |
| `formatStrength` | `(value: number) => string` | `(value) => value.toFixed(1)` | How a strength value is written; defaults to one decimal. |
| `limit` | `number` | — | Show only the top n; all when omitted. |
| `onSelect` | `(board: RankedBoard) => void` | — | Open a board (click or Enter). |
| `selected` | `string \| null` | `null` | The board currently open (accent stripe on its left). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BoardStrengthRank, type BoardStrength } from '@katana-ui/react/blocks'

// 演示数据：板块名、强度与走势都是编出来的（闭式公式）；强度的口径由调用方定，这里只是演示用的数。
const line = (base: number, slope: number) =>
  Array.from({ length: 12 }, (_, i) => +(base + slope * i + 2 * Math.sin(i)).toFixed(1))

export const BOARDS: readonly BoardStrength[] = [
  { id: 'b1', name: '示例机器人', strength: 86.4, series: line(60, 2.2), prevRank: 3, limitUps: 9, change: 4.82 },
  { id: 'b2', name: '示例算力', strength: 79.1, series: line(82, -0.3), prevRank: 1, limitUps: 6, change: 2.15 },
  { id: 'b3', name: '示例低空', strength: 71.6, series: line(50, 1.8), limitUps: 4, change: 3.4 },
  { id: 'b4', name: '示例医药', strength: 55.2, series: line(58, -0.2), prevRank: 4, limitUps: 2, change: 0.36 },
  { id: 'b5', name: '示例银行', strength: 41.8, series: line(55, -1.1), prevRank: 2, limitUps: 0, change: -1.27 },
]

export function BoardStrengthRankUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <BoardStrengthRank
        boards={BOARDS}
        labels={{
          list: '板块强度排名（演示数据）',
          columns: { rank: '名次', name: '板块', strength: '强度', trend: '走势', limitUps: '涨停', change: '涨跌幅' },
          move: { up: (n) => `▲${n}`, down: (n) => `▼${n}`, same: '—', new: '新' },
          trend: (board) => `${board.name} 强度走势`,
          empty: '没有板块数据',
        }}
      />
    </div>
  )
}
```

## States

- 名次变化：升 --k-tone-up、降 --k-tone-down（跟 data-updown），持平与新上榜次要灰；文字带 ▲ / ▼，不只靠颜色。
- 强度线颜色按头尾涨跌（Sparkline 默认），少于两个点写「—」。
- 选中：selected 那一行左侧强调条（DataGrid 的 isOpened）。
- limit：只显示前 n 名。

## Don't

- 不要在件里合成强度（权重表现 + 涨停数怎么加权由调用方定并写成可检验的规则）。
- 行内强度线不要开交互，一行一根时扫读归表格。

## Composition

```
BoardStrengthRank
  DataGrid（presorted）
    行：名次 + 变化 | 板块 | 强度 | Sparkline | 涨停 | 涨跌幅
```

## Keyboard

- `↑ / ↓`：在行间移动（DataGrid）
- `Enter`：打开当前行（onSelect）
