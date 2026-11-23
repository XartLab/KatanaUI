// SPDX-License-Identifier: MIT
import { BrushChart } from '../../src/quant'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

export function walk(seed: number, count: number, start = 100, step = 2): number[] {
  const next = seeded(seed)
  const out = [start]
  for (let i = 1; i < count; i++) out.push(+(out[i - 1]! + (next() - 0.5) * 2 * step).toFixed(2))
  return out
}

const DAY = 86_400_000
/** 演示用的日期轴：2026-01-01 起每天一格（UTC）。 */

export const DEMO_START = Date.UTC(2026, 0, 1)

export const dayAt = (index: number) => new Date(DEMO_START + index * DAY).toISOString().slice(0, 10)

export function BrushChartUsage() {
  const values = walk(11, 120, 1000, 18)
  return (
    <>
      <div className="gal-wide" data-gallery-brush style={{ maxWidth: 640 }}>
        <BrushChart
          values={values}
          label="示例权益曲线"
          formatX={dayAt}
          formatValue={(v) => v.toFixed(0)}
          labels={{ start: '窗口起点', end: '窗口终点', window: '窗口位置' }}
          defaultValue={[60, 120]}
          actionLabels={{ group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
          tableLabel="示例权益曲线的表格视图（窗口里的那一段）"
          tableHead={['日期', '权益']}
        />
      </div>
    </>
  )
}
