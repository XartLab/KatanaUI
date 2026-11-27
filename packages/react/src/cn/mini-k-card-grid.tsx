// SPDX-License-Identifier: MIT
import type { CSSProperties } from 'react'
import { cn } from '../lib/cn.ts'
import { cnLabelsZh, type MiniKCardLabels } from './labels.ts'
import { candleShapes, changeText, gridColumns, lastChange, validCandles, type Candle } from './mini-k-model.ts'
import { DASH } from './value.ts'

// 选股结果卡片网格（#110，信息结构取自复盘吧的选股结果）：一行 2 / 3 / 4 只，每张卡是名称与代码、一个小 K 线、最新价与涨跌幅。
// K 线是包里自带的轻量 SVG 蜡烛（实体加影线，等宽等距）；涨红跌绿只用语义色调（读 --pnl-up / --pnl-down，跟 data-updown）。
// 不带行情：蜡烛、最新价、涨跌幅都由调用方给（涨跌幅不给就用最后两根的收盘算）；取不到写「—」。给了 onSelect 卡片是按钮。文字走 labels。

export type MiniKItem = {
  /** Stock code, unique within the grid. */
  code: string
  /** Stock name. */
  name: string
  /** Recent candles from oldest to newest; none writes a no-candles line. */
  candles: readonly Candle[]
  /** Latest price; the last close when omitted. */
  price?: number | null
  /** Change in percent; computed from the last two closes when omitted. */
  change?: number | null
}

export type MiniKCardGridProps = {
  /**
   * The picked stocks, in display order.
   * 选出来的票，按显示次序。
   */
  items: readonly MiniKItem[]
  /**
   * Cards per row: 2, 3 or 4; 3 by default. The grid falls back to fewer columns when the container is too narrow.
   * 一行几只：2、3 或 4，默认 3；容器太窄时自动退成更少的列。
   */
  columns?: 2 | 3 | 4
  /**
   * Called when a card is picked; without it the cards are plain.
   * 点卡片的回调；不给卡片就是普通块。
   */
  onSelect?: (item: MiniKItem) => void
  /**
   * Price digits; 2 by default.
   * 价格小数位；默认 2。
   */
  digits?: number
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: MiniKCardLabels
  /** Extra class names. */
  className?: string
}

const W = 120
const H = 56

function MiniK({ candles, labels }: { candles: readonly Candle[]; labels: MiniKCardLabels }) {
  const geometry = candleShapes(candles, W, H)
  if (geometry === null) {
    return (
      <p className="k-mink-none" data-slot="mini-k-none">
        {labels.noCandles}
      </p>
    )
  }
  return (
    <svg
      className="k-mink-chart"
      data-slot="mini-k-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={labels.chart(candles.length)}
    >
      {geometry.shapes.map((shape, index) => (
        <g key={index} className="k-mink-candle" data-tone={shape.tone}>
          <line x1={shape.wickX} x2={shape.wickX} y1={shape.wickTop} y2={shape.wickBottom} />
          <rect x={shape.bodyX} y={shape.bodyTop} width={shape.bodyWidth} height={shape.bodyHeight} />
        </g>
      ))}
    </svg>
  )
}

export function MiniKCardGrid({
  items,
  columns = 3,
  onSelect,
  digits = 2,
  labels = cnLabelsZh.miniK,
  className,
}: MiniKCardGridProps) {
  const cols = gridColumns(columns)
  if (items.length === 0) {
    return (
      <p className={cn('k-mink-empty', className)} data-slot="mini-k-card-grid" role="status">
        {labels.empty}
      </p>
    )
  }
  return (
    <ul
      className={cn('k-mink', className)}
      data-slot="mini-k-card-grid"
      data-columns={cols}
      aria-label={labels.region}
      style={{ '--mink-cols': cols } as CSSProperties}
    >
      {items.map((item) => {
        const candles = validCandles(item.candles)
        const change = item.change === undefined ? lastChange(candles) : item.change
        const price = item.price === undefined ? (candles[candles.length - 1]?.close ?? null) : item.price
        const tone = change === null || change === 0 ? 'flat' : change > 0 ? 'up' : 'down'
        const body = (
          <>
            <span className="k-mink-head">
              <span className="k-mink-name">{item.name}</span>
              <span className="k-mink-code">{item.code}</span>
            </span>
            <MiniK candles={candles} labels={labels} />
            <span className="k-mink-foot">
              <span className="k-mink-price" data-slot="mini-k-price">
                {price === null || !Number.isFinite(price) ? DASH : price.toFixed(digits)}
              </span>
              <span className="k-mink-change" data-slot="mini-k-change">
                {changeText(change)}
              </span>
            </span>
          </>
        )
        const aria = labels.card(item.name, item.code, changeText(change))
        return (
          <li key={item.code} className="k-mink-item">
            {onSelect ? (
              <button
                type="button"
                className="k-mink-card"
                data-slot="mini-k-card"
                data-code={item.code}
                data-tone={tone}
                aria-label={aria}
                onClick={() => onSelect(item)}
              >
                {body}
              </button>
            ) : (
              <div
                className="k-mink-card"
                data-slot="mini-k-card"
                data-code={item.code}
                data-tone={tone}
                role="group"
                aria-label={aria}
              >
                {body}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
