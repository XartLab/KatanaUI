// SPDX-License-Identifier: MIT
/**
 * Experiment card: a few variants measured the same way, a metric switch, the change against the baseline, and a winner pick.
 * 实验卡（KATANAview #1908 第一批）：两到五组参数或两个策略的回测对比。头一行标题、状态、小注；指标切换（只有一个指标时不画）；
 * 每个变体一行：徽标字母、名字（基准、领先各一个小标）、当前指标的值、一根值条、相对基准的变化（好坏色加箭头）、样本数与置信度；
 * 点一行（或 Space）选为胜者，再点一次撤回；选了胜者底栏出动作按钮（如「采用参数 B」）。
 * 功能参照 affectUI 的 Experiment Card（affectui.com/components/experiment-card，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：卡一直展开，不做「悬停才展开」：交易台上对比结果要一眼看到，多一次悬停是成本。
 * 指标方向（越大越好、越小越好）与数值写法由调用方给；包里不带语言。纯逻辑在 experiment-model.ts。
 */
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'
import { Button } from '../primitives/button.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import {
  baselineOf,
  changeVerdict,
  leaderOf,
  relativeChange,
  type ExperimentMetric,
  type ExperimentVariant,
} from './experiment-model.ts'

/** Texts of ExperimentCard (the package ships no text). */
export type ExperimentCardLabels = {
  /** Accessible name of the metric switch. */
  metric: string
  /** Accessible name of the variant list. */
  variants: string
  /** Small tag on the baseline row (「基准」). */
  baseline: string
  /** Small tag on the row ahead on the current metric (「领先」). */
  leader: string
  /** Tray text before anything is picked (「选一个胜者」). */
  hint: string
  /** Tray text while a row is hovered (「预览 B：夏普 1.42」). */
  preview: (variant: ExperimentVariant, value: string) => string
  /** Tray text once a winner is picked (「已选 B」). */
  picked: (variant: ExperimentVariant) => string
  /** Label of the action button (「采用参数 B」). */
  action: (variant: ExperimentVariant) => string
  /** Sample size text (「312 笔」). */
  samples: (count: number) => string
  /** Confidence text (「置信 95%」). */
  confidence: (confidence: number) => string
  /** Value text when a metric was not measured. */
  missing: string
  /** Text when there are no variants. */
  empty: string
}

export type ExperimentCardProps = {
  /** Card title. */
  title: ReactNode
  /** Accessible name of the card. */
  label: string
  /** Variants in display order; the one marked control (or the first) is the baseline. */
  variants: readonly ExperimentVariant[]
  /** Metrics the variants were measured on. */
  metrics: readonly ExperimentMetric[]
  /** Controlled metric id. */
  metric?: string
  /** Metric id shown first when uncontrolled; defaults to the first metric. */
  defaultMetric?: string
  /** Called when the metric switch changes. */
  onMetricChange?: (metricId: string) => void
  /** Controlled winner id; null when nothing is picked. */
  winner?: string | null
  /** Winner id picked first when uncontrolled. */
  defaultWinner?: string | null
  /** Called with the new winner id, or null when the pick is withdrawn. */
  onWinnerChange?: (winnerId: string | null) => void
  /** Called when the action button of the picked winner is pressed; omit to show no button. */
  onAction?: (variant: ExperimentVariant) => void
  /** Status tag next to the title, such as running or finished. */
  status?: { label: string; tone: Severity }
  /** Short note next to the status, such as the sample period. */
  note?: ReactNode
  /** How the change against the baseline is written; defaults to a signed percent with one decimal. */
  formatChange?: (change: number) => string
  /** Texts. */
  labels: ExperimentCardLabels
  /** Source line under the card. */
  source?: string
  /** Extra class name on the root. */
  className?: string
}

const defaultChange = (change: number) =>
  `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change * 100).toFixed(1)}%`

