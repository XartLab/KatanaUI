// SPDX-License-Identifier: MIT
// 坐标轴与网格（dataviz.md §3）：网格 chart-grid，比分隔线暗；轴文字 chart-axis、num-sm；图没有外边框（靠 PanelFrame）。
// 网格画在 svg 里（跟着 viewBox），纵轴刻度字是 HTML，放在绘图区左侧的留白里（右对齐、贴着绘图区），不压到数据上。
import { PLOT_W, type Plot } from '../series-geometry.ts'
import { ChartValue, type ChartValueText } from './chart-value.tsx'

export function PlotGrid({ plot }: { plot: Plot }) {
  return (
    <>
      {plot.ticks.map((tick) => (
        <line key={tick.value} className="k-ck-grid" data-slot="plot-grid" x1={0} x2={PLOT_W} y1={tick.y} y2={tick.y} />
      ))}
    </>
  )
}

export function PlotYAxis({ plot, format }: { plot: Plot; format: (value: number) => ChartValueText }) {
  return (
    <>
      {plot.ticks.map((tick) => (
        <span key={tick.value} className="k-ck-ytick" data-slot="plot-ytick" style={{ top: Math.round(tick.y) }}>
          <ChartValue text={format(tick.value)} />
        </span>
      ))}
    </>
  )
}
