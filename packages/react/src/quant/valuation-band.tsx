// SPDX-License-Identifier: MIT
// 估值带（KATANAview #2395）：价格线叠估值分位带（PE / PB Band）。带线 = 当期每股盈利 × 历史分位倍数（valuation-band-model.ts），
// 最外两档之间垫一层很淡的面（不盖住价格线），带线是 1px 中性灰浓度（越近中位越亮），价格线是 2px 主墨色；标题行右侧读出当前分位与当前倍数。
// 负倍数（亏损期）不进分布、那一段带线断开。坐标、十字线、LCD 读数、表格视图复用 QuantileLayers 那套（series-geometry、chart-kit、useScrubber）。
// 参照理杏仁、Wind 的 PE Band（只取画法，待核对）。颜色只用语义 token，不用涨跌色与橙。文字全由 props 传。
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { ChartActions, type ChartActionsLabels } from '../lib/chart/chart-kit/chart-actions.tsx'
import { ChartValue, type ChartValueText } from '../lib/chart/chart-kit/chart-value.tsx'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from '../lib/chart/chart-kit/plot-axes.tsx'
import { seqColor } from '../lib/chart/chart-kit/series-colors.ts'
import { extent, linePath, makePlot, pct, PLOT_W, type Plot } from '../lib/chart/series-geometry.ts'
import { bandLine, bandMultiples, currentPercentile, DEFAULT_BAND_QUANTILES } from './valuation-band-model.ts'

export type ValuationBandLabels = {
  chart: string
  actions: ChartActionsLabels
  table: string
  /** 表格第一列（横轴）的表头。 */
  x: string
  price: string
  /** 倍数的名字（PE、PB）。 */
  multiple: string
  /** 一条带的名字（「P25 · 18.2x」）。 */
  band: (q: number, level: number | null) => string
  /** 当前分位的读数（「当前分位 P63」）。 */
  percentile: (p: number) => string
  /** 没有可用倍数时写什么。 */
  empty: string
}

export type ValuationBandProps = {
  prices: readonly (number | null)[]
  /** 与 prices 同长的估值倍数序列（PE 或 PB）。 */
  multiples: readonly (number | null)[]
  /** 分位档（0..1，从低到高）；默认 10 / 25 / 50 / 75 / 90。 */
  quantiles?: readonly number[]
  labels: ValuationBandLabels
  formatPrice: (value: number) => ChartValueText
  formatMultiple: (value: number) => string
  formatX: (index: number) => string
  title?: ReactNode
  source?: ReactNode
  height?: number
  onExport?: () => void
  onFullscreen?: () => void
  onCopyImage?: (chart: HTMLElement) => void
  className?: string
}

/** 两条线之间的面：只在两边都有数的连续段上画，每段一块。 */
function betweenPath(upper: readonly number[], lower: readonly number[], plot: Plot): string {
  let d = ''
  let run: number[] = []
  const flush = () => {
    if (run.length >= 2) {
      const top = run.map((i, k) => `${k === 0 ? 'M' : 'L'}${plot.xAt(i).toFixed(2)},${plot.yAt(upper[i]!).toFixed(2)}`)
      const bottom = run.toReversed().map((i) => `L${plot.xAt(i).toFixed(2)},${plot.yAt(lower[i]!).toFixed(2)}`)
      d += `${top.join('')}${bottom.join('')}Z`
    }
    run = []
  }
  upper.forEach((value, i) => {
    if (Number.isFinite(value) && Number.isFinite(lower[i])) run.push(i)
    else flush()
  })
  flush()
  return d
}

/** 带线的灰度：离中位越近越亮（中位最亮，两端最暗）。 */
const bandLevel = (index: number, count: number) => {
  if (count <= 1) return 4
  const mid = (count - 1) / 2
  return 4 - (Math.abs(index - mid) / mid) * 3
}

const DASH = '—'
/** 尾标最小行距（px）：尾标字是 --text-num-sm（11px），留 1px；视觉取值。 */
const TAIL_GAP = 12

/** 尾标从上到下排开，挨得太近的往下推，不叠字（位置只影响尾标，线不动）。 */
function spreadTails(tails: readonly { index: number; y: number }[]): { index: number; y: number }[] {
  const out = tails.toSorted((a, b) => a.y - b.y).map((tail) => ({ ...tail }))
  for (let i = 1; i < out.length; i += 1) out[i]!.y = Math.max(out[i]!.y, out[i - 1]!.y + TAIL_GAP)
  return out
}

