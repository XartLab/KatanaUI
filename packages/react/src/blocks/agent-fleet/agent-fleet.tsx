// SPDX-License-Identifier: MIT
/**
 * Agent fleet: several main agents side by side, each card summing up its sub-agents with a status ring; click one to open its sub-agent tree beside it, click again to fold it.
 * Agent 总览（KATANAview #1908 第三批）：几个主 Agent 同时跑（研究、风控、执行各一个），左边一列主卡：状态环（子 Agent 做完的占比）、一句说明、任务（前面一排工具小方块）、
 * 整个分支的花费与耗时。点主卡在右边打开它的子 Agent 树（同一张卡再点收起），窄了树落到那张卡下面、把下面的卡往下推。头一行合计整个 Agent 群的数与花费（读屏会播）。
 * 树里要你与失败的卡、带步骤的卡 Enter 打开小窗（步骤、问题或失败原因、批准 / 拒绝、重试 / 不管了）。
 * 功能参照 affectUI 的 Agent Fleet（affectui.com/components/agent-fleet，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：件不取时间（耗时量到调用方给的 now）；花费写法由调用方给；主卡上不放「回答」快捷钮（主卡本身是展开钮，钮里不能再放钮），回答在树里。
 * 展开的子树就是 AgentTree 的 AgentTreeView，卡、键盘、小窗都一样；批准、拒绝只回调人的决定。纯逻辑在 agent-tree-model.ts。包里不带语言。
 */
import { Fragment, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { AgentBar, AgentTreeView, type AgentBarLabels, type AgentRunLabels } from '../agent-tree/agent-tree.tsx'
import {
  agentElapsed,
  agentTotals,
  branchCost,
  descendantTotals,
  toolTiles,
  type AgentResolution,
  type AgentTotals,
  type RunAgent,
} from '../agent-tree/agent-tree-model.ts'

/** Texts of AgentFleet. */
export type AgentFleetLabels = AgentRunLabels & {
  /** Totals bar. */
  bar: AgentBarLabels
  /** Accessible name of the column of main agents. */
  fleet: string
  /** Phrase explaining the status ring of a main agent from its sub-agent totals. */
  ring: (totals: AgentTotals) => string
  /** Name of the open tree. */
  subAgentsOf: (name: string) => string
  /** Line in the open pane of a main agent without sub-agents. */
  noSubAgents: string
}

export type AgentFleetProps = {
  /** Main agents, each with its sub-agents. */
  agents: readonly RunAgent[]
  /** Id of the main agent whose tree is open, or null; controlled. */
  open?: string | null
  /** Open main agent at first, uncontrolled; defaults to the first agent. */
  defaultOpen?: string | null
  /** Called with the main agent id that opens, or null when its tree folds. */
  onOpenChange?: (id: string | null) => void
  /** Called when a sub-agent card is clicked or gets Enter. */
  onSelect?: (agent: RunAgent) => void
  /** Called with the person's answer to a sub-agent that needs you or failed. */
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
  labels: AgentFleetLabels
  /** Extra class name on the root. */
  className?: string
}

/** 状态环的周长：r = 9 的圆（viewBox 24）。 */
const RING = 2 * Math.PI * 9

export function AgentFleet({
  agents,
  open: openProp,
  defaultOpen,
  onOpenChange,
  onSelect,
  onResolve,
  now,
  title,
  formatCost,
  formatDuration,
  labels,
  className,
}: AgentFleetProps) {
  const [innerOpen, setInnerOpen] = useState<string | null>(
    defaultOpen === undefined ? (agents[0]?.id ?? null) : defaultOpen,
  )
  const [focusIndex, setFocusIndex] = useState(0)
  const [collapsed, setCollapsed] = useState<readonly string[]>([])
  const mains = useRef<(HTMLButtonElement | null)[]>([])
  const panelId = useId()
  const openId = openProp !== undefined ? openProp : innerOpen
  const current = Math.min(focusIndex, Math.max(0, agents.length - 1))

  const setOpen = (id: string | null) => {
    if (openProp === undefined) setInnerOpen(id)
    onOpenChange?.(id)
  }
  const toggleBranch = (id: string) =>
    setCollapsed(collapsed.includes(id) ? collapsed.filter((item) => item !== id) : [...collapsed, id])
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const next =
      event.key === 'ArrowDown'
        ? Math.min(agents.length - 1, index + 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? agents.length - 1
              : undefined
    if (next === undefined) return
    event.preventDefault()
    setFocusIndex(next)
    mains.current[next]?.focus()
  }

  return (
    <section className={cn('k-org k-fleet', className)} data-slot="agent-fleet">
      <AgentBar title={title} totals={agentTotals(agents)} formatCost={formatCost} labels={labels.bar} />
      <div
        className="k-fleet-body"
        role="group"
        aria-label={labels.fleet}
        style={{ '--k-fleet-rows': Math.max(1, agents.length) } as CSSProperties}
      >
        {agents.map((agent, index) => {
          const isOpen = openId === agent.id
          const subs = descendantTotals(agent)
          const ratio = subs.agents === 0 ? (agent.status === 'done' ? 1 : 0) : subs.done / subs.agents
          const cost = branchCost(agent)
          const elapsed = agentElapsed(agent, now)
          const tiles = toolTiles(agent.tools)
          const children = agent.children ?? []
          return (
            <Fragment key={agent.id}>
              <button
                ref={(node) => {
                  mains.current[index] = node
                }}
                type="button"
                className="k-fleet-main"
                data-slot="fleet-main"
                data-id={agent.id}
                data-status={agent.status}
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                tabIndex={index === current ? 0 : -1}
                onFocus={() => setFocusIndex(index)}
                onClick={() => setOpen(isOpen ? null : agent.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <svg className="k-fleet-ring" viewBox="0 0 24 24" aria-hidden="true" data-status={agent.status}>
                  <circle cx="12" cy="12" r="9" data-part="track" />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    data-part="arc"
                    strokeDasharray={`${(ratio * RING).toFixed(2)} ${RING.toFixed(2)}`}
                  />
                </svg>
                <span className="k-fleet-text">
                  <span className="k-at-line">
                    <b className="k-at-name" title={agent.name}>
                      {agent.name}
                    </b>
                    {agent.model !== undefined && <small className="k-at-model">{agent.model}</small>}
                    <span className="k-at-status" data-status={agent.status}>
                      {labels.status[agent.status]}
                    </span>
                  </span>
                  <span className="k-fleet-phrase">{labels.ring(subs)}</span>
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
                    {cost !== undefined && <span data-part="cost">{formatCost(cost)}</span>}
                    {elapsed !== undefined && <span data-part="elapsed">{formatDuration(elapsed)}</span>}
                  </span>
                </span>
              </button>
              {isOpen ? (
                <div
                  id={panelId}
                  className="k-fleet-panel"
                  data-slot="fleet-panel"
                  role="region"
                  aria-label={labels.subAgentsOf(agent.name)}
                >
                  <p className="k-fleet-panel-title">{labels.subAgentsOf(agent.name)}</p>
                  {children.length === 0 ? (
                    <p className="k-fleet-empty">{labels.noSubAgents}</p>
                  ) : (
                    <AgentTreeView
                      roots={children}
                      label={labels.subAgentsOf(agent.name)}
                      collapsed={new Set(collapsed)}
                      onToggle={toggleBranch}
                      onSelect={onSelect}
                      onResolve={onResolve}
                      now={now}
                      formatCost={formatCost}
                      formatDuration={formatDuration}
                      labels={labels}
                    />
                  )}
                </div>
              ) : null}
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}
