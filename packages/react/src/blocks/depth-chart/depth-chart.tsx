// SPDX-License-Identifier: MIT
/**
 * Depth chart: cumulative bid and ask volume as stepped areas around the mid price, with a hover readout and an optional range limit.
 * 深度图：买卖累计量阶梯面积，中间价一条虚线分界；悬停（或左右方向键）读价格、累计量、距中间价的百分比；
 * rangePct 把横轴限制在中间价上下各 x%。只吃 props，档位由调用方合并好传进来；累计量按整数算（十进制精确，见 depth-chart-model.ts）。
 * 画法：横向用抽象宽度 1000、竖向用像素高度（元素高度固定、preserveAspectRatio="none"），文字与十字线是叠在上面的 HTML，按百分比定位，不随拉伸变形。
 */
import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { LcdTooltip } from '../../lib/chart/chart-kit/lcd-tooltip.tsx'
import { niceTicks, PLOT_W } from '../../lib/chart/series-geometry.ts'
import { signed } from '../../lib/num.ts'
import { formatDecimal, fromUnits, toUnits } from '../../lib/scaled-decimal.ts'
import type { BookLevel } from '../order-book/order-book-model.ts'
import { buildDepth, depthAt, depthPrices, stepAreaPath, stepLinePath } from './depth-chart-model.ts'

/** Texts of DepthChart (the package ships no text). */
export type DepthChartLabels = {
  /** Accessible name of the chart. 图的读屏名。 */
  chart: string
  /** Name of the bid side (「买盘」), used in the hover readout. 买盘的名字。 */
  bid: string
  /** Name of the ask side (「卖盘」), used in the hover readout. 卖盘的名字。 */
  ask: string
  /** Name of the mid price marker (「中间价」). 中间价标记的名字。 */
  mid: string
  /** Hover readout row name for the cumulative size. 悬停读数里累计量一行的名字。 */
  total: string
  /** Hover readout row name for the distance from the mid price. 悬停读数里距中间价一行的名字。 */
  offset: string
  /** Text when there are no levels. 没有档位时的字。 */
  empty: string
}

export type DepthChartProps = {
  /** Bid levels in any order; a level with size 0 is treated as gone. 买盘档位，次序不限。 */
  bids: readonly BookLevel[]
  /** Ask levels in any order. 卖盘档位，次序不限。 */
  asks: readonly BookLevel[]
  /** Decimal places of a price. 价格小数位。 */
  priceDecimals: number
  /** Decimal places of a size. 数量小数位。 */
  sizeDecimals: number
  /** Texts. */
  labels: DepthChartLabels
  /** Limit the horizontal domain to this many percent either side of the mid price; all levels when omitted. 把横轴限制在中间价上下各多少个百分点。 */
  rangePct?: number | null
  /** Plot height in px; default 220. 绘图区高度（像素）。 */
  height?: number
  /** How a price is written; defaults to fixed priceDecimals places. 价格写法。 */
  formatPrice?: (price: number) => string
  /** How a size is written; defaults to fixed sizeDecimals places. 数量写法。 */
  formatSize?: (size: number) => string
  /** Extra class name on the root. */
  className?: string
}

const DEFAULT_HEIGHT = 220
const X_TICKS = 5
const pctText = (value: number) => signed(value, (v) => `${v.toFixed(2)}%`)

