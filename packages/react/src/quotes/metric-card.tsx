// SPDX-License-Identifier: MIT
// 指标卡 MetricCard 与卡片墙 MetricCardGrid（#30）：标题、大号当前值、较前日 / 周 / 月 / 年的变化、迷你走势线（分段切 1 月 / 3 月 / 6 月 / 1 年）、
// 可选阶段带（如 极度恐惧…极度贪婪，边界与文案由调用方给）、来源与更新时间一行。
// 结构参照 uiarc 的 Metric explorer（uiarc.dev，2026-11-15 读，只取结构：标题加大数、变化行、走势线加分段、来源行），实现原创。
// 走势线复用 quotes/sparkline 的 Sparkline，分段控件复用 ToggleGroup，变化复用 ChangeText；组件只画不算，数据与文字都由调用方传，没有数据就是空态。
// 实时刷新：大号当前值变了闪涨跌色（ReadoutFlash），走势线新点追加时由 Sparkline 平滑延伸；换区间不做过场。
// 颜色：涨跌色只给变化与走势线；阶段带是从跌色到涨色的渐变加中间灰（类别靠文字，不只靠颜色），不用橙色画数据，不用蓝。
// 读数壳（2026-11-18，体检 §1）：MetricCard 是报价类读数卡的共用壳，字段统一 label / value / unit / changePct（+ 多段 changes）；
// variant="tile" 是原来的 SparkTile（KPI 瓦片，metric-tile.tsx，DOM 与样子照旧），SparkTile 留作兼容的旧名。数值一格两种外观共用 ReadoutValue。
import { createContext, useContext, useState, type AriaAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { ChangeText } from './change-text.tsx'
import { MetricTile, type SparkTileState } from './metric-tile.tsx'
import type { QuoteTone } from './quote-tone.ts'
import { ReadoutValue } from './readout-value.tsx'
import { Sparkline, sparkTone } from './sparkline.tsx'

export type MetricChange = {
  /** Stable id of the change row. */
  id?: string
  /** Deprecated: use id. @deprecated Use id. */
  key?: string
  /** Label such as "vs yesterday", written by the caller. */
  label: string
  /** Change as a percentage (1.5 means 1.5%); null writes an em dash. */
  value: number | null
}

export type MetricRange = {
  /** Stable id of the range (the value of the range switch). */
  id?: string
  /** Deprecated: use id. @deprecated Use id. */
  key?: string
  /** Text on the range button (1M). */
  label: string
  /** Values of this range, oldest to newest; fewer than two draws a dash. */
  values: readonly number[]
}

const rangeId = (r: { id?: string; key?: string; label: string }) => r.id ?? r.key ?? r.label

/** 走势线着色：direction 头尾涨跌（涨绿跌红）；neutral 中性灰白线（恐惧贪婪这类没有好坏方向的）；inverse 涨是坏（如 VIX），涨取跌色、跌取涨色。 */
export type MetricTrendTone = 'direction' | 'neutral' | 'inverse'

const FLIP: Record<QuoteTone, QuoteTone> = { up: 'down', down: 'up', flat: 'flat' }

/** 走势线的三态色：按 trendTone 与这一段的头尾。纯函数。 */
export function metricTrendTone(trend: MetricTrendTone, values: readonly number[]): QuoteTone {
  if (trend === 'neutral') return 'flat'
  const t = sparkTone(values)
  return trend === 'inverse' ? FLIP[t] : t
}

export type MetricStage = {
  label: string
  /** 这一档的下界与上界（跟 current 同一个单位）；最后一档的上界算在内。 */
  from: number
  to: number
}

/** 当前值落在哪一档：从低到高第一个 from ≤ value < to，最后一档含上界；落在所有档外返回 -1。纯函数。 */
export function metricStageIndex(stages: readonly MetricStage[], value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) return -1
  const last = stages.length - 1
  return stages.findIndex((s, i) => value >= s.from && (value < s.to || (i === last && value <= s.to)))
}

type SharedRange = { range: string }
const SharedRangeContext = createContext<SharedRange | null>(null)

export type MetricCardLabels = {
  /** Accessible name of the range switch (card). */
  range?: string
  /** Accessible name of the trend line, a whole sentence. */
  spark: string
}