export function ValuationBand({
  prices,
  multiples,
  quantiles = DEFAULT_BAND_QUANTILES,
  labels,
  formatPrice,
  formatMultiple,
  formatX,
  title,
  source,
  height = 240,
  onExport,
  onFullscreen,
  onCopyImage,
  className,
}: ValuationBandProps) {
  const [tableView, setTableView] = useState(false)
  const count = prices.length
  const scrub = useScrubber({ count })
  const levels = bandMultiples(multiples, quantiles)
  const bands = levels.map((level) => bandLine(prices, multiples, level))
  const price = prices.map((value) => (typeof value === 'number' ? value : Number.NaN))
  const percentile = currentPercentile(multiples)
  const lastMultiple = multiples.findLast(
    (value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
  const empty = percentile === null || count === 0
  const all = [...price, ...bands.flat()].filter(Number.isFinite)
  const plot = makePlot(count, extent(all), { height, padTop: 12, padBottom: 12 })
  const at = scrub.index

  return (
    <figure className={cn('k-vb', className)} data-slot="valuation-band">
      <div className="k-vb-head">
        {title === undefined ? null : <span className="k-vb-title">{title}</span>}
        {!empty && (
          <span className="k-vb-readout" data-slot="valuation-band-readout">
            <span>{labels.percentile(percentile!)}</span>
            {lastMultiple !== undefined && (
              <span className="k-vb-multiple">
                {labels.multiple} {formatMultiple(lastMultiple)}
              </span>
            )}
          </span>
        )}
        <ChartActions
          labels={labels.actions}
          tableView={tableView}
          onTableView={setTableView}
          onExport={onExport}
          onFullscreen={onFullscreen}
          onCopyImage={onCopyImage}
        />
      </div>
      {empty && (
        <p className="k-vb-note" data-slot="valuation-band-empty" role="status">
          {labels.empty}
        </p>
      )}
      {!empty && !tableView && (
        <div className="k-vb-plot" style={{ height }} role="group" aria-label={labels.chart} {...scrub.props}>
          <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <PlotGrid plot={plot} />
            {bands.length >= 2 && (
              <path className="k-vb-fill" d={betweenPath(bands[bands.length - 1]!, bands[0]!, plot)} />
            )}
            {bands.map((line, index) => (
              <path
                key={quantiles[index]}
                className="k-vb-band"
                data-slot="valuation-band-line"
                d={linePath(line, plot)}
                style={{ stroke: seqColor(bandLevel(index, bands.length)) }}
              />
            ))}
            <path className="k-vb-price" data-slot="valuation-band-price" d={linePath(price, plot)} />
            {at !== null && <line className="k-vb-cursor" x1={plot.xAt(at)} x2={plot.xAt(at)} y1={0} y2={height} />}
          </svg>
          <PlotYAxis plot={plot} format={formatPrice} />
          {spreadTails(
            bands.flatMap((line, index) => {
              const end = line.findLast(Number.isFinite)
              return end === undefined ? [] : [{ index, y: plot.yAt(end) }]
            }),
          ).map(({ index, y }) => (
            <span
              key={quantiles[index]}
              className="k-vb-tail"
              data-slot="valuation-band-tail"
              style={{ left: '100%', top: y }}
            >
              {labels.band(quantiles[index]!, levels[index] ?? null)}
            </span>
          ))}
          {at !== null && (
            <LcdTooltip
              title={formatX(at)}
              side={at > count * 0.6 ? 'left' : 'right'}
              style={{ left: pct(plot.xAt(at)), top: 8 }}
              rows={[
                {
                  key: 'price',
                  label: labels.price,
                  value: Number.isFinite(price[at]) ? <ChartValue text={formatPrice(price[at]!)} /> : DASH,
                },
                {
                  key: 'multiple',
                  label: labels.multiple,
                  value: typeof multiples[at] === 'number' ? formatMultiple(multiples[at]!) : DASH,
                },
                ...bands.toReversed().map((line, k) => {
                  const index = bands.length - 1 - k
                  return {
                    key: String(quantiles[index]),
                    label: labels.band(quantiles[index]!, levels[index] ?? null),
                    value: Number.isFinite(line[at]) ? <ChartValue text={formatPrice(line[at]!)} /> : DASH,
                    swatch: seqColor(bandLevel(index, bands.length)),
                  }
                }),
              ]}
            />
          )}
          <div className="k-vb-xaxis" aria-hidden="true">
            <span>{formatX(0)}</span>
            <span>{formatX(count - 1)}</span>
          </div>
        </div>
      )}
      {!empty && tableView && (
        <div
          className="k-sx-table k-vb-table"
          tabIndex={0}
          role="region"
          aria-label={labels.table}
          data-slot="valuation-band-table"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">{labels.x}</th>
                <th scope="col">{labels.price}</th>
                <th scope="col">{labels.multiple}</th>
                {quantiles.map((q, index) => (
                  <th key={q} scope="col">
                    {labels.band(q, levels[index] ?? null)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }, (_, i) => (
                <tr key={i}>
                  <th scope="row">{formatX(i)}</th>
                  <td>{Number.isFinite(price[i]) ? <ChartValue text={formatPrice(price[i]!)} /> : DASH}</td>
                  <td>{typeof multiples[i] === 'number' ? formatMultiple(multiples[i]!) : DASH}</td>
                  {bands.map((line, index) => (
                    <td key={quantiles[index]}>
                      {Number.isFinite(line[i]) ? <ChartValue text={formatPrice(line[i]!)} /> : DASH}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {source === undefined ? null : <p className="k-vb-source">{source}</p>}
    </figure>
  )
}
