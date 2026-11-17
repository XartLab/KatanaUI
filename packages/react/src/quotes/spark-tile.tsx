// SPDX-License-Identifier: MIT
// 组件卡 SparkTile（design/katana-console/project/components/SparkTile，#1929）。KPI 瓦片：点阵小标签 + LCD 数值 + 24px 迷你折线 + 一行变化说明。
// 迷你线的折点与纵坐标用 quotes/sparkline 的 sparkPoints、sparkY，所以阈值线与折线落在同一个刻度上。
// 实时刷新：数值变了闪涨跌色（有 rollValue 的走 RollingText 的滚轮加闪），新点追加时线平滑延伸、末点放一圈光晕闪一次（共用层 lib/live-*.ts）。
// 数据全由调用方给（数组、当前值、变化）：没有数据就是空态（数值「—」、线的位置写「—」），不补样本。文案（标签、说明、读屏名）一律由调用方传，包里不写。
import { useRef, type AriaAttributes, type ReactNode } from 'react'
import { pointsText, sparkCoords, sparkY } from './sparkline.tsx'
import { useLineExtend } from '../lib/live-line.ts'
import { ReadoutFlash } from '../lib/live-readout.tsx'
import { useValueFlash } from '../lib/live.ts'
import { RollingText } from '../katana/rolling-text.tsx'
import { ChangeText } from './change-text.tsx'

const W = 100
const H = 24

/** normal 平常；near 接近阈值（边框转暗橙，说明转琥珀）；over 越过阈值（同 near，另有一次脉冲在 CSS 里：状态一变就播一遍）。 */
export type SparkTileState = 'normal' | 'near' | 'over'

export type SparkTileProps = AriaAttributes &
  Partial<Record<`data-${string}`, string>> & {
    /** 点阵小标签（如 NET ASSET）。 */
    label: string
    /** 已经格式化好的数值；没有数据传 null。 */
    value: string | null
    /** 数值后面的小字（如「/月」「/ 150%」）。 */
    unit?: string
    /** 数值也想让它滚起来时给这个数（数值变了，变了的那几位像里程表一样转过去；不给就直接换字）。 */
    rollValue?: number
    /** 迷你线的数，从旧到新；少于两个数画不出线，写「—」。 */
    series: readonly number[]
    /** 读屏名（整句，含「没有数据」的说法）。 */
    sparkLabel: string
    /** series 是常态的线色（series-1）；neutral 是「越低越好」的指标（ink-300）。 */
    trendTone?: 'series' | 'neutral'
    /** 阈值（跟 series 同一个单位）：画一条琥珀虚线。 */
    threshold?: number
    state?: SparkTileState
    /** 变化百分数（1.5 就是 1.5%），写成带符号的 ChangeText，涨跌色跟 data-updown。 */
    delta?: number
    /** 变化行的小字说明（如「今日」「接近上限」）：状态不只靠颜色，near 与 over 时这里要写字。 */
    note?: ReactNode
    /** 给了就整块是个按钮（点开该指标的完整图）。 */
    onClick?: () => void
    className?: string
  }

/** 折线、末点与阈值线的几何（viewBox 0 0 100 24）：纵向按 series 与阈值一起的高低排，阈值也落在图里。数据不足时 null。纯函数。 */
export function sparkTileShape(series: readonly number[], threshold?: number) {
  if (series.length < 2) return null
  const all = threshold === undefined ? series : [...series, threshold]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const coords = sparkCoords(series, W, H, [lo, hi])
  return {
    coords,
    points: pointsText(coords),
    endY: sparkY(series[series.length - 1]!, lo, hi, H),
    thresholdY: threshold === undefined ? null : sparkY(threshold, lo, hi, H),
  }
}

export function SparkTile({
  label,
  value,
  unit,
  rollValue,
  series,
  sparkLabel,
  trendTone = 'series',
  threshold,
  state = 'normal',
  delta,
  note,
  onClick,
  className,
  ...rest
}: SparkTileProps) {
  const shape = sparkTileShape(series, threshold)
  const line = useRef<SVGPolylineElement>(null)
  useLineExtend(line, 'points', series, shape?.coords ?? [], pointsText)
  // 末点的光晕：最新一点比上一点高闪涨色、低闪跌色。
  const end = useValueFlash(series[series.length - 1])
  const body = (
    <>
      <span className="k-spark-tile-tag">{label}</span>
      <span className={`k-spark-tile-value${value === null ? ' is-empty' : ''}`}>
        {value === null ? (
          '—'
        ) : rollValue === undefined ? (
          <ReadoutFlash text={value} />
        ) : (
          <RollingText text={value} value={rollValue} animate />
        )}
        {unit && value !== null ? <small>{unit}</small> : null}
      </span>
      {shape ? (
        <span className="k-spark-tile-chart" role="img" aria-label={sparkLabel}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {shape.thresholdY !== null && (
              <line className="k-spark-tile-limit" x1="0" x2={W} y1={shape.thresholdY} y2={shape.thresholdY} />
            )}
            <polyline ref={line} className={`k-spark-tile-line is-${trendTone}`} points={shape.points} />
          </svg>
          <i
            key={end.key}
            className="k-spark-tile-halo k-live-flash"
            data-flash={end.flash ?? undefined}
            style={{ top: `${(shape.endY / H) * 100}%` }}
            aria-hidden="true"
          />
          <i className={`k-spark-tile-end is-${trendTone}`} style={{ top: `${(shape.endY / H) * 100}%` }} />
        </span>
      ) : (
        <span className="k-spark-tile-chart is-empty" role="img" aria-label={sparkLabel}>
          —
        </span>
      )}
      <span className="k-spark-tile-delta">
        {delta === undefined ? null : <ChangeText value={delta} arrow flash />}
        {note ? <span className="k-spark-tile-note">{note}</span> : null}
      </span>
    </>
  )
  const cls = `k-spark-tile${className ? ` ${className}` : ''}`
  return onClick ? (
    <button type="button" {...rest} className={cls} data-state={state} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div {...rest} className={cls} data-state={state}>
      {body}
    </div>
  )
}