export function ExperimentCard({
  title,
  label,
  variants,
  metrics,
  metric: metricProp,
  defaultMetric,
  onMetricChange,
  winner: winnerProp,
  defaultWinner = null,
  onWinnerChange,
  onAction,
  status,
  note,
  formatChange = defaultChange,
  labels,
  source,
  className,
}: ExperimentCardProps) {
  const [innerMetric, setInnerMetric] = useState(defaultMetric ?? metrics[0]?.id ?? '')
  const [innerWinner, setInnerWinner] = useState<string | null>(defaultWinner)
  const [hover, setHover] = useState<string | null>(null)
  const metricId = metricProp ?? innerMetric
  const metric = metrics.find((item) => item.id === metricId) ?? metrics[0]
  const winnerId = winnerProp !== undefined ? winnerProp : innerWinner
  const winner = variants.find((variant) => variant.id === winnerId) ?? null
  const format = metric?.format ?? String

  const setMetric = (next: string) => {
    if (!next || next === metricId) return
    if (metricProp === undefined) setInnerMetric(next)
    onMetricChange?.(next)
  }
  const toggleWinner = (id: string) => {
    const next = winnerId === id ? null : id
    if (winnerProp === undefined) setInnerWinner(next)
    onWinnerChange?.(next)
  }

  const base = baselineOf(variants)
  const leader = metric ? leaderOf(variants, metric) : null
  const values = metric ? variants.map((variant) => variant.values[metric.id]) : []
  const top = Math.max(
    0,
    ...values.map((value) => (typeof value === 'number' && Number.isFinite(value) ? Math.abs(value) : 0)),
  )
  const hovered = variants.find((variant) => variant.id === hover) ?? null
  const valueText = (variant: ExperimentVariant) => {
    const value = metric ? variant.values[metric.id] : null
    return typeof value === 'number' && Number.isFinite(value) ? format(value) : labels.missing
  }

  return (
    <section className={cn('k-xp', className)} data-slot="experiment-card" aria-label={label}>
      <header className="k-xp-head">
        <h4 className="k-xp-title">{title}</h4>
        {status !== undefined && (
          <span className="k-xp-status" data-slot="experiment-status" data-tone={status.tone}>
            {status.label}
          </span>
        )}
        {note !== undefined && <span className="k-xp-note">{note}</span>}
      </header>
      {metrics.length > 1 && (
        <ToggleGroup size="sm" aria-label={labels.metric} value={metricId} onValueChange={setMetric}>
          {metrics.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {variants.length === 0 ? (
        <p className="k-xp-empty">{labels.empty}</p>
      ) : (
        <div className="k-xp-rows" role="radiogroup" aria-label={labels.variants} onPointerLeave={() => setHover(null)}>
          {variants.map((variant) => {
            const value = metric ? variant.values[metric.id] : null
            const isBase = variant.id === base?.id
            const change = isBase || !metric ? null : relativeChange(value, base?.values[metric.id])
            const verdict = changeVerdict(change, metric?.lowerIsBetter)
            const width = typeof value === 'number' && Number.isFinite(value) && top > 0 ? Math.abs(value) / top : 0
            const meta = [
              variant.samples === undefined ? null : labels.samples(variant.samples),
              variant.confidence === undefined ? null : labels.confidence(variant.confidence),
            ].filter((item) => item !== null)
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={variant.id === winnerId}
                className="k-xp-row"
                data-slot="experiment-variant"
                data-id={variant.id}
                data-control={isBase ? '' : undefined}
                data-leader={variant.id === leader?.id ? '' : undefined}
                onClick={() => toggleWinner(variant.id)}
                onPointerEnter={() => setHover(variant.id)}
                onFocus={() => setHover(variant.id)}
                onBlur={() => setHover(null)}
              >
                <span className="k-xp-badge" aria-hidden="true">
                  {variant.badge}
                </span>
                <span className="k-xp-name">
                  {variant.name}
                  {isBase && <small data-tag="baseline">{labels.baseline}</small>}
                  {variant.id === leader?.id && <small data-tag="leader">{labels.leader}</small>}
                </span>
                <span className="k-xp-value" data-slot="experiment-value">
                  {valueText(variant)}
                </span>
                <span className="k-xp-bar" aria-hidden="true">
                  <i style={{ width: `${width * 100}%` }} />
                </span>
                <span className="k-xp-change" data-slot="experiment-change" data-verdict={verdict}>
                  {change === null ? null : (
                    <>
                      {verdict === 'better' ? (
                        <ArrowUpIcon aria-hidden="true" />
                      ) : verdict === 'worse' ? (
                        <ArrowDownIcon aria-hidden="true" />
                      ) : null}
                      {formatChange(change)}
                    </>
                  )}
                </span>
                {meta.length > 0 && <span className="k-xp-meta">{meta.join(' · ')}</span>}
              </button>
            )
          })}
        </div>
      )}
      <footer className="k-xp-tray" data-slot="experiment-tray">
        <span aria-live="polite">
          {winner !== null
            ? labels.picked(winner)
            : hovered !== null
              ? labels.preview(hovered, valueText(hovered))
              : labels.hint}
        </span>
        {winner !== null && onAction !== undefined && (
          <Button size="sm" variant="primary" data-slot="experiment-action" onClick={() => onAction(winner)}>
            {labels.action(winner)}
          </Button>
        )}
      </footer>
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </section>
  )
}
