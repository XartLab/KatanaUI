// SPDX-License-Identifier: MIT
import { KpiChart } from '../../src/quant'
import { DEMO_EQUITY } from '../research-data'

// 示例数据：研究报告页同一组固定种子合成的周频权益，取最后 52 周；回撤与滚动 12 周夏普由它算出来。三条线单位不同，用 normalized 纵轴。
const WEEKS = DEMO_EQUITY.slice(-53)
const SHOWN = WEEKS.slice(1)
const equity = SHOWN.map((p) => p.equity)
const returns = SHOWN.map((p, i) => p.equity / WEEKS[i]!.equity - 1)
const drawdown = SHOWN.map((p) => p.drawdown / p.equity)
const WINDOW = 12
const sharpe = returns.map((_, i) => {
  if (i + 1 < WINDOW) return null
  const slice = returns.slice(i + 1 - WINDOW, i + 1)
  const mean = slice.reduce((a, b) => a + b, 0) / WINDOW
  const sd = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (WINDOW - 1))
  return sd > 0 ? (mean / sd) * Math.sqrt(52) : null
})
const day = (time: number) => new Date(time).toISOString().slice(5, 10)
const last = equity[equity.length - 1]!

export function KpiChartUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 520 }} data-gallery-kpi="main">
      <KpiChart
        title="权益 · 回撤 · 滚动夏普（示例）"
        label="示例：KPI 图"
        value={Math.round(last).toLocaleString('en-US')}
        delta={last / equity[0]! - 1}
        labels={SHOWN.map((p) => day(p.time))}
        tooltipLabels={SHOWN.map((p) => p.title ?? '')}
        scale="normalized"
        series={[
          { key: 'equity', label: '权益', values: equity, format: (v) => Math.round(v).toLocaleString('en-US') },
          { key: 'drawdown', label: '回撤', values: drawdown, format: (v) => `${(v * 100).toFixed(1)}%` },
          { key: 'sharpe', label: '滚动夏普', values: sharpe, format: (v) => v.toFixed(2) },
        ]}
        emptyText="还没有回测结果"
        footer="来源 / 示例数据（固定种子合成）"
      />
    </div>
  )
}
