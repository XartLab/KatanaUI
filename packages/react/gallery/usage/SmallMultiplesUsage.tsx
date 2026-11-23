// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SmallMultiples, type SmallMultiple } from '../../src/blocks'

const SM_POINTS = 40

const sm = (f: (i: number) => number) => Array.from({ length: SM_POINTS }, (_, i) => +f(i).toFixed(3))

export const SMALL_MULTIPLES_DEMO: readonly SmallMultiple[] = [
  { key: 'AAA', label: 'AAA', values: sm((i) => 100 + i * 0.5) },
  { key: 'BBB', label: 'BBB', values: sm((i) => 100 - i * 0.3) },
  { key: 'CCC', label: 'CCC', values: sm((i) => 100 + 5 * Math.sin((i * Math.PI) / (SM_POINTS - 1))) },
  { key: 'DDD', label: 'DDD', values: sm((i) => 50 + 20 * Math.cos(i / 6)) },
  { key: 'EEE', label: 'EEE', values: sm((i) => 80 + 8 * Math.sin(i / 3) + i * 0.2) },
  { key: 'FFF', label: 'FFF', values: sm((i) => 120 - 15 * Math.sin(i / 8)) },
]

/** 图右上三件的文字：单独用时要给（表格视图是无障碍兜底，dataviz §4）。 */
const ACTIONS = { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

export function SmallMultiplesUsage() {
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <div className="gal-wide" data-gallery-multiples="each" style={{ maxWidth: 640 }}>
        <SmallMultiples
          items={SMALL_MULTIPLES_DEMO}
          label="示例：六个品种的走势（各自范围）"
          formatValue={(v) => v.toFixed(2)}
          formatX={(i) => `第 ${i + 1} 点`}
          onSelect={setPicked}
          actionLabels={ACTIONS}
          tableLabel="六个品种的走势（表格视图）"
          tableXHead="时点"
        />
      </div>
      <p className="gal-note" data-gallery-multiples-picked>
        {picked === null ? '还没点标题' : `点了 ${picked}`}
      </p>
      <div className="gal-wide" data-gallery-multiples="shared" style={{ maxWidth: 640 }}>
        <SmallMultiples
          items={SMALL_MULTIPLES_DEMO}
          label="示例：六个品种的走势（共用范围）"
          formatValue={(v) => v.toFixed(2)}
          yScale="shared"
          actionLabels={ACTIONS}
          tableLabel="六个品种的走势（共用范围，表格视图）"
          tableXHead="序号"
        />
      </div>
    </>
  )
}

/** 演示用的 24 个月的盈亏：2025-01 到 2026-12，一月一个点，闭式公式生成（已实现、手续费、资金费、净盈亏）。 */
