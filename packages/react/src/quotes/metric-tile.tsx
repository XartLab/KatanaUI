// SPDX-License-Identifier: MIT
// MetricCard 的瓦片外观（variant="tile"，原组件卡 SparkTile：design/katana-console/project/components/SparkTile，#1929）。
// KPI 瓦片：点阵小标签 + LCD 数值 + 24px 迷你折线 + 一行变化说明。迷你线的折点与纵坐标用 quotes/sparkline 的 sparkCoords、sparkY，所以阈值线与折线落在同一个刻度上。
// 实时刷新：数值变了闪涨跌色（有 rollValue 的走 RollingText 的滚轮加闪），新点追加时线平滑延伸、末点放一圈光晕闪一次（共用层 lib/live-*.ts）。
// 数据全由调用方给（数组、当前值、变化）：没有数据就是空态（数值「—」、线的位置写「—」），不补样本。文案（标签、说明、读屏名）一律由调用方传，包里不写。
import { useRef, type AriaAttributes, type ReactNode } from 'react'
import { useLineExtend } from '../lib/live-line.ts'
import { useValueFlash } from '../lib/live.ts'
import { ChangeText } from './change-text.tsx'
import { ReadoutValue } from './readout-value.tsx'
import { pointsText, sparkCoords, sparkY } from './sparkline.tsx'

const W = 100
const H = 24

/** normal 平常；near 接近阈值（边框转暗橙，说明转琥珀）；over 越过阈值（同 near，另有一次脉冲在 CSS 里：状态一变就播一遍）。 */
export type SparkTileState = 'normal' | 'near' | 'over'

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

export type MetricTileProps = AriaAttributes &
  Partial<Record<`data-${string}`, string>> & {
    label: string
    value: string | null
    unit?: string
    rollValue?: number
    series: readonly number[]
    sparkLabel: string
    trendTone: 'series' | 'neutral'
    threshold?: number
    status: SparkTileState
    changePct?: number
    note?: ReactNode
    onSelect?: () => void
    className?: string
  }

/** 瓦片本体：MetricCard variant="tile" 渲染它；DOM 与类名照旧（k-spark-tile*），样子不变。 */
export function MetricTile({
  label,
  value,
  unit,
  rollValue,
  series,
  sparkLabel,
  trendTone,
  threshold,
  status,
  changePct,
  note,
  onSelect,
  className,
  ...rest
}: MetricTileProps) {
  const shape = sparkTileShape(series, threshold)
  const line = useRef<SVGPolylineElement>(null)
  useLineExtend(line, 'points', series, shape?.coords ?? [], pointsText)
  // 末点的光晕：最新一点比上一点高闪涨色、低闪跌色。
  const end = useValueFlash(series[series.length - 1])
  const body = (
    <>
      <span className="k-spark-tile-tag">{label}</span>
      <ReadoutValue className="k-spark-tile-value" value={value} unit={unit} rollValue={rollValue} />
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
        {changePct === undefined ? null : <ChangeText value={changePct} arrow flash />}
        {note ? <span className="k-spark-tile-note">{note}</span> : null}
      </span>
    </>
  )
  const cls = `k-spark-tile${className ? ` ${className}` : ''}`
  return onSelect ? (
    <button type="button" {...rest} className={cls} data-state={status} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <div {...rest} className={cls} data-state={status}>
      {body}
    </div>
  )
}
