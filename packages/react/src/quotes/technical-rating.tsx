// SPDX-License-Identifier: MIT
import { type CSSProperties, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { useValueFlash, type FlashDirection } from '../lib/live.ts'
import { GAUGE_CX, GAUGE_CY, ratingAngle, ratingZone, RATING_BOUNDS, zoneArc } from './rating-gauge-model.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'

// 技术评级仪表（#20）：照 TradingView 的 Technicals 仪表（博客「Meet the new technicals tab」：振荡指标、均线、由全部评级合成的总评三组，
// 每个仪表底下写参与评级的指标总数；帮助中心「Technical Ratings」：评级只是指标读数的汇总、不建议只凭它买卖；2026-11-15 读）。
// 五档分界与指针转角用包里 rating-gauge-model 的同一把尺子（−0.5、−0.1、0.1、0.5，出处见那里）。
// 组件只画，不算：每组的 −1…1 分数与卖 / 中性 / 买个数、每个指标的读数与单项结论都由调用方算好传来；包里不带语言，档名、列名、免责一句也由调用方传。
// 2026-11-15 #53 对齐 TradingView 技术页（主会话同日实测 /symbols/NASDAQ-AAPL/technicals/，只取布局与功能）：周期条、三个仪表（两端信号色、中段灰）、
// 圆角三列计数框、两张并排明细表（每组一张，标题带「›」）、整宽 Pivots 表；颜色用 Graphite 涨跌色，不用 TV 的蓝。
// 评级变化的刷新动效走共用层 lib/live.ts：档位升了（偏买）闪涨色、降了闪跌色；买 / 卖个数变了与明细里的单项结论变了同理，档位与结论都按「卖 < 中性 < 买」当序数比。
// 样子（用户 2026-11-15 的校准）：表格手感取 TradingView（无衬线 tabular-nums、右对齐、极淡分隔线、悬停整行提亮、纯文字加低饱和胶囊），
// 卡片结构取 Arc（读数在上、明细在下、组间留白），不加工业装饰；颜色走涨跌语义色与中性灰，不用橙色。放在 PanelFrame 里用。

export type RatingVerdict = 'sell' | 'neutral' | 'buy'

export type RatingGroup = {
  key: string
  label: string
  /** −1（强卖）到 1（强买）。 */
  value: number
  counts: Record<RatingVerdict, number>
}

export type RatingRow = {
  key: string
  name: string
  /** 属于哪一组（RatingGroup.key）；明细按组分节。不给的归到最后一节、不写节名。 */
  group?: string
  /** 读数，调用方写好的文字（「54.20」）；没有写「—」。 */
  reading?: string
  verdict: RatingVerdict
}

export type PivotRow = {
  key: string
  /** 行名（R3、R2、R1、P、S1、S2、S3）。 */
  label: string
  /** 与 PivotTable.columns 一一对应；没有值写 null / undefined，画「—」。 */
  values: readonly (string | null | undefined)[]
}

export type PivotTable = {
  title: string
  /** 列名（Classic、Fibonacci、Camarilla、Woodie、DM）。 */
  columns: readonly string[]
  rows: readonly PivotRow[]
}

export type TechnicalRatingTimeframe = { value: string; label: string }

export type TechnicalRatingLabels = {
  /** 五档的名字，从卖到买（强卖、卖、中性、买、强买）：刻度文字与仪表下的大字都用它。 */
  zones: readonly [string, string, string, string, string]
  /** 卖 / 中性 / 买：个数行与明细里的单项结论。 */
  verdict: Record<RatingVerdict, string>
  /** 仪表下的指标总数，例「共 26 项指标」。 */
  total: (n: number) => string
  columns: { name: string; reading: string; verdict: string }
  /** 时间周期分段控件的读屏名。 */
  timeframe: string
  /** 整件的读屏名。 */
  list: string
  empty: string
}

export type TechnicalRatingProps = {
  groups: readonly RatingGroup[]
  /** 指标明细，不给就只画仪表。 */
  rows?: readonly RatingRow[]
  labels: TechnicalRatingLabels
  /** 放大居中的那一组（总评）的 key；不给取中间那一组。 */
  primary?: string
  /** 枢轴点表（整宽，放在明细表下面）；不给就不画。读数由调用方算。 */
  pivots?: PivotTable
  /** Timeframe choices of the switch above the gauges; no switch when omitted. */
  timeframes?: readonly TechnicalRatingTimeframe[]
  /** Selected timeframe value (controlled); the first one when omitted. */
  value?: string
  /** Called with the timeframe value when the switch changes. */
  onValueChange?: (value: string) => void
  /** Deprecated: use value. @deprecated Use value. */
  timeframe?: string
  /** Deprecated: use onValueChange. @deprecated Use onValueChange. */
  onTimeframeChange?: (value: string) => void
  /** 免责一句，由调用方写；件只留位置。 */
  disclaimer?: ReactNode
  className?: string
}

const DASH = '—'
const SPAN = 228
const LABEL_R = 108
// viewBox 往四周让出标签的位置：x 从 −14，y 从 −16。
const VB = { x: -14, y: -16, w: SPAN, h: 130 }

const zoneMid = (index: number) => ratingAngle((RATING_BOUNDS[index]! + RATING_BOUNDS[index + 1]!) / 2)

/** 卖 < 中性 < 买 的序数：评级变化的方向就是它变大还是变小。 */
const VERDICT_ORDER: Record<RatingVerdict, number> = { sell: -1, neutral: 0, buy: 1 }

/** 评级读数：值变了闪一下（方向反过来的读数，例如卖的个数变多是偏空，用 invert）。 */
function FlashText({
  as: Tag = 'span',
  value,
  invert,
  children,
  ...rest
}: {
  as?: 'span' | 'b' | 'div'
  value: number
  invert?: boolean
  children: ReactNode
  className?: string
  'data-slot'?: string
  'data-verdict'?: string
}) {
  const { flash, key } = useValueFlash(value)
  const direction: FlashDirection | undefined =
    flash === null ? undefined : invert ? (flash === 'up' ? 'down' : 'up') : flash
  return (
    <Tag key={key} {...rest} className={cn(rest.className, 'k-live-flash')} data-flash={direction}>
      {children}
    </Tag>
  )
}

function Dial({ group, labels, primary }: { group: RatingGroup; labels: TechnicalRatingLabels; primary: boolean }) {
  const active = ratingZone(group.value)
  const { sell, neutral, buy } = group.counts
  const word = labels.zones[active]!
  return (
    <figure
      className={cn('k-trating-dial', primary && 'is-primary')}
      data-slot="rating-dial"
      data-group={group.key}
      data-zone={active}
      role="img"
      aria-label={`${group.label}: ${word} (${labels.verdict.sell} ${sell}, ${labels.verdict.neutral} ${neutral}, ${labels.verdict.buy} ${buy})`}
    >
      <figcaption className="k-trating-name">{group.label}</figcaption>
      <div className="k-trating-gauge" style={{ aspectRatio: `${VB.w} / ${VB.h}` } as CSSProperties}>
        <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} className={`k-trating-zone is-z${i}${i === active ? ' is-active' : ''}`} d={zoneArc(i)} />
          ))}
          <g transform={`translate(${GAUGE_CX} ${GAUGE_CY})`}>
            <g
              className="k-trating-needle"
              data-slot="rating-needle"
              data-angle={ratingAngle(group.value)}
              style={{ transform: `rotate(${ratingAngle(group.value)}deg)` }}
            >
              <path d="M 0 -70 L 4 0 L -4 0 Z" />
            </g>
            <circle className="k-trating-hub" r={6} />
          </g>
        </svg>
        {labels.zones.map((zone, i) => {
          // 两端的「强卖 / 强买」不画在弧旁：写出来比弧还宽、会盖住弧或被裁，两端的意思由弧色与下面的大字承担。
          if (i === 0 || i === 4) return null
          const rad = (zoneMid(i) * Math.PI) / 180
          const x = GAUGE_CX + LABEL_R * Math.sin(rad)
          const y = GAUGE_CY - LABEL_R * Math.cos(rad)
          return (
            <span
              key={zone}
              className={cn('k-trating-tick', i === active && 'is-active')}
              data-slot="rating-tick"
              data-zone={i}
              style={{ left: `${((x - VB.x) / VB.w) * 100}%`, top: `${((y - VB.y) / VB.h) * 100}%` }}
            >
              {zone}
            </span>
          )
        })}
      </div>
      <FlashText as="div" value={active} className="k-trating-word" data-slot="rating-word">
        {word}
      </FlashText>
      <div className="k-trating-counts" data-slot="rating-counts">
        {(['sell', 'neutral', 'buy'] as const).map((v) => (
          <span key={v} data-verdict={v}>
            <small>{labels.verdict[v]}</small>
            {v === 'neutral' ? (
              <b>{group.counts[v]}</b>
            ) : (
              <FlashText as="b" value={group.counts[v]} invert={v === 'sell'}>
                {group.counts[v]}
              </FlashText>
            )}
          </span>
        ))}
      </div>
      <div className="k-trating-total">{labels.total(sell + neutral + buy)}</div>
    </figure>
  )
}