export type MetricCardProps = AriaAttributes &
  Partial<Record<`data-${string}`, string>> & {
    /** card is the full metric card; tile is the compact KPI tile (formerly SparkTile). */
    variant?: 'card' | 'tile'
    /** Title of the readout (the card heading or the tile's dot-matrix tag). */
    label?: string
    /** Deprecated: use label. @deprecated Use label. */
    title?: string
    /** Formatted current value; null when there is no data. */
    value: string | null
    /** Small text after the value. */
    unit?: string
    /** Tile: when given the changed digits roll like an odometer. */
    rollValue?: number
    /** One change as a percentage (1.5 means 1.5%); the tile shows it beside note. */
    changePct?: number
    /** Card: several changes (vs day / week / month / year). */
    changes?: readonly MetricChange[]
    /** Trend values, oldest to newest: the tile's line, or the card's line when there are no ranges. */
    series?: readonly number[]
    /** Card: trend ranges (1M / 3M / 6M / 1Y); one range draws no switch. */
    ranges?: readonly MetricRange[]
    /** Card: the current range id (controlled). */
    range?: string
    /** Card: the initial range id. */
    defaultRange?: string
    /** Card: called with the range id when it changes. */
    onRangeChange?: (id: string) => void
    /** How the line is colored: card direction / neutral / inverse, tile series / neutral. */
    trendTone?: MetricTrendTone | 'series'
    /** Accessible texts. */
    labels?: MetricCardLabels
    /** Deprecated: use labels.range. @deprecated Use labels.range. */
    rangeLabel?: string
    /** Deprecated: use labels.spark. @deprecated Use labels.spark. */
    sparkLabel?: string
    /** Card: stage band from low to high; current is the raw value in the same unit. */
    stages?: readonly MetricStage[]
    /** Card: raw current value placed on the stage band. */
    current?: number
    /** Card: source line. */
    source?: ReactNode
    /** Card: update time line. */
    updatedAt?: ReactNode
    /** Tile: threshold in the series unit, drawn as an amber dashed line. */
    threshold?: number
    /** Tile: normal, near or over the threshold; also write it in note. */
    status?: SparkTileState
    /** Tile: small text beside the change; near and over must say it here, not only by color. */
    note?: ReactNode
    /** Tile: when given the whole tile is a button. */
    onSelect?: () => void
    /** Extra class name on the root. */
    className?: string
  }

function StageBand({ stages, current }: { stages: readonly MetricStage[]; current?: number }) {
  const active = metricStageIndex(stages, current)
  const lo = stages[0]!.from
  const hi = stages[stages.length - 1]!.to
  const span = hi - lo || 1
  const mark = current === undefined || active < 0 ? null : ((current - lo) / span) * 100
  const n = stages.length
  return (
    <div className="k-metric-stages" data-slot="metric-stages">
      <div className="k-metric-band" role="img" aria-label={active < 0 ? undefined : stages[active]!.label}>
        {stages.map((stage, i) => (
          <i
            key={stage.label}
            className={cn('k-metric-seg', i === active && 'is-active')}
            data-stage={i}
            style={{
              flexGrow: stage.to - stage.from || 1,
              // 第 i 档在 0…1 上的位置：0 是跌色，1 是涨色，中间落到灰。
              ['--stage-t' as string]: n === 1 ? 0.5 : i / (n - 1),
            }}
          />
        ))}
        {mark !== null ? (
          <b className="k-metric-mark" style={{ left: `${Math.min(100, Math.max(0, mark))}%` }} />
        ) : null}
      </div>
      <div className="k-metric-stage-names">
        <span>{stages[0]!.label}</span>
        <strong data-slot="metric-stage" className="k-metric-stage-now">
          {active < 0 ? '—' : stages[active]!.label}
        </strong>
        <span>{stages[n - 1]!.label}</span>
      </div>
    </div>
  )
}

