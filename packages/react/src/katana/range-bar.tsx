// SPDX-License-Identifier: MIT
// 区间条：一条横线从最低到最高，上面一个标记指着现价在区间里的位置，两端写最低与最高。常用来看当日区间与 52 周区间。
// 功能参照 TradingView 小组件 Symbol Info 的区间（tradingview.com/widget-docs，2026-11-14 读：页面只说有「显示品种详情」，没写区间条的样子）与 ATAS 的区间读数，
// 画法我们自己定：标记按弹簧（snappy）滑到新位置；数据在区间外就贴边；最高等于最低时不画标记（没有位置可说）。不嵌、不抄其代码与样式。
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
  className,
}: RangeBarProps) {
  const share = rangeShare(low, high, value)
  return (
    <div
      className={`k-range${className ? ` ${className}` : ''}`}
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
            <span className="k-range-fill" style={{ width: `${share * 100}%` }} />
            <span className="k-range-mark" style={{ left: `${share * 100}%` }} />
          </>
        )}
      </span>
      <span className="k-range-end is-high">
        {highLabel && <small>{highLabel}</small>}
        {format(high)}
      </span>
    </div>
  )
}
