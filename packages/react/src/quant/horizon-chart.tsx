// SPDX-License-Identifier: MIT
// 地平线图：十几个品种的日内收益各叠成一条窄带，一屏看完。每一行把正负值折成几条叠起来的带（颜色越深值越大），涨跌色跟涨跌配色走。
// 功能参照 Arc 的 Horizon chart（uiarc.dev/components/charts，2026-11-14 读，只取功能），实现原创。
// 交互：所有行共用一个扫读位置（指针在任一行上移动，或键盘 ←→），每行画同一根竖线，右边一列写这一格各行的值（不选中时写最新值）。
import { useState } from 'react'
import { cn } from '../lib/cn'
import { useScrubber } from '../lib/use-scrubber'
import { horizonBands, horizonMax, HORIZON_BANDS } from './horizon-model'
import { makePlot, pct, PLOT_W } from './series-geometry'

export type HorizonRow = { key: string; label: string; values: readonly number[] }

export type HorizonChartProps = {
  rows: readonly HorizonRow[]
  /** 整张图的读屏名。 */
  label: string
  /** 一个值写成什么字（右边一列）；正负号由调用方定。 */
  formatValue: (value: number) => string
  /** 第几个点写成什么（读数行）；不给就没有读数行。 */
  formatX?: (index: number) => string
  /** 几条带。 */
  bands?: number
  /** shared：所有行同一把满刻度（行与行可比）；row：每行各用自己的最大值（看形状）。 */
  scale?: 'shared' | 'row'
  /** 固定满刻度（给了就不按数据算）。 */
  max?: number
  /** 一行的高（px）。 */
  rowHeight?: number
  className?: string
}

const areaOf = (heights: readonly number[], height: number): string => {
  if (!heights.some((h) => h > 0)) return ''
  const plot = makePlot(heights.length, [0, 1], { height, exact: true, padTop: 0, padBottom: 0 })
  const top = heights.map(
    (h, i) => `${i === 0 ? 'M' : 'L'}${plot.xAt(i).toFixed(2)},${(height - h * height).toFixed(2)}`,
  )
  return `${top.join('')}L${PLOT_W},${height}L0,${height}Z`
}

export function HorizonChart({
  rows,
  label,
  formatValue,
  formatX,
  bands = HORIZON_BANDS,
  scale = 'shared',
  max,
  rowHeight = 24,
  className,
}: HorizonChartProps) {
  const count = rows.reduce((n, row) => Math.max(n, row.values.length), 0)
  const [index, setIndex] = useState<number | null>(null)
  const scrub = useScrubber({ count, index, onIndexChange: setIndex })
  const shared = max ?? horizonMax(rows.map((row) => row.values))
  const active = scrub.index

  return (
    <figure className={cn('k-hz', className)} data-slot="horizon-chart" aria-label={label}>
      <div className="k-hz-rows" role="group" aria-label={label} {...scrub.keys}>
        {rows.map((row) => {
          const ceiling = scale === 'row' ? (max ?? horizonMax([row.values])) : shared
          const heights = horizonBands(row.values, ceiling, bands)
          const at = active === null ? row.values.length - 1 : active
          const value = row.values[at]
          return (
            <div key={row.key} className="k-hz-row" data-slot="horizon-row" data-row={row.key}>
              <span className="k-hz-label">{row.label}</span>
              <div className="k-hz-plot" style={{ height: rowHeight }} {...scrub.pointer}>
                <svg viewBox={`0 0 ${PLOT_W} ${rowHeight}`} preserveAspectRatio="none" aria-hidden="true">
                  {heights.positive.map((band, k) => (
                    <path
                      key={`p${k}`}
                      className="k-hz-band"
                      data-slot="horizon-band"
                      data-sign="up"
                      data-band={k}
                      style={{ fillOpacity: (k + 1) / bands }}
                      d={areaOf(band, rowHeight)}
                    />
                  ))}
                  {heights.negative.map((band, k) => (
                    <path
                      key={`n${k}`}
                      className="k-hz-band"
                      data-slot="horizon-band"
                      data-sign="down"
                      data-band={k}
                      style={{ fillOpacity: (k + 1) / bands }}
                      d={areaOf(band, rowHeight)}
                    />
                  ))}
                </svg>
                {active !== null && count > 1 && (
                  <span
                    className="k-plot-cross"
                    data-slot="horizon-cross"
                    style={{ left: pct(makePlot(count, [0, 1], { height: 1, exact: true }).xAt(active)) }}
                  />
                )}
              </div>
              <span
                className="k-hz-value"
                data-slot="horizon-value"
                data-tone={
                  value === undefined || !Number.isFinite(value) || value === 0 ? 'flat' : value > 0 ? 'up' : 'down'
                }
              >
                {value === undefined || !Number.isFinite(value) ? '—' : formatValue(value)}
              </span>
            </div>
          )
        })}
      </div>
      {formatX && (
        <div className="k-plot-readout" data-slot="horizon-readout" aria-live="polite">
          {active !== null ? formatX(active) : null}
        </div>
      )}
    </figure>
  )
}