export function MetricCard({
  variant = 'card',
  label,
  title,
  value,
  unit,
  rollValue,
  changePct,
  changes,
  series,
  ranges: givenRanges,
  range,
  defaultRange,
  onRangeChange,
  trendTone,
  labels,
  rangeLabel,
  sparkLabel,
  stages,
  current,
  source,
  updatedAt,
  threshold,
  status = 'normal',
  note,
  onSelect,
  className,
  ...rest
}: MetricCardProps) {
  const heading = label ?? title ?? ''
  const spark = labels?.spark ?? sparkLabel ?? ''
  const ranges = givenRanges ?? (series ? [{ id: 'all', label: '', values: series }] : undefined)
  const [inner, setInner] = useState(defaultRange ?? (ranges?.[0] ? rangeId(ranges[0]) : undefined))
  // 卡片墙给了共用区间：跟着它走，也不再自己画分段控件。
  const shared = useContext(SharedRangeContext)
  if (variant === 'tile')
    return (
      <MetricTile
        {...rest}
        label={heading}
        value={value}
        unit={unit}
        rollValue={rollValue}
        series={series ?? ranges?.[0]?.values ?? []}
        sparkLabel={spark}
        trendTone={trendTone === 'neutral' ? 'neutral' : 'series'}
        threshold={threshold}
        status={status}
        changePct={changePct}
        note={note}
        onSelect={onSelect}
        className={className}
      />
    )
  const key = shared?.range ?? range ?? inner
  const shown = ranges?.find((r) => rangeId(r) === key) ?? ranges?.[0]
  const tone: MetricTrendTone = trendTone === 'series' || trendTone === undefined ? 'direction' : trendTone
  const allChanges = changes ?? (changePct === undefined ? undefined : [{ id: 'change', label: '', value: changePct }])
  return (
    <article {...rest} className={cn('k-metric', className)} data-slot="metric-card" aria-label={heading}>
      <header className="k-metric-head">
        <h3 className="k-metric-title">{heading}</h3>
        {!shared && ranges && ranges.length > 1 ? (
          <ToggleGroup
            variant="sm"
            aria-label={labels?.range ?? rangeLabel}
            value={shown ? rangeId(shown) : null}
            onValueChange={(next) => {
              if (!next) return
              setInner(next)
              onRangeChange?.(next)
            }}
          >
            {ranges.map((r) => (
              <ToggleGroupItem key={rangeId(r)} value={rangeId(r)}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </header>
      <ReadoutValue as="div" className="k-metric-value" slot="metric-value" value={value} unit={unit} />
      {allChanges && allChanges.length > 0 ? (
        <dl className="k-metric-changes" data-slot="metric-changes">
          {allChanges.map((c) => (
            <div key={rangeId(c)} className="k-metric-change">
              <dt>{c.label}</dt>
              <dd>{c.value === null ? '—' : <ChangeText value={c.value} arrow flash />}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {shown ? (
        <div className="k-metric-spark" data-slot="metric-spark">
          <Sparkline values={shown.values} label={spark} tone={metricTrendTone(tone, shown.values)} />
        </div>
      ) : null}
      {stages && stages.length > 0 ? <StageBand stages={stages} current={current} /> : null}
      {source || updatedAt ? (
        <footer className="k-metric-foot" data-slot="metric-foot">
          {source ? <span>{source}</span> : null}
          {updatedAt ? <span>{updatedAt}</span> : null}
        </footer>
      ) : null}
    </article>
  )
}

export type MetricCardGridProps = {
  children: ReactNode
  /** 每张卡的最小宽（px），一行放几张由容器宽决定。 */
  minWidth?: number
  /** 整墙的读屏名。 */
  label: string
  /** 共用的区间分段（放在墙顶上一次）：传了它，卡片不再各画各的分段控件，所有卡按它的 key 取自己 ranges 里同 key 的一段。 */
  ranges?: readonly { id?: string; /** Deprecated: use id. @deprecated Use id. */ key?: string; label: string }[]
  range?: string
  defaultRange?: string
  onRangeChange?: (key: string) => void
  /** 共用分段控件的读屏名。 */
  rangeLabel?: string
  className?: string
}

export function MetricCardGrid({
  children,
  minWidth = 260,
  label,
  ranges,
  range,
  defaultRange,
  onRangeChange,
  rangeLabel,
  className,
}: MetricCardGridProps) {
  const [inner, setInner] = useState(defaultRange ?? (ranges?.[0] ? rangeId(ranges[0]) : undefined))
  const key = range ?? inner
  const wall = (
    <div
      className={cn('k-metric-grid', className)}
      data-slot="metric-card-grid"
      role="group"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }}
    >
      {children}
    </div>
  )
  if (!ranges || ranges.length === 0 || key === undefined) return wall
  return (
    <SharedRangeContext.Provider value={{ range: key }}>
      <div className="k-metric-wall" data-slot="metric-wall">
        <div className="k-metric-wall-bar" data-slot="metric-wall-range">
          <ToggleGroup
            variant="sm"
            aria-label={rangeLabel}
            value={key}
            onValueChange={(next) => {
              if (!next) return
              setInner(next)
              onRangeChange?.(next)
            }}
          >
            {ranges.map((r) => (
              <ToggleGroupItem key={rangeId(r)} value={rangeId(r)}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {wall}
      </div>
    </SharedRangeContext.Provider>
  )
}
