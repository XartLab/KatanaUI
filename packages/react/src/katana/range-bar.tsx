// SPDX-License-Identifier: MIT
// 区间条：一条横线从最低到最高，上面一个标记指着现价在区间里的位置，两端写最低与最高。常用来看当日区间与 52 周区间。
// 功能参照 TradingView 小组件 Symbol Info 的区间（tradingview.com/widget-docs，2026-11-14 读：页面只说有「显示品种详情」，没写区间条的样子）与 ATAS 的区间读数，
// 画法我们自己定：标记按弹簧（snappy）滑到新位置；数据在区间外就贴边；最高等于最低时不画标记（没有位置可说）。不嵌、不抄其代码与样式。
export type RangeBarProps = {
  low: number
  high: number
  value: number
  /** 数怎么写；不给就最多两位小数。 */
  format?: (value: number) => string
  /** 读屏名（如「当日区间」）。 */
  label: string
  /** 两端上方的小标题（如「低」「高」），不给就不写。 */
  lowLabel?: string
  highLabel?: string
  /** 标记的样子：竖条（默认）或轨道下方的三角（TradingView 右栏的画法）。 */
  marker?: 'bar' | 'triangle'
  /** 轨道上方可见的标题（「Day's range」）；不给就不写，读屏名仍是 label。 */
  title?: string
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
            <span className="k-range-fill" style={{ width: `${share * 100}%` }} />
            <span className="k-range-mark" data-slot="range-mark" style={{ left: `${share * 100}%` }} />
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
  a: CompareBarSide
  b: CompareBarSide
  /** 读屏名。 */
  label: string
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
            <span
              className="k-compare-fill"
              data-slot="compare-fill"
              style={{ width: `${share(side.value) * 100}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}
