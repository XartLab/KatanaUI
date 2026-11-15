// SPDX-License-Identifier: MIT
import { ParamScatter, type ParamPoint } from '../../src/quant'

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const GRID: readonly ParamPoint[] = (() => {
  const rand = seeded(351)
  const points: ParamPoint[] = []
  for (let fast = 8; fast <= 52; fast += 4)
    for (let slow = 40; slow <= 130; slow += 10) {
      const bump = Math.exp(-((fast - 24) ** 2 / 260 + (slow - 90) ** 2 / 1500))
      points.push({
        id: `f${fast}-s${slow}`,
        x: fast,
        y: slow,
        value: fast + 8 > slow ? null : Number((1.7 * bump - 0.45 + (rand() - 0.5) * 0.35).toFixed(2)),
      })
    }
  return points
})()

export function ParamScatterUsage() {
  const actions = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }
  return (
    <>
      <div className="gal-wide" data-gallery-pscatter="main" style={{ maxWidth: 720 }}>
        <ParamScatter
          actionLabels={actions}
          tableLabel="参数网格表"
          tableHead={['组合', '快线', '慢线', '夏普比率']}
          points={GRID}
          label="示例：快线与慢线周期的夏普比率网格"
          axes={{ x: '快线周期', y: '慢线周期' }}
          valueName="夏普比率"
          formatValue={(v) => v.toFixed(2)}
          bestLabel="最优"
          jumpLabel="跳到最优"
          noValue="没有结果"
          idle="点一个点，看这组参数"
          source="来源 / 演示数据（固定种子合成）"
        />
      </div>
    </>
  )
}
