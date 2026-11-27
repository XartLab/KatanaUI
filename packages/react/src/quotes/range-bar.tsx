// SPDX-License-Identifier: MIT
// 区间条：一条横线从最低到最高，上面一个标记指着现价在区间里的位置，两端写最低与最高。常用来看当日区间与 52 周区间。
// 功能参照 TradingView 小组件 Symbol Info 的区间（tradingview.com/widget-docs，2026-11-14 读：页面只说有「显示品种详情」，没写区间条的样子）与 ATAS 的区间读数，
// 画法我们自己定：标记按弹簧（snappy）滑到新位置；数据在区间外就贴边；最高等于最低时不画标记（没有位置可说）。不嵌、不抄其代码与样式。
import { fillVar } from '../lib/fill.ts'

export type RangeBarProps = {
  /** Lowest value; no marker is drawn when high is not greater than low. */
  low: number
  /** Highest value. */
  high: number
  /** Current value; it sticks to the edge when outside the range. */
  value: number
  /**
   * How to write a number; at most two decimals when omitted.
   * 数怎么写；不给就最多两位小数。
   */
  format?: (value: number) => string
  /**
   * Accessible name (role=meter), required, for example "Day range".
   * 读屏名（如「当日区间」）。
   */
  label: string
  /**
   * Small caption above the low end, such as "Low"; nothing when omitted.
   * 两端上方的小标题（如「低」「高」），不给就不写。
   */
  lowLabel?: string
  /** Small caption above the high end, such as "High". */
  highLabel?: string
  /**
   * Marker style: a bar (default) or a triangle below the track (the TradingView right-rail look).
   * 标记的样子：竖条（默认）或轨道下方的三角（TradingView 右栏的画法）。
   */
  marker?: 'bar' | 'triangle'
  /**
   * Visible title above the track ("Day's range"); nothing when omitted, the accessible name stays label.
   * 轨道上方可见的标题（「Day's range」）；不给就不写，读屏名仍是 label。
   */
  title?: string
  /** Extra class name on the root. */
  className?: string
}

const plain = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

/** 现价在区间里的位置 0 到 1（越界贴边）；区间没有宽度或数不是有限数时是 null。 */
export function rangeShare(low: number, high: number, value: number): number | null {
  if (![low, high, value].every(Number.isFinite) || high <= low) return null
  return Math.min(1, Math.max(0, (value - low) / (high - low)))
}

export function RangeBar({
  low,
  high,
  value,
  format = plain.format,
  label,
  lowLabel,
  highLabel,
  marker = 'bar',
  title,
  className,
}: RangeBarProps) {
  const share = rangeShare(low, high, value)
  const body = (
    <div
      className={`k-range${className ? ` ${className}` : ''}`}
      data-marker={marker}
      role="meter"
      aria-label={label}
      aria-valuemin={low}
      aria-valuemax={high}
      aria-valuenow={value}
      aria-valuetext={`${format(low)} – ${format(high)}: ${format(value)}`}
    >
      <span className="k-range-end is-low">
        {lowLabel && <small>{lowLabel}</small>}
        {format(low)}
      </span>
      <span className="k-range-track" aria-hidden="true">
        {share !== null && (
          <>
            <span className="k-range-fill" style={fillVar(share)} />
            <span className="k-range-mark" data-slot="range-mark" style={fillVar(share)} />
          </>
        )}
      </span>
      <span className="k-range-end is-high">
        {highLabel && <small>{highLabel}</small>}
        {format(high)}
      </span>
    </div>
  )
  return title ? (
    <div className="k-range-block">
      <span className="k-range-title">{title}</span>
      {body}
    </div>
  ) : (
    body
  )
}

export type CompareBarSide = {
  /** 这一条的名字（Volume、Avg. volume (30D)）。 */
  label: string
  value: number
  /** 写好的读数（59.2M）。 */
  text: string
}

export type CompareBarProps = {
  /**
   * The first bar (drawn light grey): its name, value (sets the width) and the reading text.
   * 第一条（亮灰）：名字、数值（定宽度）与写好的读数。
   */
  a: CompareBarSide
  /**
   * The second bar (drawn dark grey); the widths follow the larger of the two values.
   * 第二条（暗灰）；宽度按两者里大的那个算。
   */
  b: CompareBarSide
  /**
   * Accessible name (role=group), required.
   * 读屏名（role=group）。
   */
  label: string
  /** Extra class name on the root. */
  className?: string
}

/** 两条同比例尺的细条：a 取亮灰、b 取暗灰，宽度按两者里大的那个算；用来比成交量与它的 30 日均量。不上涨跌色（它们没有方向）。 */
export function CompareBar({ a, b, label, className }: CompareBarProps) {
  const top = Math.max(a.value, b.value)
  const share = (v: number) => (top > 0 && Number.isFinite(v) ? Math.min(1, Math.max(0, v / top)) : 0)
  return (
    <div
      className={`k-compare${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={label}
      data-slot="compare-bar"
    >
      {(
        [
          ['a', a],
          ['b', b],
        ] as const
      ).map(([id, side]) => (
        <div key={id} className="k-compare-row" data-side={id}>
          <span className="k-compare-head">
            <span>{side.label}</span>
            <span className="k-compare-text">{side.text}</span>
          </span>
          <span className="k-compare-track" aria-hidden="true">
            <span className="k-compare-fill" data-slot="compare-fill" style={fillVar(share(side.value))} />
          </span>
        </div>
      ))}
    </div>
  )
}
