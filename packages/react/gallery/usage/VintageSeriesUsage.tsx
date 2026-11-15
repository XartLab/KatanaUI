// SPDX-License-Identifier: MIT
import { VintageSeries, type VintageObservation } from '../../src/quant'

const DAY = 86_400_000

// 虚构的 12 个月同比：每期首次发布后有一次修订。
const OBSERVATIONS: VintageObservation[] = Array.from({ length: 12 }, (_, i) => {
  const period = Date.UTC(2025, i + 1, 0)
  const truth = 2.4 + Math.sin(i / 2)
  return {
    period,
    releases: [
      { at: period + 14 * DAY, value: Number((truth + 0.3).toFixed(2)), note: '首次发布' },
      { at: period + 45 * DAY, value: Number(truth.toFixed(2)), note: '第二次修订' },
    ],
  }
})

const pad = (n: number) => String(n).padStart(2, '0')
const month = (at: number) => `${new Date(at).getUTCFullYear()}-${pad(new Date(at).getUTCMonth() + 1)}`
const day = (at: number) => `${month(at)}-${pad(new Date(at).getUTCDate())}`

export function VintageSeriesUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <VintageSeries
        observations={OBSERVATIONS}
        labels={{
          chart: '示例：某虚构指标同比，按发布时间',
          mode: '看哪条线',
          known: '当时已知值',
          latest: '最新修订值',
          both: '两条都看',
          revisions: '修订幅度（最新 − 首次）',
          revision: '累计修订',
          notYet: '还没发布',
          stats: { revised: '修订过的期', meanAbs: '平均绝对修订', bias: '平均修订方向', largest: '最大一次' },
          empty: '没有数据',
        }}
        formatPeriod={month}
        formatAt={day}
        formatValue={(value) => `${value.toFixed(2)}%`}
        formatDelta={(delta) => `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`}
        actionLabels={{ group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
        tableLabel="发布值明细表"
        tableHead={['统计期', '发布时刻', '值', '较上次', '较首次']}
        badge="演示数据"
        source="来源 / 演示数据（虚构）"
      />
    </div>
  )
}
