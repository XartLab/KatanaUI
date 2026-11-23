// SPDX-License-Identifier: MIT
/**
 * Agent tree: an orchestrator and the sub-agents it starts as a live tree of cards with status, cost and time; branch costs roll up, branches fold, and agents that need you or failed open an answer window.
 * Agent 树（KATANAview #1908 第三批）：一次多 Agent 运行里，编排 Agent 派生子 Agent、子 Agent 再派生，画成一棵卡片树。每张卡写名字、模型、状态、任务（前面一排工具小方块）、
 * 花费（有子的写整个分支的花费）与耗时；排队与停下的卡和通向它的线变淡。头一行合计几个 Agent、在跑、要你、失败与总花费（读屏会播）。
 * 宽于 560px 时第一层子 Agent 在根下面并排、再往下挂在各自的父下面；窄了每层往里缩一格、线在左边。
 * 要你与失败的卡、带步骤的卡，Enter 或点开一个小窗：步骤清单、等你决定的问题或失败原因，以及「批准 / 拒绝」「重试 / 不管了」（给了 onResolve）。
 * 功能参照 affectUI 的 Agent Tree（affectui.com/components/agent-tree，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：件不取时间（在跑的耗时量到调用方给的 now，不给就不写）；花费写法由调用方给（不默认美元）；树里每张卡只是一个 treeitem、卡里没有可聚焦的钮
 * （axe 的 nested-interactive），收起展开走 ← →（复用 TraceWaterfall 的 moveSpan），窗口走 Enter。批准、拒绝这类只回调人的决定，状态由调用方的数据改。
 * 弹层用我们的 Popover。纯逻辑在 agent-tree-model.ts；AgentFleet 用这里的 AgentTreeView 画展开的子树。包里不带语言。
 */
import { ChevronRightIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import { Popover, PopoverAnchor, PopoverContent } from '../../primitives/popover.tsx'
import {
  agentElapsed,
  agentMuted,
  agentTotals,
  branchCost,
  moveAgent,
  needsAnswer,
  toolTiles,
  visibleAgents,
  type AgentResolution,
  type AgentRunStatus,
  type AgentTotals,
  type RunAgent,
} from './agent-tree-model.ts'

/** Texts of the agent cards, shared by AgentTree and AgentFleet (the package ships no text). */
export type AgentRunLabels = {
  /** Status words; waiting is usually 「要你」. */
  status: Record<AgentRunStatus, string>
  /** Sub-agent count read with a branch. */
  children: (count: number) => string
  /** Word before a branch's summed cost. */
  branch: string
  /** Answer buttons. */
  approve: string
  reject: string
  retry: string
  dismiss: string
  /** Accessible names of the answer window and of the tasks window. */
  answerOf: (name: string) => string
  stepsOf: (name: string) => string
  /** Tile for tools past the third. */
  more: (count: number) => string
  /** Hint read with each card: the keys that fold, open and select. */
  hint: string
}

/** Texts of the totals bar. */
export type AgentBarLabels = {
  agents: (count: number) => string
  running: (count: number) => string
  waiting: (count: number) => string
  failed: (count: number) => string
}

/** 头上的合计：几个 Agent · 在跑 · 要你 · 失败（有才写）· 花费。 */
export function AgentBar({
  title,
  totals,
  formatCost,
  labels,
}: {
  title: ReactNode
  totals: AgentTotals
  formatCost: (cost: number) => string
  labels: AgentBarLabels
}) {
  return (
    <header className="k-org-bar">
      <h4 className="k-org-title">{title}</h4>
      <span className="k-org-totals" aria-live="polite" data-slot="agent-totals">
        <span>{labels.agents(totals.agents)}</span>
        <span data-status="running">{labels.running(totals.running)}</span>
        {totals.waiting > 0 && <span data-status="waiting">{labels.waiting(totals.waiting)}</span>}
        {totals.failed > 0 && <span data-status="failed">{labels.failed(totals.failed)}</span>}
        {totals.cost !== undefined && <span>{formatCost(totals.cost)}</span>}
      </span>
    </header>
  )
}

export type AgentTreeViewProps = {
  roots: readonly RunAgent[]
  label: string
  collapsed: ReadonlySet<string>
  onToggle: (id: string) => void
  onSelect?: (agent: RunAgent) => void
  onResolve?: (agent: RunAgent, action: AgentResolution) => void
  now?: number
  formatCost: (cost: number) => string
  formatDuration: (ms: number) => string
  labels: AgentRunLabels
  id?: string
  className?: string
}

/** 卡片树本身（role=tree）：AgentTree 与 AgentFleet 共用。 */
export function AgentTreeView({
  roots,
  label,
  collapsed,
  onToggle,
  onSelect,
  onResolve,
  now,
  formatCost,
  formatDuration,
  labels,
  id,
  className,
}: AgentTreeViewProps) {
  const [focusId, setFocusId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const items = useRef(new Map<string, HTMLLIElement>())
  const focusNext = useRef<string | null>(null)
  const hintId = useId()
  const rows = visibleAgents(roots, collapsed)
  const current = focusId !== null && rows.some((row) => row.agent.id === focusId) ? focusId : rows[0]?.agent.id

  useEffect(() => {
    if (focusNext.current === null) return
    items.current.get(focusNext.current)?.focus()
    focusNext.current = null
  })

  const hasWindow = (agent: RunAgent) => needsAnswer(agent) || (agent.steps?.length ?? 0) > 0
  const focus = (agentId: string) => {
    setFocusId(agentId)
    items.current.get(agentId)?.focus()
  }
  const activate = (agent: RunAgent) => {
    onSelect?.(agent)
    if (hasWindow(agent)) setOpenId(openId === agent.id ? null : agent.id)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, agent: RunAgent) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    const branch = (agent.children?.length ?? 0) > 0
    if (event.key === 'Enter' || (event.key === ' ' && !branch)) {
      event.preventDefault()
      activate(agent)
      return
    }
    if (event.key === ' ') {
      event.preventDefault()
      onToggle(agent.id)
      return
    }
    const move = moveAgent(rows, agent.id, event.key)
    if (move === undefined) return
    event.preventDefault()
    if ('toggle' in move) onToggle(move.toggle)
    else focus(move.focus)
  }
  const resolve = (agent: RunAgent, action: AgentResolution) => {
    onResolve?.(agent, action)
    setOpenId(null)
    focusNext.current = agent.id
  }

  const renderAgent = (agent: RunAgent, depth: number): ReactNode => {
    const children = agent.children ?? []
    const branch = children.length > 0
    const expanded = branch && !collapsed.has(agent.id)
    const cost = branch ? branchCost(agent) : Number.isFinite(agent.cost) ? agent.cost : undefined
    const costText = cost === undefined ? null : `${branch ? `${labels.branch} ` : ''}${formatCost(cost)}`
    const elapsed = agentElapsed(agent, now)
    const elapsedText = elapsed === undefined ? null : formatDuration(elapsed)
    const tiles = toolTiles(agent.tools)
    const windowed = hasWindow(agent)
    return (
      <li
        key={agent.id}
        ref={(node) => {
          if (node) items.current.set(agent.id, node)
          else items.current.delete(agent.id)
        }}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={branch ? expanded : undefined}
        aria-haspopup={windowed ? 'dialog' : undefined}
        aria-label={[
          agent.name,
          labels.status[agent.status],
          agent.task,
          costText,
          elapsedText,
          branch ? labels.children(children.length) : null,
        ]
          .filter(Boolean)
          .join('，')}
        aria-describedby={hintId}
        tabIndex={agent.id === current ? 0 : -1}
        className="k-org-item"
        data-slot="agent-node"
        data-id={agent.id}
        data-status={agent.status}
        data-muted={agentMuted(agent.status) ? '' : undefined}
        onFocus={(event) => {
          if (event.target === event.currentTarget) setFocusId(agent.id)
        }}
        onKeyDown={(event) => onKeyDown(event, agent)}
      >
        <Popover open={openId === agent.id} onOpenChange={(open) => setOpenId(open ? agent.id : null)}>
          <PopoverAnchor asChild>
            <div
              className="k-org-card k-at-card"
              data-depth={Math.min(depth, 2)}
              onClick={() => {
                focus(agent.id)
                activate(agent)
              }}
            >
              <span className="k-at-line">
                {branch && (
                  <span
                    className="k-at-fold"
                    data-open={expanded ? '' : undefined}
                    aria-hidden="true"
                    onClick={(event) => {
                      event.stopPropagation()
                      focus(agent.id)
                      onToggle(agent.id)
                    }}
                  >
                    <ChevronRightIcon />
                  </span>
                )}
                <b className="k-at-name" title={agent.name}>
                  {agent.name}
                </b>
                {agent.model !== undefined && <small className="k-at-model">{agent.model}</small>}
                <span className="k-at-status" data-status={agent.status}>
                  {labels.status[agent.status]}
                </span>
              </span>
              <span className="k-at-line">
                {tiles.shown.length > 0 && (
                  <span className="k-at-tools" aria-hidden="true">
                    {tiles.shown.map((tool) => (
                      <i key={tool} title={tool}>
                        {tool.slice(0, 1)}
                      </i>
                    ))}
                    {tiles.more > 0 && <i data-more="">{labels.more(tiles.more)}</i>}
                  </span>
                )}
                <span className="k-at-task" title={agent.task}>
                  {agent.task}
                </span>
              </span>
              <span className="k-at-line k-at-nums">
                {costText !== null && <span data-part="cost">{costText}</span>}
                {elapsedText !== null && <span data-part="elapsed">{elapsedText}</span>}
              </span>
            </div>
          </PopoverAnchor>
          {windowed && (
            <PopoverContent
              className="k-at-pop"
              aria-label={needsAnswer(agent) ? labels.answerOf(agent.name) : labels.stepsOf(agent.name)}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                items.current.get(agent.id)?.focus()
              }}
              onPointerDownOutside={(event) => {
                // 点的是自己这张卡：交给卡的点击去开合，不在这里先关一次（不然关了又被点击打开）。
                const card = items.current.get(agent.id)?.querySelector(':scope > .k-org-card')
                if (card?.contains(event.target as Node)) event.preventDefault()
              }}
            >
              <p className="k-at-pop-title">
                {agent.name} · {labels.status[agent.status]}
              </p>
              {agent.steps !== undefined && agent.steps.length > 0 && (
                <ol className="k-at-steps" aria-label={labels.stepsOf(agent.name)}>
                  {agent.steps.map((step, index) => (
                    <li key={index} data-status={step.status}>
                      <i aria-hidden="true" />
                      <span>{step.title}</span>
                      {step.tool !== undefined && <small>{step.tool}</small>}
                      <small data-part="status">{labels.status[step.status]}</small>
                      {step.duration !== undefined && <small>{formatDuration(step.duration)}</small>}
                    </li>
                  ))}
                </ol>
              )}
              {agent.status === 'waiting' && agent.ask !== undefined && <p className="k-at-ask">{agent.ask}</p>}
              {agent.status === 'failed' && agent.error !== undefined && <p className="k-at-error">{agent.error}</p>}
              {needsAnswer(agent) && onResolve !== undefined && (
                <div className="k-at-actions" data-slot="agent-answer">
                  {agent.status === 'waiting' ? (
                    <>
                      <Button size="sm" variant="primary" onClick={() => resolve(agent, 'approve')}>
                        {labels.approve}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => resolve(agent, 'reject')}>
                        {labels.reject}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="primary" onClick={() => resolve(agent, 'retry')}>
                        {labels.retry}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resolve(agent, 'dismiss')}>
                        {labels.dismiss}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </PopoverContent>
          )}
        </Popover>
        {expanded && (
          <ul role="group" className="k-org-group">
            {children.map((child) => renderAgent(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <>
      <ul id={id} className={cn('k-org-tree', className)} role="tree" aria-label={label}>
        {roots.map((root) => renderAgent(root, 0))}
      </ul>
      <span id={hintId} hidden>
        {labels.hint}
      </span>
    </>
  )
}

/** Texts of AgentTree. */
export type AgentTreeLabels = AgentRunLabels & {
  /** Totals bar. */
  bar: AgentBarLabels
  /** Accessible name of the tree. */
  tree: string
}

export type AgentTreeProps = {
  /** The orchestrator with its sub-agents; rebuild it as the run goes on. */
  root: RunAgent
  /** Folded branch ids, controlled. */
  collapsed?: readonly string[]
  /** Folded branch ids at first, uncontrolled. */
  defaultCollapsed?: readonly string[]
  /** Called with the folded ids after a fold or unfold. */
  onCollapsedChange?: (collapsed: readonly string[]) => void
  /** Called when a card is clicked or gets Enter. */
  onSelect?: (agent: RunAgent) => void
  /** Called with the person's answer to an agent that needs you or failed; update its status in your data. */
  onResolve?: (agent: RunAgent, action: AgentResolution) => void
  /** Clock in milliseconds for running times; the component does not tick on its own. */
  now?: number
  /** Heading. */
  title: ReactNode
  /** How a cost is written. */
  formatCost: (cost: number) => string
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** Texts. */
  labels: AgentTreeLabels
  /** Extra class name on the root. */
  className?: string
}

export function AgentTree({
  root,
  collapsed: collapsedProp,
  defaultCollapsed = [],
  onCollapsedChange,
  onSelect,
  onResolve,
  now,
  title,
  formatCost,
  formatDuration,
  labels,
  className,
}: AgentTreeProps) {
  const [inner, setInner] = useState<readonly string[]>(defaultCollapsed)
  const collapsed = collapsedProp ?? inner
  const toggle = (id: string) => {
    const next = collapsed.includes(id) ? collapsed.filter((item) => item !== id) : [...collapsed, id]
    if (collapsedProp === undefined) setInner(next)
    onCollapsedChange?.(next)
  }
  return (
    <section className={cn('k-org k-at', className)} data-slot="agent-tree">
      <AgentBar title={title} totals={agentTotals([root])} formatCost={formatCost} labels={labels.bar} />
      <AgentTreeView
        roots={[root]}
        label={labels.tree}
        collapsed={new Set(collapsed)}
        onToggle={toggle}
        onSelect={onSelect}
        onResolve={onResolve}
        now={now}
        formatCost={formatCost}
        formatDuration={formatDuration}
        labels={labels}
      />
    </section>
  )
}
