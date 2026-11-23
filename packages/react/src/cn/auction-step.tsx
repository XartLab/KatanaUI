// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import {
  AUCTION_CANCEL_CUTOFF,
  auctionSteps,
  auctionSummary,
  auctionX,
  priceDomain,
  stepPath,
  volumeBars,
  priceY,
  type AuctionPoint,
} from './auction-model.ts'
import { formatCnAmount } from './format.ts'
import { cnLabelsZh, type AuctionStepLabels } from './labels.ts'
import { DASH } from './value.ts'

// 集合竞价台阶小图（#110，信息结构取自复盘吧的竞价台阶，样子是 Graphite 的）：09:15–09:25 的撮合价画成台阶（价格在两个时刻之间不变，到下一个时刻才跳），
// 台阶下面是匹配量柱；09:20 起不可撤单，画一条竖的虚分界；昨收给了就画一条横的虚参考线，台阶按最新撮合价对昨收着涨跌色（跟 data-updown，没有昨收不着色）。
// 横轴只有这十分钟。不带行情：点由调用方给；取不到的价与量写「—」。文字走 labels。
// 同一套台阶也有迷你版 AuctionStepSpark（只画线，给 DataGrid 的 auctionStep 列用）。

export type AuctionStepProps = {
  /**
   * Auction points between 09:15 and 09:25 (matched price and optionally matched volume); order does not matter, points outside the window are dropped.
   * 竞价点（时刻、撮合价、匹配量）；次序随意，不在 09:15–09:25 的点丢掉。
   */
  points: readonly AuctionPoint[]
  /**
   * Previous close for the dashed reference line, the change readout and the up / down tone; omit to draw none of them.
   * 昨收：画参考线、算涨跌幅、定着色；不给就都没有。
   */
  prevClose?: number | null
  /**
   * Digits of the price readout; 2 by default.
   * 价格读数的小数位；默认 2。
   */
  digits?: number
  /**
   * Chart height in px; 96 by default.
   * 图高（px）；默认 96。
   */
  height?: number
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: AuctionStepLabels
  /** Extra class names. */
  className?: string
}

const W = 300
const PRICE_SHARE = 0.68

export function AuctionStep({
  points,
  prevClose,
  digits = 2,
  height = 96,
  labels = cnLabelsZh.auctionStep,
  className,
}: AuctionStepProps) {
  const steps = auctionSteps(points)
  const summary = auctionSummary(steps, prevClose)
  const domain = priceDomain(steps, prevClose)
  const priceH = height * PRICE_SHARE
  const bars = volumeBars(steps)
  const volTop = priceH + height * 0.06
  const volH = height - volTop
  const cutoff = auctionX(AUCTION_CANCEL_CUTOFF)
  const lastText = summary.last === null ? DASH : summary.last.toFixed(digits)
  const changeText = summary.change === null ? DASH : `${summary.change > 0 ? '+' : ''}${summary.change.toFixed(2)}%`
  return (
    <figure
      className={cn('k-auction', className)}
      data-slot="auction-step"
      data-tone={summary.tone}
      role="img"
      aria-label={labels.aria(lastText)}
    >
      {steps.length === 0 || domain === null ? (
        <p className="k-auction-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <>
          <figcaption className="k-auction-read">
            <span className="k-auction-cap">{labels.price}</span>
            <strong className="k-auction-price" data-slot="auction-price">
              {lastText}
            </strong>
            <span className="k-auction-change" data-slot="auction-change">
              {changeText}
            </span>
            <span className="k-auction-cap">{labels.volume}</span>
            <span className="k-auction-vol" data-slot="auction-volume">
              {formatCnAmount(summary.volume)}
            </span>
          </figcaption>
          <div className="k-auction-plot" style={{ height }}>
            <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
              {typeof prevClose === 'number' && Number.isFinite(prevClose) && (
                <line
                  className="k-auction-ref"
                  data-slot="auction-ref"
                  x1={0}
                  x2={W}
                  y1={priceY(prevClose, domain, priceH)}
                  y2={priceY(prevClose, domain, priceH)}
                />
              )}
              <line className="k-auction-cut" x1={cutoff * W} x2={cutoff * W} y1={0} y2={height} />
              {bars.map((bar, index) => (
                <rect
                  key={index}
                  className="k-auction-bar"
                  x={bar.x * W}
                  width={Math.max(0.5, bar.width * W - 0.5)}
                  y={volTop + volH * (1 - bar.ratio)}
                  height={volH * bar.ratio}
                />
              ))}
              <path className="k-auction-line" data-slot="auction-line" d={stepPath(steps, domain, W, priceH)} />
            </svg>
            <span className="k-auction-cut-label" style={{ left: `${cutoff * 100}%` }}>
              {labels.axis.cancelCutoff}
            </span>
          </div>
          <div className="k-auction-axis" aria-hidden="true">
            <span>{labels.axis.from}</span>
            <span>{labels.axis.to}</span>
          </div>
        </>
      )}
    </figure>
  )
}

export type AuctionStepSparkProps = {
  /** Auction points; same as AuctionStep. 竞价点。 */
  points: readonly AuctionPoint[] | null | undefined
  /** Previous close for the tone; omit for a neutral line. 昨收：定着色。 */
  prevClose?: number | null
  /** Width in px; 64 by default. 宽（px）；默认 64。 */
  width?: number
  /** Height in px; 16 by default. 高（px）；默认 16。 */
  height?: number
  /** Extra class names. */
  className?: string
}

/** 迷你台阶：只画线（没有量柱与读数），16px 高放得进表格行；点不够、画不出时写「—」。 */
export function AuctionStepSpark({ points, prevClose, width = 64, height = 16, className }: AuctionStepSparkProps) {
  const steps = auctionSteps(points)
  const domain = priceDomain(steps, prevClose)
  const summary = auctionSummary(steps, prevClose)
  if (steps.length === 0 || domain === null) {
    return (
      <span className={cn('k-auction-spark', className)} data-slot="auction-spark" data-empty>
        {DASH}
      </span>
    )
  }
  return (
    <svg
      className={cn('k-auction-spark', className)}
      data-slot="auction-spark"
      data-tone={summary.tone}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={summary.last === null ? DASH : summary.last.toFixed(2)}
    >
      <path className="k-auction-line" d={stepPath(steps, domain, width, height)} />
    </svg>
  )
}
