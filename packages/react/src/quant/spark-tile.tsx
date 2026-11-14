// SPDX-License-Identifier: MIT
// KPI 瓦片（组件卡 SparkTile，2026-11-14 读 design/katana-console/project/components/SparkTile）：点阵标签 + LCD 数值 + 24px 迷你折线 + 一行变化。
// bg-200 单元格 + hairline；迷你线 1.5px series-1（trendTone 为 neutral 时 ink-300，表示「越低越好」的指标），末点 signal-orange；
// 有阈值画 1px signal-amber 虚线；接近阈值（near）边框转 signal-orange-dim、变化行转 amber，并脉冲一次。迷你线不画轴、不画网格、不标数值。
// 悬停迷你线出 LCD tooltip（时间、值）；一行最多 5 个由调用方的布局定。数值变化用数字滚动（RollingText）。
import type { CSSProperties } from 'react'
import { cn } from '../lib/cn'
import { useScrubber } from '../lib/use-scrubber'
import { RollingText } from '../katana/rolling-text'
import { EndMarker } from './chart-kit/end-marker'
import { LcdTooltip } from './chart-kit/lcd-tooltip'
import { linePath, makePlot, pct, PLOT_W } from './series-geometry'

const SPARK_H = 24

export type SparkTileProps = {
  /** 点阵标签（大写短码）。 */
  label: string
  /** 数值的显示文字；number 给 RollingText 判涨跌方向。没有数据传 null，显示「—」。 */
  text: string | null
  value: number | null
  /** 数值后的小字单位（「/月」「/ 150%」）。 */
  unit?: string
  /** 迷你线的数，从旧到新；少于两个数就不画。 */
  series?: readonly number[]
  /** 每个点的时间标签（悬停 tooltip 用），与 series 等长；不给 tooltip 只写值。 */
  pointLabels?: readonly string[]
  /** tooltip 里值的写法；不给用 text 的格式不可得，所以由调用方给。 */
  formatPoint?: (value: number) => string
  /** 变化行文字。 */
  delta?: string
  /** 变化行颜色：up / down 用 pnl 色（只给数字），muted 是 ink-300，warn 是 amber。 */
  deltaTone?: 'up' | 'down' | 'muted' | 'warn'
  /** 上限 / 下限的数；画 amber 虚线，迷你线的范围会把它包进来。 */
  threshold?: number
  /** 接近阈值：边框转 signal-orange-dim、变化行转 amber、脉冲一次。 */
  near?: boolean
  /** series：迷你线用 series-1；neutral：ink-300（越低越好的指标）。 */
  trendTone?: 'series' | 'neutral'
  /** 点击瓦片（打开该指标的完整图）；给了就渲染成按钮。 */
  onOpen?: () => void
  /** 这张瓦片展开着一个图面板（aria-expanded）：边框转强调色。 */
  expanded?: boolean
  /** 写在根上的 data-key，给父级的测试与联动认哪一张。 */
  dataKey?: string
  /** 迷你线的读屏名（整句）。 */
  seriesLabel: string
  className?: string
}

export function SparkTile({
  label,
  text,
  value,
  unit,
  series = [],
  pointLabels,
  formatPoint,
  delta,
  deltaTone = 'muted',
  threshold,
  near = false,
  trendTone = 'series',
  onOpen,
  expanded,
  dataKey,
  seriesLabel,
  className,
}: SparkTileProps) {
  const drawn = series.length >= 2
  const scrub = useScrubber({ count: series.length, mode: 'point' })
  const range: [number, number] = [
    Math.min(...series, ...(threshold === undefined ? [] : [threshold])),
    Math.max(...series, ...(threshold === undefined ? [] : [threshold])),
  ]
  const plot = makePlot(series.length, range, { height: SPARK_H, padTop: 3, padBottom: 3, exact: true })
  const last = series.length - 1
  const at = scrub.index
  const Tile = onOpen === undefined ? 'div' : 'button'
  return (
    <Tile
      className={cn('k-spark-tile', className)}
      data-slot="spark-tile"
      data-near={near ? 'true' : undefined}
      data-key={dataKey}
      data-expanded={expanded ? 'true' : undefined}
      aria-expanded={onOpen === undefined ? undefined : (expanded ?? false)}
      type={onOpen === undefined ? undefined : 'button'}
      onClick={onOpen}
    >
      <span className="k-spark-tile-label">{label}</span>
      <span className="k-spark-tile-value" data-empty={text === null ? 'true' : undefined}>
        {text === null || value === null ? '—' : <RollingText text={text} value={value} animate />}
        {unit === undefined ? null : <span className="k-spark-tile-unit">{unit}</span>}
      </span>
      {drawn ? (
        <span
          className="k-spark-tile-plot"
          data-trend={trendTone}
          role="img"
          aria-label={seriesLabel}
          style={{ '--k-spark-h': `${SPARK_H}px` } as CSSProperties}
          {...scrub.pointer}
        >
          <svg viewBox={`0 0 ${PLOT_W} ${SPARK_H}`} preserveAspectRatio="none" aria-hidden="true">
            {threshold === undefined ? null : (
              <line
                className="k-spark-tile-threshold"
                x1={0}
                x2={PLOT_W}
                y1={plot.yAt(threshold)}
                y2={plot.yAt(threshold)}
              />
            )}
            <path className="k-spark-tile-line" d={linePath(series, plot)} />
          </svg>
          <EndMarker x={plot.xAt(at ?? last)} y={plot.yAt(series[at ?? last]!)} />
          {at === null ? null : (
            <LcdTooltip
              style={{ left: pct(plot.xAt(at)), top: 0 }}
              side={at > last / 2 ? 'left' : 'right'}
              title={pointLabels?.[at]}
              rows={[{ key: 'v', label: label, value: formatPoint ? formatPoint(series[at]!) : String(series[at]) }]}
            />
          )}
        </span>
      ) : (
        <span className="k-spark-tile-plot" aria-hidden="true" />
      )}
      <span className="k-spark-tile-delta" data-tone={near ? 'warn' : deltaTone}>
        {delta ?? ' '}
      </span>
    </Tile>
  )
}
