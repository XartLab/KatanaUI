// SPDX-License-Identifier: MIT
/**
 * Agent crew: a lead agent and its standing sub-agents as one live tree of cards with activity, a context bar, tools and the last hand-off; a new hand-off lights the receiving card, and a card opens details with steering actions.
 * 多角色小组（KATANAview #1908 第三批）：一个主 Agent（lead）带一组常驻的子 Agent（研究员、风控、执行……），所有成员一直摆着：每张卡写名字、模型、状态、正在做什么与上下文条
 * （到 80% 变 warn、95% 变 danger，给了上限写「136k / 200k」），卡下面一行写工具与最近一次交接。宽于 560px 子 Agent 在 lead 下面并排、再下一层挂在下面画小一号；窄了每层往里缩。
 * 新交接到达时，接手的那张卡从进来的那一边升起一层底色再淡掉，读屏播报谁交给谁。点卡或 Enter 打开详情：任务、模型、用时、花费、token、工具、最近交接与引导动作
 * （留言总在；在忙可暂停、停止；暂停可继续；等你可批准、拒绝；失败可重试）。头上写在忙与等你的数；给了 projects 时标题换成项目切换（每个项目写它的在忙与要你）。
 * 功能参照 affectUI 的 Agent Crew（affectui.com/components/agent-crew，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：件不取时间（用时量到调用方给的 now）；花费与 token 写法由调用方给；交接灯不沿连线走，只点亮接手的卡；详情用我们的 Dialog（居中），不跟着卡浮。
 * 引导动作只回调 onSteer（人的决定），状态由调用方的数据改。键盘照读的次序（前序）走卡。卡片树的排法与 AgentTree 同一套（theme/agent-org.css）。包里不带语言。
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../primitives/dialog.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../primitives/select.tsx'
import { Textarea } from '../../primitives/textarea.tsx'
import { agentElapsed, toolTiles } from '../agent-tree/agent-tree-model.ts'
import {
  clampContext,
  crewContextLevel,
  crewCounts,
  crewOrder,
  handoffEdge,
  steerActions,
  type CrewAgent,
  type CrewHandoff,
  type CrewProject,
  type CrewStatus,
  type CrewSteer,
} from './crew-model.ts'

/** Texts of AgentCrew (the package ships no text). */
export type AgentCrewLabels = {
  /** Status words; waiting is usually 「要你」. */
  status: Record<CrewStatus, string>
  /** Steering buttons. */
  steer: Record<CrewSteer, string>
  /** Accessible name of the crew tree. */
  tree: string
  /** Header counts. */
  counts: (counts: { total: number; working: number; waiting: number }) => string
  /** Accessible name of the project switcher, and the counts of one project. */
  project: string
  projectCounts: (project: CrewProject) => string
  /** Context share read with a card. */
  context: (percent: number) => string
  /** Hint read with each card. */
  hint: string
  /** Field names in the details. */
  details: { task: string; model: string; time: string; cost: string; tokens: string; tools: string; last: string }
  /** Close button of the details. */
  close: string
  /** Label of the message field and its send button. */
  message: string
  send: string
  /** Live line for a new hand-off. */
  handed: (from: string, to: string, label?: string) => string
  /** Live line after a steering action. */
  steered: (name: string, action: string) => string
  /** Tile for tools past the third. */
  more: (count: number) => string
}

export type AgentCrewProps = {
  /** The lead agent with its members. */
  root: CrewAgent
  /** Hand-offs so far; a new id lights the receiving card, the ones present at first do not. */
  handoffs?: readonly CrewHandoff[]
  /** Heading when there is no project switcher. */
  title: ReactNode
  /** Projects of the switcher, which replaces the heading. */
  projects?: readonly CrewProject[]
  /** Selected project id. */
  project?: string
  /** Called with the chosen project id; swap root and handoffs for that project's crew. */
  onProjectChange?: (id: string) => void
  /** Shows the steering actions; called with the person's choice and the message text. */
  onSteer?: (agent: CrewAgent, action: CrewSteer, message?: string) => void
  /** Called when a card is clicked or gets Enter. */
  onSelect?: (agent: CrewAgent) => void
  /** Clock in milliseconds for the time in the details; the component does not tick on its own. */
  now?: number
  /** How a cost is written. */
  formatCost: (cost: number) => string
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** How a token count is written (「136k」). */
  formatTokens: (tokens: number) => string
  /** Texts. */
  labels: AgentCrewLabels
  /** Extra class name on the root. */
  className?: string
}

const EMPTY: readonly CrewHandoff[] = []

