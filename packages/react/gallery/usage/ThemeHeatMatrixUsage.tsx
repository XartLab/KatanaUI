// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ThemeHeatMatrix, type ThemeHeatPos, type ThemeHeatRow } from '../../src/quant'

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