export function DepthChart({
  bids,
  asks,
  priceDecimals,
  sizeDecimals,
  labels,
  rangePct,
  height = DEFAULT_HEIGHT,
  formatPrice,
  formatSize,
  className,
}: DepthChartProps) {
  const statusId = useId()
  const [hover, setHover] = useState<number | null>(null)
  const fmtPrice = formatPrice ?? ((price: number) => formatDecimal(price, priceDecimals))
  const fmtSize = formatSize ?? ((size: number) => formatDecimal(size, sizeDecimals))
  const model = buildDepth(bids, asks, { rangePct, priceDecimals, sizeDecimals })

  if (model.mid === null) {
    return (
      <div className={cn('k-depth', className)} data-slot="depth-chart">
        <p className="k-depth-empty" role="status">
          {labels.empty}
        </p>
      </div>
    )
  }

  const mid = model.mid
  const [lo, hi] = model.domain
  const span = hi - lo
  const ticks = model.maxTotal > 0 ? niceTicks(0, model.maxTotal, 4) : null
  const top = ticks ? ticks.domain[1] : 1
  const yTicks = ticks ? ticks.ticks : [0]
  const x = (price: number) => ((price - lo) / span) * PLOT_W
  const y = (total: number) => height - (total / top) * height
  const pct = (price: number) => `${((price - lo) / span) * 100}%`

  const reading = hover === null ? null : depthAt(model, hover)
  const readingText = reading
    ? `${reading.side === 'bid' ? labels.bid : labels.ask} ${fmtPrice(reading.price)} · ${labels.total} ${fmtSize(reading.total)} · ${labels.offset} ${pctText(reading.offsetPct)}`
    : ''

  const snap = (price: number) => fromUnits(toUnits(price, priceDecimals), priceDecimals)
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
    setHover(snap(lo + ratio * span))
  }
  // 键盘：左右方向键在档位价上一档一档走（没选中时从中间价起），Esc 清掉。
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (hover !== null) setHover(null)
      return
    }
    const prices = depthPrices(model)
    if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || prices.length === 0) return
    event.preventDefault()
    const at = hover === null ? mid : hover
    setHover(
      event.key === 'ArrowRight'
        ? (prices.find((p) => p > at) ?? prices[prices.length - 1]!)
        : (prices.findLast((p) => p < at) ?? prices[0]!),
    )
  }
  const flip = reading !== null && (reading.price - lo) / span > 0.55

  return (
    <div className={cn('k-depth', className)} data-slot="depth-chart">
      <div
        className="k-depth-plot"
        data-slot="depth-plot"
        style={{ height }}
        role="group"
        aria-label={labels.chart}
        aria-describedby={statusId}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setHover(null)}
      >
        <svg className="k-depth-svg" viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {yTicks.map((tick) => (
            <line key={tick} className="k-ck-grid" x1={0} x2={PLOT_W} y1={y(tick)} y2={y(tick)} />
          ))}
          <path className="k-depth-area" data-side="bid" d={stepAreaPath(model.bids, lo, x, y, height)} />
          <path className="k-depth-area" data-side="ask" d={stepAreaPath(model.asks, hi, x, y, height)} />
          <path className="k-depth-line" data-side="bid" d={stepLinePath(model.bids, lo, x, y)} />
          <path className="k-depth-line" data-side="ask" d={stepLinePath(model.asks, hi, x, y)} />
          <line className="k-depth-mid" x1={x(mid)} x2={x(mid)} y1={0} y2={height} />
        </svg>
        {yTicks.map((tick) => (
          <span key={tick} className="k-depth-ytick" style={{ top: y(tick) }}>
            {fmtSize(tick)}
          </span>
        ))}
        <span className="k-depth-midlabel" style={{ left: pct(mid) }} data-slot="depth-mid">
          {labels.mid} {fmtPrice(mid)}
        </span>
        {reading ? (
          <>
            <i className="k-depth-cross" style={{ left: pct(reading.price) }} />
            <i
              className="k-depth-dot"
              data-side={reading.side}
              style={{ left: pct(reading.price), top: y(reading.total) }}
            />
            <LcdTooltip
              side={flip ? 'left' : 'right'}
              style={{ left: pct(reading.price), top: 8 }}
              title={fmtPrice(reading.price)}
              rows={[
                { key: 'total', label: labels.total, value: fmtSize(reading.total) },
                { key: 'offset', label: labels.offset, value: pctText(reading.offsetPct) },
              ]}
            />
          </>
        ) : null}
      </div>
      <div className="k-depth-xaxis" aria-hidden="true">
        {Array.from({ length: X_TICKS }, (_, i) => lo + (span * i) / (X_TICKS - 1)).map((price, i) => (
          <span key={i} className="k-depth-xtick" style={{ left: `${(i / (X_TICKS - 1)) * 100}%` }}>
            {fmtPrice(price)}
          </span>
        ))}
      </div>
      <p id={statusId} className="k-depth-status" role="status" data-slot="depth-readout">
        {readingText}
      </p>
    </div>
  )
}
