// SPDX-License-Identifier: MIT
// 小图阵列（small multiples）：自选、组合里多个品种并排各一张小折线（series-1，不按涨跌着色；涨跌色只给标题行的数字），末点强调色，悬停出 LCD 窗，同一个十字线：指针在任一张上移动，所有张的竖线与读数一起走。
// 功能参照 Arc 的 Small multiples（同步十字线的小图阵列，uiarc.dev/components/charts，2026-11-14 读，只取功能），实现原创。
// 扫读用 useScrubber（受控，位置存在这里，所有张共用）；比例尺与路径用 quant 的 series-geometry。
// 右上三件（dataviz §4，KatanaUI #165）：给了 actionLabels、tableLabel、tableXHead 才画；表格一行一个横轴位置、一列一张小图，同 QuantileLayers 的表。
//   单独用时要给（表格视图是无障碍兜底）；不给是留给嵌在别的积木里的用法（SentimentCycle 底下那排指标），由外层管工具条。
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { quoteTone } from '../quotes/quote-tone.ts'
import { ChartActions } from '../lib/chart/chart-kit/chart-actions.tsx'
import { SeriesChartTable, type SeriesTableViewProps } from '../lib/chart/chart-kit/chart-table.tsx'
import { EndMarker } from '../lib/chart/chart-kit/end-marker.tsx'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { extent, linePath, makePlot, pct, PLOT_W } from '../lib/chart/series-geometry.ts'

export type SmallMultiple = {
  key: string
  label: string
  values: readonly number[]
  /** Per-item value text, overriding formatValue (series with different units in one grid). 这一张自己的写法（同一阵列里单位不同，如只数与百分比），盖掉 formatValue。 */
  format?: (value: number) => string
}

export type SmallMultiplesProps = Partial<SeriesTableViewProps> & {
  items: readonly SmallMultiple[]
  /** 整个阵列的读屏名。 */
  label: string
  /** 一个值写成什么字（每张小图标题行右边）。 */
  formatValue: (value: number) => string
  /** 第几个点写成什么（读数行）；不给没有读数行。 */
  formatX?: (index: number) => string
  /** each：每张小图各用自己的上下范围（看形状）；shared：所有张同一把（可比）。 */
  yScale?: 'each' | 'shared'
  /** 每张小图的最小宽（px），一行放几张由容器宽决定。 */
  minWidth?: number
  /** 折线区的高（px）。 */
  height?: number
  /** 给了标题可点（带键盘焦点），点了拿到这一张的 key。 */
  onSelect?: (key: string) => void
  className?: string
}

export function SmallMultiples({
  items,
  label,
  formatValue,
  formatX,
  yScale = 'each',
  minWidth = 160,
  height = 56,
  onSelect,
  actionLabels,
  tableLabel,
  tableXHead,
  source,
  onExport,
  onFullscreen,
  className,
}: SmallMultiplesProps) {
  const count = items.reduce((n, item) => Math.max(n, item.values.length), 0)
  const [index, setIndex] = useState<number | null>(null)
  const [tableView, setTableView] = useState(false)
  const scrub = useScrubber({ count, index, onIndexChange: setIndex })
  const active = scrub.index
  const sharedRange = extent(items.flatMap((item) => item.values))
  const view = actionLabels && tableLabel !== undefined && tableXHead !== undefined
  const table = view && tableView

  return (
    <figure className={cn('k-sm', className)} data-slot="small-multiples" aria-label={label}>
      {view && (
        <div className="k-dist-bar">
          <ChartActions
            labels={actionLabels}
            tableView={tableView}
            onTableView={setTableView}
            onExport={onExport}
            onFullscreen={onFullscreen}
          />
        </div>
      )}
      {table && (
        <SeriesChartTable
          slot="small-multiples-table"
          label={tableLabel}
          xHead={tableXHead}
          formatX={formatX}
          columns={items.map((item) => ({
            key: item.key,
            label: item.label,
            values: item.values,
            format: item.format ?? formatValue,
          }))}
        />
      )}
      <div
        className="k-sm-grid"
        role="group"
        aria-label={label}
        hidden={table}
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }}
        {...scrub.keys}
      >
        {items.map((item) => {
          const plot = makePlot(item.values.length, yScale === 'shared' ? sharedRange : extent(item.values), {
            height,
            padTop: 4,
            padBottom: 4,
            exact: true,
          })
          const first = item.values.find((value) => Number.isFinite(value))
          // js/copying-array-methods：findLast 从后往前找，等价于原来的「复制 + reverse + find」，且不复制。
          const last = item.values.findLast((value) => Number.isFinite(value))
          const tone = quoteTone(first === undefined || last === undefined ? null : last - first)
          const at = active === null ? item.values.length - 1 : Math.min(active, item.values.length - 1)
          const value = item.values[at]
          const write = item.format ?? formatValue
          const title = (
            <>
              <span className="k-sm-label">{item.label}</span>
              <span className="k-sm-value" data-slot="small-multiple-value" data-tone={tone}>
                {value === undefined || !Number.isFinite(value) ? '—' : write(value)}
              </span>
            </>
          )
          return (
            <div key={item.key} className="k-sm-cell" data-slot="small-multiple" data-key={item.key} data-tone={tone}>
              {onSelect ? (
                <button type="button" className="k-sm-head" onClick={() => onSelect(item.key)}>
                  {title}
                </button>
              ) : (
                <div className="k-sm-head">{title}</div>
              )}
              <div className="k-sm-plot" style={{ height }} {...scrub.pointer}>
                <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
                  <path className="k-sm-line" data-slot="small-multiple-line" d={linePath(item.values, plot)} />
                </svg>
                {Number.isFinite(item.values[at]) && <EndMarker x={plot.xAt(at)} y={plot.yAt(item.values[at]!)} />}
                {active !== null && active < item.values.length && Number.isFinite(item.values[active]) && (
                  <>
                    <span
                      className="k-plot-cross"
                      data-slot="small-multiple-cross"
                      style={{ left: pct(plot.xAt(active)) }}
                    />
                    <LcdTooltip
                      style={{ left: pct(plot.xAt(active)), top: 0 }}
                      side={active > (item.values.length - 1) / 2 ? 'left' : 'right'}
                      title={formatX?.(active)}
                      rows={[{ key: 'v', label: item.label, value: write(item.values[active]!) }]}
                    />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {formatX && (
        <div className="k-plot-readout" data-slot="small-multiples-readout" aria-live="polite" hidden={table}>
          {active !== null ? formatX(active) : null}
        </div>
      )}
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </figure>
  )
}