export function TechnicalRating({
  groups,
  rows = [],
  labels,
  primary,
  pivots,
  timeframes,
  value,
  onValueChange,
  timeframe: legacyTimeframe,
  onTimeframeChange,
  disclaimer,
  className,
}: TechnicalRatingProps) {
  if (groups.length === 0) {
    return (
      <div className={cn('k-trating', className)} data-slot="technical-rating" role="status">
        <p className="k-trating-empty">{labels.empty}</p>
      </div>
    )
  }
  const primaryKey = groups.find((g) => g.key === primary)?.key ?? groups[Math.floor((groups.length - 1) / 2)]!.key
  const known = new Set(groups.map((g) => g.key))
  const sections: { key: string; label?: string; rows: RatingRow[] }[] = groups
    .map((g) => ({ key: g.key, label: g.label, rows: rows.filter((r) => r.group === g.key) }))
    .filter((s) => s.rows.length > 0)
  const loose = rows.filter((r) => !r.group || !known.has(r.group))
  if (loose.length > 0) sections.push({ key: '', rows: loose })

  return (
    <div className={cn('k-trating', className)} data-slot="technical-rating" role="group" aria-label={labels.list}>
      {timeframes && timeframes.length > 0 ? (
        <div className="k-trating-bar" data-slot="rating-timeframe">
          <ToggleGroup
            variant="sm"
            aria-label={labels.timeframe}
            value={value ?? legacyTimeframe ?? timeframes[0]!.value}
            onValueChange={(next) => next && (onValueChange ?? onTimeframeChange)?.(next)}
          >
            {timeframes.map((tf) => (
              <ToggleGroupItem key={tf.value} value={tf.value}>
                {tf.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
      <div className="k-trating-dials" data-slot="rating-dials">
        {groups.map((group) => (
          <Dial key={group.key} group={group} labels={labels} primary={group.key === primaryKey} />
        ))}
      </div>
      {disclaimer ? (
        <p className="k-trating-disclaimer" data-slot="rating-disclaimer">
          {disclaimer}
        </p>
      ) : null}
      {sections.length > 0 ? (
        <div className="k-trating-tables" data-slot="rating-table">
          {sections.map((section) => (
            <section key={section.key} className="k-trating-card" data-slot="rating-section" data-group={section.key}>
              {section.label ? (
                <h3 className="k-trating-card-title">
                  {section.label}
                  <span className="k-trating-chev" aria-hidden="true">
                    ›
                  </span>
                </h3>
              ) : null}
              <table className="k-trating-table" aria-label={section.label ?? labels.list}>
                <thead>
                  <tr>
                    <th scope="col">{labels.columns.name}</th>
                    <th scope="col" className="is-num">
                      {labels.columns.reading}
                    </th>
                    <th scope="col" className="is-end">
                      {labels.columns.verdict}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.key} className="k-trating-row" data-slot="rating-row" data-verdict={row.verdict}>
                      <th scope="row">{row.name}</th>
                      <td className="is-num">{row.reading ?? DASH}</td>
                      <td className="is-end">
                        <FlashText
                          value={VERDICT_ORDER[row.verdict]}
                          className="k-trating-verdict"
                          data-slot="rating-verdict"
                          data-verdict={row.verdict}
                        >
                          {labels.verdict[row.verdict]}
                        </FlashText>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      ) : null}
      {pivots ? (
        <section className="k-trating-card is-wide" data-slot="rating-pivots">
          <h3 className="k-trating-card-title">
            {pivots.title}
            <span className="k-trating-chev" aria-hidden="true">
              ›
            </span>
          </h3>
          <table className="k-trating-table is-pivots" aria-label={pivots.title}>
            <thead>
              <tr>
                <th scope="col" aria-label={pivots.title} />
                {pivots.columns.map((c) => (
                  <th key={c} scope="col" className="is-num">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pivots.rows.map((row) => (
                <tr key={row.key} className="k-trating-row" data-slot="pivot-row">
                  <th scope="row">{row.label}</th>
                  {pivots.columns.map((c, i) => (
                    <td key={c} className="is-num">
                      {row.values[i] ?? DASH}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  )
}