export function AgentCrew({
  root,
  handoffs = EMPTY,
  title,
  projects,
  project,
  onProjectChange,
  onSteer,
  onSelect,
  now,
  formatCost,
  formatDuration,
  formatTokens,
  labels,
  className,
}: AgentCrewProps) {
  const order = crewOrder(root)
  const nameOf = (id: string) => order.find((agent) => agent.id === id)?.name ?? id
  const [focusId, setFocusId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [messaging, setMessaging] = useState(false)
  const [draft, setDraft] = useState('')
  const [live, setLive] = useState('')
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(handoffs.map((handoff) => handoff.id)))
  const [flash, setFlash] = useState<CrewHandoff | null>(null)
  const [shownProject, setShownProject] = useState(project)
  // 换项目：那一组的交接都算看过（不亮）；同一个项目里新出现的交接点亮接手的卡并播报。在渲染时比较，不用 effect。
  if (shownProject !== project) {
    setShownProject(project)
    setSeen(new Set(handoffs.map((handoff) => handoff.id)))
    setFlash(null)
  } else {
    const fresh = handoffs.filter((handoff) => !seen.has(handoff.id))
    const latest = fresh.at(-1)
    if (latest !== undefined) {
      setSeen(new Set([...seen, ...fresh.map((handoff) => handoff.id)]))
      setFlash(latest)
      setLive(labels.handed(nameOf(latest.from), nameOf(latest.to), latest.label))
    }
  }
  const items = useRef(new Map<string, HTMLLIElement>())
  const hintId = useId()
  const counts = crewCounts(root)
  const current = focusId !== null && order.some((agent) => agent.id === focusId) ? focusId : root.id
  const detail = detailId === null ? undefined : order.find((agent) => agent.id === detailId)

  const open = (agent: CrewAgent) => {
    onSelect?.(agent)
    setDetailId(agent.id)
    setMessaging(false)
  }
  const close = () => {
    setDetailId(null)
    setMessaging(false)
  }
  const steer = (agent: CrewAgent, action: CrewSteer, message?: string) => {
    onSteer?.(agent, action, message)
    setLive(labels.steered(agent.name, labels.steer[action]))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, agent: CrewAgent) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open(agent)
      return
    }
    const at = order.findIndex((item) => item.id === agent.id)
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? order[Math.min(order.length - 1, at + 1)]
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? order[Math.max(0, at - 1)]
          : event.key === 'Home'
            ? order[0]
            : event.key === 'End'
              ? order.at(-1)
              : undefined
    if (next === undefined) return
    event.preventDefault()
    setFocusId(next.id)
    items.current.get(next.id)?.focus()
  }

  const renderAgent = (agent: CrewAgent, depth: number): ReactNode => {
    const children = agent.children ?? []
    const ctx = clampContext(agent.context)
    const tiles = toolTiles(agent.tools)
    const limit = agent.contextLimit !== undefined && Number.isFinite(agent.contextLimit) ? agent.contextLimit : null
    return (
      <li
        key={agent.id}
        ref={(node) => {
          if (node) items.current.set(agent.id, node)
          else items.current.delete(agent.id)
        }}
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={children.length > 0 ? true : undefined}
        aria-haspopup="dialog"
        aria-label={[
          agent.name,
          labels.status[agent.status],
          agent.activity,
          ctx === undefined ? null : labels.context(Math.round(ctx * 100)),
        ]
          .filter(Boolean)
          .join('，')}
        aria-describedby={hintId}
        tabIndex={agent.id === current ? 0 : -1}
        className="k-org-item"
        data-slot="crew-agent"
        data-id={agent.id}
        data-status={agent.status}
        data-depth={Math.min(depth, 2)}
        onFocus={(event) => {
          if (event.target === event.currentTarget) setFocusId(agent.id)
        }}
        onKeyDown={(event) => onKeyDown(event, agent)}
      >
        <div
          className="k-org-card k-crew-card"
          onClick={() => {
            setFocusId(agent.id)
            items.current.get(agent.id)?.focus()
            open(agent)
          }}
        >
          {flash?.to === agent.id && (
            <i
              key={flash.id}
              className="k-crew-floor"
              data-slot="crew-handoff"
              data-edge={handoffEdge(root, flash)}
              aria-hidden="true"
            />
          )}
          <span className="k-at-line">
            <b className="k-at-name" title={agent.name}>
              {agent.name}
            </b>
            {agent.model !== undefined && <small className="k-at-model">{agent.model}</small>}
            <span className="k-at-status" data-status={agent.status}>
              {labels.status[agent.status]}
            </span>
          </span>
          <span className="k-crew-activity" title={agent.activity}>
            {agent.activity}
          </span>
          {ctx !== undefined && (
            <span className="k-crew-ctx" data-level={crewContextLevel(ctx)} data-slot="crew-context">
              <span className="k-crew-ctx-bar" aria-hidden="true">
                <b style={{ width: `${(ctx * 100).toFixed(1)}%` }} />
              </span>
              <small>
                {limit === null ? `${Math.round(ctx * 100)}%` : `${formatTokens(ctx * limit)} / ${formatTokens(limit)}`}
              </small>
            </span>
          )}
        </div>
        {(tiles.shown.length > 0 || agent.last !== undefined) && (
          <div className="k-crew-tray" aria-hidden="true">
            {tiles.shown.length > 0 && (
              <span className="k-at-tools">
                {tiles.shown.map((tool) => (
                  <i key={tool} title={tool}>
                    {tool.slice(0, 1)}
                  </i>
                ))}
                {tiles.more > 0 && <i data-more="">{labels.more(tiles.more)}</i>}
              </span>
            )}
            {agent.last !== undefined && (
              <span className="k-crew-last" title={agent.last.text}>
                {nameOf(agent.last.from)}：{agent.last.text}
              </span>
            )}
          </div>
        )}
        {children.length > 0 && (
          <ul role="group" className="k-org-group">
            {children.map((child) => renderAgent(child, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const elapsed = detail === undefined ? undefined : agentElapsed(detail, now)
  return (
    <section className={cn('k-org k-crew', className)} data-slot="agent-crew">
      <header className="k-org-bar">
        {projects !== undefined && projects.length > 0 ? (
          <Select value={project} onValueChange={(id) => onProjectChange?.(id)}>
            <SelectTrigger aria-label={labels.project} className="k-crew-project" data-slot="crew-project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} · {labels.projectCounts(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <h4 className="k-org-title">{title}</h4>
        )}
        <span className="k-org-totals" data-slot="crew-counts">
          {labels.counts(counts)}
        </span>
      </header>
      <ul key={project} className="k-org-tree" role="tree" aria-label={labels.tree}>
        {renderAgent(root, 0)}
      </ul>
      <span id={hintId} hidden>
        {labels.hint}
      </span>
      <span className="k-org-live" aria-live="polite" data-slot="crew-live">
        {live}
      </span>
      <Dialog
        open={detail !== undefined}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      >
        {detail !== undefined && (
          <DialogContent
            closeLabel={labels.close}
            className="k-crew-dialog w-[min(440px,calc(100vw-24px))]"
            onEscapeKeyDown={(event) => {
              // Esc 先收起留言框，再关详情。
              if (!messaging) return
              event.preventDefault()
              setMessaging(false)
            }}
          >
            <DialogHeader>
              <DialogTitle>{detail.name}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <DialogDescription>{detail.activity ?? labels.status[detail.status]}</DialogDescription>
              <dl className="k-crew-facts">
                {detail.task !== undefined && (
                  <>
                    <dt>{labels.details.task}</dt>
                    <dd>{detail.task}</dd>
                  </>
                )}
                {detail.model !== undefined && (
                  <>
                    <dt>{labels.details.model}</dt>
                    <dd>{detail.model}</dd>
                  </>
                )}
                {elapsed !== undefined && (
                  <>
                    <dt>{labels.details.time}</dt>
                    <dd>{formatDuration(elapsed)}</dd>
                  </>
                )}
                {detail.cost !== undefined && Number.isFinite(detail.cost) && (
                  <>
                    <dt>{labels.details.cost}</dt>
                    <dd>{formatCost(detail.cost)}</dd>
                  </>
                )}
                {detail.tokens !== undefined && Number.isFinite(detail.tokens) && (
                  <>
                    <dt>{labels.details.tokens}</dt>
                    <dd>{formatTokens(detail.tokens)}</dd>
                  </>
                )}
                {detail.tools !== undefined && detail.tools.length > 0 && (
                  <>
                    <dt>{labels.details.tools}</dt>
                    <dd>{detail.tools.join(' · ')}</dd>
                  </>
                )}
                {detail.last !== undefined && (
                  <>
                    <dt>{labels.details.last}</dt>
                    <dd>
                      {nameOf(detail.last.from)}：{detail.last.text}
                    </dd>
                  </>
                )}
              </dl>
              {onSteer !== undefined && (
                <div className="k-crew-steer" data-slot="crew-steer">
                  {steerActions(detail.status).map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant={
                        action === 'approve' || action === 'resume' || action === 'retry'
                          ? 'primary'
                          : action === 'stop' || action === 'decline'
                            ? 'danger'
                            : 'default'
                      }
                      aria-expanded={action === 'message' ? messaging : undefined}
                      onClick={() => (action === 'message' ? setMessaging(!messaging) : steer(detail, action))}
                    >
                      {labels.steer[action]}
                    </Button>
                  ))}
                </div>
              )}
              {onSteer !== undefined && messaging && (
                <form
                  className="k-crew-message"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const text = draft.trim()
                    if (text === '') return
                    steer(detail, 'message', text)
                    setDraft('')
                    setMessaging(false)
                  }}
                >
                  <Textarea
                    autoFocus
                    rows={2}
                    aria-label={labels.message}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <Button type="submit" size="sm" variant="primary">
                    {labels.send}
                  </Button>
                </form>
              )}
            </DialogBody>
          </DialogContent>
        )}
      </Dialog>
    </section>
  )
}
