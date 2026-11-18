// SPDX-License-Identifier: MIT
import { BoardStrengthRank, type BoardStrength } from '../../src/blocks'

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
