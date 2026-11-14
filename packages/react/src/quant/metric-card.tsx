// SPDX-License-Identifier: MIT
// 指标卡 MetricCard 与卡片墙 MetricCardGrid（#30）：标题、大号当前值、较前日 / 周 / 月 / 年的变化、迷你走势线（分段切 1 月 / 3 月 / 6 月 / 1 年）、
// 可选阶段带（如 极度恐惧…极度贪婪，边界与文案由调用方给）、来源与更新时间一行。
// 结构参照 uiarc 的 Metric explorer（uiarc.dev，2026-11-15 读，只取结构：标题加大数、变化行、走势线加分段、来源行），实现原创。
// 走势线复用 katana/sparkline 的 Sparkline，分段控件复用 ToggleGroup，变化复用 ChangeText；组件只画不算，数据与文字都由调用方传，没有数据就是空态。
// 颜色：涨跌色只给变化与走势线；阶段带是从跌色到涨色的渐变加中间灰（类别靠文字，不只靠颜色），不用橙色画数据，不用蓝。
import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Sparkline, sparkTone } from '../katana/sparkline.tsx'
import type { QuoteTone } from '../katana/quote-tone.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { ChangeText } from './change-text.tsx'

export type MetricChange = {
  key: string
  /** 「较前日」之类，由调用方写。 */
  label: string
  /** 变化百分数（1.5 就是 1.5%）；没有数据传 null，写「—」。 */
  value: number | null
}

export type MetricRange = {
  key: string
  /** 分段按钮上的字（1 月）。 */
  label: string
  /** 这一段的走势，从旧到新；少于两个数画不出线，写「—」。 */
  values: readonly number[]
}

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

export type MetricCardProps = {
  title: string
  /** 已格式化的当前值；没有数据传 null。 */
  value: string | null
  /** 数值后面的小字。 */
  unit?: string
  /** 较前日 / 周 / 月 / 年，想放几个放几个。 */
  changes?: readonly MetricChange[]
  /** 走势分段（1 月 / 3 月 / 6 月 / 1 年）；只给一段就不画分段控件。 */
  ranges?: readonly MetricRange[]
  /** 当前段的 key；不给用 defaultRange，再不给取第一段。给了就由调用方控制。 */
  range?: string
  defaultRange?: string
  onRangeChange?: (key: string) => void
  /** 走势线怎么着色，默认 direction。 */
  trendTone?: MetricTrendTone
  /** 分段控件与走势线的读屏名（整句）。 */
  rangeLabel: string
  sparkLabel: string
  /** 阶段带：从低到高的档；current 是当前值（原始数，跟 from / to 同一单位）。 */
  stages?: readonly MetricStage[]
  current?: number
  /** 来源与更新时间，各一段文字，由调用方写。 */
  source?: ReactNode
  updatedAt?: ReactNode
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
  title,
  value,
  unit,
  changes,
  ranges,
  range,
  defaultRange,
  onRangeChange,
  trendTone = 'direction',
  rangeLabel,
  sparkLabel,
  stages,
  current,
  source,
  updatedAt,
  className,
}: MetricCardProps) {
  const [inner, setInner] = useState(defaultRange ?? ranges?.[0]?.key)
  // 卡片墙给了共用区间：跟着它走，也不再自己画分段控件。
  const shared = useContext(SharedRangeContext)
  const key = shared?.range ?? range ?? inner
  const shown = ranges?.find((r) => r.key === key) ?? ranges?.[0]
  return (
    <article className={cn('k-metric', className)} data-slot="metric-card" aria-label={title}>
      <header className="k-metric-head">
        <h3 className="k-metric-title">{title}</h3>
        {!shared && ranges && ranges.length > 1 ? (
          <ToggleGroup
            variant="sm"
            aria-label={rangeLabel}
            value={shown?.key ?? null}
            onValueChange={(next) => {
              if (!next) return
              setInner(next)
              onRangeChange?.(next)
            }}
          >
            {ranges.map((r) => (
              <ToggleGroupItem key={r.key} value={r.key}>
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </header>
      <div className={cn('k-metric-value', value === null && 'is-empty')} data-slot="metric-value">
        {value === null ? '—' : value}
        {unit && value !== null ? <small>{unit}</small> : null}
      </div>
      {changes && changes.length > 0 ? (
        <dl className="k-metric-changes" data-slot="metric-changes">
          {changes.map((c) => (
            <div key={c.key} className="k-metric-change">
              <dt>{c.label}</dt>
              <dd>{c.value === null ? '—' : <ChangeText value={c.value} arrow />}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {shown ? (
        <div className="k-metric-spark" data-slot="metric-spark">
          <Sparkline values={shown.values} label={sparkLabel} tone={metricTrendTone(trendTone, shown.values)} />
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
  ranges?: readonly { key: string; label: string }[]
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
  const [inner, setInner] = useState(defaultRange ?? ranges?.[0]?.key)
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
              <ToggleGroupItem key={r.key} value={r.key}>
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
