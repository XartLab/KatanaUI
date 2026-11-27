// SPDX-License-Identifier: MIT
/**
 * Cost waterfall: where an agent run's money or tokens went, step by step on a cumulative axis, with sub-agents that fold.
 * 花费瀑布（KATANAview #1908 第三批）：一次 Agent 会话的每一步（模型调用、工具调用、子 Agent）按调用次序一行，条从前面各步的累计处起、长度是这一步的花费或 token，
 * 最后一行的条尾就是合计。子 Agent 可折叠，它的数是自己的加上子步的（调用方不用预先加）；负的花费是抵扣，条往回走。
 * 头一行标题、任务、会话状态与合计；花费 / token 切换；「最贵一步」一键跳过去（展开它的上级、打开详情、聚焦）。每行写名字、种类、模型、量、时长、输入与输出 token；
 * Enter 打开这一步的详情（提示与回答，或工具的输入与输出，错误），长文本在自己的框里滚。
 * 功能参照 affectUI 的 Cost Waterfall（affectui.com/components/cost-waterfall，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 不复用 AttributionBars：它按 |贡献| 排序、折「其他」、零轴对称（组件卡明写不用瀑布），这里要守调用次序、累计基线和子 Agent 的树。
 * 复用的是链路瀑布的树键盘 moveSpan（APG 树：↑↓、→ 展开或到子、← 收起或回父、Home / End）、series 色与 niceTicks 刻度。纯逻辑在 cost-model.ts。包里不带语言。
 */
import { ChevronRightIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { assignSeries } from '../../lib/chart/chart-kit/series-colors.ts'
import { Button } from '../../primitives/button.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { moveSpan } from '../trace-waterfall/trace-model.ts'
import {
  costAxis,
  costRows,
  measure,
  priciestStep,
  runState,
  runTotals,
  type CostMode,
  type CostStep,
  type CostStepKind,
  type CostStepStatus,
} from './cost-model.ts'

/** Texts of CostWaterfall (the package ships no text). */
export type CostWaterfallLabels = {
  /** Accessible name of the mode switch, and the two modes. */
  mode: string
  cost: string
  tokens: string
  /** Kind words. */
  kind: Record<CostStepKind, string>
  /** Step status words. */
  status: Record<CostStepStatus, string>
  /** Run status words. */
  run: Record<'live' | 'done' | 'failed', string>
  /** Button that jumps to the most expensive step. */
  priciest: string
  /** Column heads. */
  name: string
  time: string
  tokensIn: string
  tokensOut: string
  /** Input and output field names in the details, per kind (task / result, prompt / response, input / output). */
  io: Record<CostStepKind, readonly [string, string]>
  /** Accessible name of the details area, and the error field. */
  details: string
  error: string
}

export type CostWaterfallProps = {
  /** Top-level steps in call order. */
  steps: readonly CostStep[]
  /** Heading. */
  title: ReactNode
  /** Muted task text after the heading. */
  task?: string
  /** Accessible name of the step tree. */
  label: string
  /** Run status; defaults to live while any step runs. */
  status?: 'live' | 'done' | 'failed'
  /** Controlled mode. */
  mode?: CostMode
  /** Mode when uncontrolled. */
  defaultMode?: CostMode
  /** Called when the mode switch changes. */
  onModeChange?: (mode: CostMode) => void
  /** Controlled folded sub-agent ids. */
  collapsed?: readonly string[]
  /** Folded sub-agent ids when uncontrolled. */
  defaultCollapsed?: readonly string[]
  /** Called with the folded ids after a fold or unfold. */
  onCollapsedChange?: (collapsed: readonly string[]) => void
  /** Controlled step id whose details are open; null when closed. */
  openId?: string | null
  /** Step open first when uncontrolled. */
  defaultOpenId?: string | null
  /** Called when the open step changes. */
  onOpenChange?: (id: string | null) => void
  /** Height cap of the step list in pixels; it scrolls past it. */
  maxHeight?: number
  /** How a cost is written (「¥0.42」). */
  formatCost: (cost: number) => string
  /** How a token count is written (「12.3k」). */
  formatTokens: (tokens: number) => string
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** Texts. */
  labels: CostWaterfallLabels
  /** Extra class name on the root. */
  className?: string
}

const KIND_ORDER: readonly CostStepKind[] = ['llm', 'tool', 'agent']

export function CostWaterfall({
  steps,
  title,
  task,
  label,
  status,
  mode: modeProp,
  defaultMode = 'cost',
  onModeChange,
  collapsed: collapsedProp,
  defaultCollapsed = [],
  onCollapsedChange,
  openId: openProp,
  defaultOpenId = null,
  onOpenChange,
  maxHeight,
  formatCost,
  formatTokens,
  formatDuration,
  labels,
  className,
}: CostWaterfallProps) {
  const [innerMode, setInnerMode] = useState<CostMode>(defaultMode)
  const [innerCollapsed, setInnerCollapsed] = useState<readonly string[]>(defaultCollapsed)
  const [innerOpen, setInnerOpen] = useState<string | null>(defaultOpenId)
  const [focusId, setFocusId] = useState<string | null>(null)
  const items = useRef(new Map<string, HTMLElement>())
  const focusNext = useRef<string | null>(null)
  const detailsId = useId()
  const mode = modeProp ?? innerMode
  const collapsed = collapsedProp ?? innerCollapsed
  const openId = openProp !== undefined ? openProp : innerOpen
  const rows = costRows(steps, new Set(collapsed), mode)
  const { lo, hi, ticks } = costAxis(rows)
  const totals = runTotals(steps)
  const state = runState(steps, status)
  const priciest = priciestStep(steps, mode)
  const tint = assignSeries(KIND_ORDER)
  const current = focusId !== null && rows.some((row) => row.step.id === focusId) ? focusId : rows[0]?.step.id
  const open = rows.find((row) => row.step.id === openId) ?? null
  const format = (value: number) => (mode === 'cost' ? formatCost(value) : formatTokens(value))
  const at = (value: number) => `${(((value - lo) / (hi - lo)) * 100).toFixed(3)}%`

  useEffect(() => {
    if (focusNext.current === null) return
    items.current.get(focusNext.current)?.focus()
    focusNext.current = null
  })

  const setCollapsed = (next: readonly string[]) => {
    if (collapsedProp === undefined) setInnerCollapsed(next)
    onCollapsedChange?.(next)
  }
  const toggle = (id: string) =>
    setCollapsed(collapsed.includes(id) ? collapsed.filter((item) => item !== id) : [...collapsed, id])
  const setOpen = (next: string | null) => {
    if (openProp === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }
  const focus = (id: string) => {
    setFocusId(id)
    items.current.get(id)?.focus()
  }
  const jump = () => {
    if (priciest === null) return
    setCollapsed(collapsed.filter((id) => !priciest.ancestors.includes(id)))
    setOpen(priciest.id)
    setFocusId(priciest.id)
    focusNext.current = priciest.id
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(openId === id ? null : id)
      return
    }
    if (event.key === 'Escape') {
      if (openId === null) return
      event.preventDefault()
      setOpen(null)
      return
    }
    const move = moveSpan(
      rows.map(({ step, ...rest }) => ({ span: step, ...rest })),
      id,
      event.key,
    )
    if (move === undefined) return
    event.preventDefault()
    if ('toggle' in move) toggle(move.toggle)
    else focus(move.focus)
  }
  const setMode = (next: CostMode) => {
    if (modeProp === undefined) setInnerMode(next)
    onModeChange?.(next)
  }

  return (
    <section className={cn('k-cw', className)} data-slot="cost-waterfall" data-status={state}>
      <header className="k-cw-head">
        <h4 className="k-cw-title">{title}</h4>
        {task !== undefined && <span className="k-cw-task">{task}</span>}
        <span className="k-cw-run" data-slot="cost-run" data-status={state} aria-live="polite">
          {labels.run[state]} · {formatCost(totals.cost)} · {formatTokens(totals.tokensIn + totals.tokensOut)} ·{' '}
          {formatDuration(totals.duration)}
        </span>
      </header>
      <div className="k-cw-bar">
        <ToggleGroup
          size="sm"
          aria-label={labels.mode}
          value={mode}
          onValueChange={(next) => setMode(next as CostMode)}
        >
          <ToggleGroupItem value="cost">{labels.cost}</ToggleGroupItem>
          <ToggleGroupItem value="tokens">{labels.tokens}</ToggleGroupItem>
        </ToggleGroup>
        {priciest !== null && (
          <Button size="sm" variant="ghost" onClick={jump} data-slot="cost-priciest">
            {labels.priciest}
          </Button>
        )}
      </div>
      <div className="k-cw-grid">
        <div className="k-cw-cols" aria-hidden="true">
          <span>{labels.name}</span>
          <span className="k-cw-axis">
            {ticks.map((tick, index) => (
              <i
                key={tick}
                style={{ left: at(tick) }}
                data-align={index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'mid'}
              >
                {format(tick)}
              </i>
            ))}
          </span>
          <span>{mode === 'cost' ? labels.cost : labels.tokens}</span>
          <span>{labels.time}</span>
          <span data-wide="">{labels.tokensIn}</span>
          <span data-wide="">{labels.tokensOut}</span>
        </div>
        <ul
          className="k-cw-tree"
          role="tree"
          aria-label={label}
          style={maxHeight === undefined ? undefined : { maxHeight, overflowY: 'auto' }}
        >
          {rows.map((row) => {
            const step = row.step
            const stepStatus = step.status ?? 'done'
            const value = measure(row.totals, mode)
            const name = [
              step.name,
              labels.kind[step.kind],
              labels.status[stepStatus],
              formatCost(row.totals.cost),
              formatTokens(row.totals.tokensIn + row.totals.tokensOut),
              formatDuration(row.totals.duration),
              step.id === priciest?.id ? labels.priciest : null,
            ]
            return (
              <li
                key={step.id}
                ref={(node) => {
                  if (node) items.current.set(step.id, node)
                  else items.current.delete(step.id)
                }}
                role="treeitem"
                aria-level={row.depth + 1}
                aria-expanded={row.hasChildren ? row.expanded : undefined}
                aria-selected={openId === step.id}
                aria-controls={detailsId}
                aria-label={name.filter(Boolean).join('，')}
                tabIndex={step.id === current ? 0 : -1}
                className="k-cw-row"
                data-slot="cost-step"
                data-id={step.id}
                data-kind={step.kind}
                data-status={stepStatus}
                data-priciest={step.id === priciest?.id ? '' : undefined}
                style={{ '--k-cw-depth': row.depth } as CSSProperties}
                onFocus={() => setFocusId(step.id)}
                onClick={() => {
                  focus(step.id)
                  setOpen(openId === step.id ? null : step.id)
                }}
                onKeyDown={(event) => onKeyDown(event, step.id)}
              >
                <span className="k-cw-label">
                  {row.hasChildren ? (
                    <ChevronRightIcon
                      className="k-cw-fold"
                      data-open={row.expanded ? '' : undefined}
                      aria-hidden="true"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggle(step.id)
                      }}
                    />
                  ) : (
                    <i className="k-cw-fold-gap" aria-hidden="true" />
                  )}
                  <small className="k-cw-kind">{labels.kind[step.kind]}</small>
                  <span className="k-cw-name">{step.name}</span>
                  {step.model !== undefined && <span className="k-cw-model">{step.model}</span>}
                </span>
                <span className="k-cw-track" aria-hidden="true">
                  {ticks.map((tick) => (
                    <b key={tick} className="k-cw-gridline" style={{ left: at(tick) }} />
                  ))}
                  <i
                    className="k-cw-fill"
                    data-slot="cost-bar"
                    data-credit={row.to < row.from ? '' : undefined}
                    style={{
                      left: at(Math.min(row.from, row.to)),
                      width: `max(2px, calc(${at(Math.max(row.from, row.to))} - ${at(Math.min(row.from, row.to))}))`,
                      backgroundColor: stepStatus === 'failed' ? undefined : tint[step.kind],
                    }}
                  />
                </span>
                <span className="k-cw-num">{format(value)}</span>
                <span className="k-cw-num">{formatDuration(row.totals.duration)}</span>
                <span className="k-cw-num" data-wide="">
                  {formatTokens(row.totals.tokensIn)}
                </span>
                <span className="k-cw-num" data-wide="">
                  {formatTokens(row.totals.tokensOut)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <div
        id={detailsId}
        className="k-cw-details"
        role="region"
        aria-label={labels.details}
        data-slot="cost-details"
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || open === null) return
          event.preventDefault()
          setOpen(null)
          focus(open.step.id)
        }}
      >
        {open !== null && (
          <>
            <p className="k-cw-details-head">
              {open.step.name} · {labels.kind[open.step.kind]} · {labels.status[open.step.status ?? 'done']} ·{' '}
              {formatCost(open.totals.cost)} · {formatDuration(open.totals.duration)}
            </p>
            {open.step.input !== undefined && (
              <div className="k-cw-io">
                <span>{labels.io[open.step.kind][0]}</span>
                {/* 长文本在自己的框里滚，框本身是一个 Tab 停点，键盘也能滚。 */}
                <pre tabIndex={0}>{open.step.input}</pre>
              </div>
            )}
            {open.step.output !== undefined && (
              <div className="k-cw-io">
                <span>{labels.io[open.step.kind][1]}</span>
                <pre tabIndex={0}>{open.step.output}</pre>
              </div>
            )}
            {open.step.error !== undefined && (
              <div className="k-cw-io" data-part="error">
                <span>{labels.error}</span>
                <pre tabIndex={0}>{open.step.error}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
