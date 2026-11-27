// SPDX-License-Identifier: MIT
/**
 * Agent lanes: a live timeline with one lane per agent, task blocks that grow toward now, hand-off lines between lanes, and Approve / Reject on blocks that wait for a person.
 * 多 Agent 泳道（KATANAview #1908 第三批）：几个 Agent 并行时，每个 Agent 一条泳道（左边头像缩写、名字、模型、标签：空闲 / 在忙 / 要你），
 * 右边最近 span 毫秒的时间轴上画它的任务块（完成、在跑斜纹、等人 warn、失败 danger），没结束的长到 now；一个 Agent 交给另一个时，从交出那一块的结束处画一道竖线到接手的泳道。
 * 点块或 Enter 打开它：等人的块弹出问题与「批准」「拒绝」（焦点先到批准），别的块写做了什么、用了哪些工具，给了 onOpen 有「打开」。头上写几个块等人（读屏会播）。
 * 功能参照 affectUI 的 Agent Lanes（affectui.com/components/agent-lanes，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：件不走钟（now 由调用方给）；不放头像图片，只写缩写。产品底线：批准与拒绝只把人的决定回调出去；不给回调时件自己改块的状态（批准接着跑、拒绝算失败），只在文档站演示用。
 * 弹层用我们的 Popover。纯逻辑在 lanes-model.ts。包里不带语言。
 */
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import {
  agentTag,
  attentionCount,
  blockSpan,
  handoffLinks,
  type LaneAgent,
  type LaneTask,
  type LaneTaskStatus,
} from './lanes-model.ts'

/** Texts of AgentLanes (the package ships no text). */
export type AgentLanesLabels = {
  /** Block status words. */
  status: Record<LaneTaskStatus, string>
  /** Lane tags. */
  tag: Record<'needs' | 'busy' | 'idle', string>
  /** Live attention line (「2 个块等你」); empty string when none. */
  attention: (count: number) => string
  /** Decision buttons and the open link. */
  approve: string
  reject: string
  open: string
  /** Field name of the tools list. */
  tools: string
  /** Hand-off text in a block's details (「交给 审查员」). */
  handoff: (agent: string) => string
}

export type AgentLanesProps = {
  /** Lanes, top to bottom. */
  agents: readonly LaneAgent[]
  /** Task blocks on all lanes. */
  tasks: readonly LaneTask[]
  /** Clock in milliseconds; the component does not tick on its own. */
  now: number
  /** Visible window in milliseconds, ending at now. */
  span?: number
  /** Approves a waiting block; without it the block goes on running. */
  onApprove?: (task: LaneTask) => void
  /** Rejects a waiting block; without it the block fails. */
  onReject?: (task: LaneTask) => void
  /** Shows Open on non-waiting blocks. */
  onOpen?: (task: LaneTask) => void
  /** Heading. */
  title: ReactNode
  /** How a time is written (axis and block names). */
  formatTime: (time: number) => string
  /** Texts. */
  labels: AgentLanesLabels
  /** Extra class name on the root. */
  className?: string
}

export function AgentLanes({
  agents,
  tasks: tasksProp,
  now,
  span = 30 * 60_000,
  onApprove,
  onReject,
  onOpen,
  title,
  formatTime,
  labels,
  className,
}: AgentLanesProps) {
  const [decided, setDecided] = useState<Readonly<Record<string, LaneTaskStatus>>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const tasks = tasksProp.map((task) =>
    decided[task.id] === undefined ? task : { ...task, status: decided[task.id]! },
  )
  const from = now - span
  const links = handoffLinks(tasks, agents, from, now, now)
  const attention = attentionCount(tasks)
  const nameOf = (id: string) => agents.find((agent) => agent.id === id)?.name ?? id
  const decide = (task: LaneTask, approve: boolean) => {
    const callback = approve ? onApprove : onReject
    if (callback === undefined) setDecided({ ...decided, [task.id]: approve ? 'running' : 'failed' })
    else callback(task)
    setOpenId(null)
  }

  return (
    <section className={cn('k-al', className)} data-slot="agent-lanes">
      <header className="k-al-head">
        <h4 className="k-al-title">{title}</h4>
        <span className="k-al-attention" aria-live="polite" data-slot="lanes-attention">
          {labels.attention(attention)}
        </span>
      </header>
      <div className="k-al-board" style={{ gridTemplateRows: `20px repeat(${agents.length}, 40px)` }}>
        <span className="k-al-axis" aria-hidden="true">
          <i data-align="start">{formatTime(from)}</i>
          <i data-align="mid">{formatTime(from + span / 2)}</i>
          <i data-align="end">{formatTime(now)}</i>
        </span>
        {agents.map((agent, n) => {
          const tag = agentTag(agent.id, tasks)
          return (
            <div key={agent.id} className="k-al-lane" style={{ gridRow: n + 2 }} data-slot="lanes-lane" data-tag={tag}>
              <span className="k-al-who">
                <span className="k-al-avatar" aria-hidden="true">
                  {agent.initials ?? agent.name.slice(0, 1)}
                </span>
                <span className="k-al-name">
                  <span>{agent.name}</span>
                  {agent.model !== undefined && <small>{agent.model}</small>}
                </span>
                {tag !== 'busy' && <small className="k-al-tag">{labels.tag[tag]}</small>}
              </span>
              <ul className="k-al-track" aria-label={agent.name}>
                {tasks
                  .filter((task) => task.agent === agent.id)
                  .map((task) => {
                    const at = blockSpan(task, from, now, now)
                    if (at === null) return null
                    const when = `${formatTime(task.start)}–${task.end === undefined ? formatTime(now) : formatTime(task.end)}`
                    return (
                      <li
                        key={task.id}
                        className="k-al-slot"
                        style={{
                          left: `${(at.left * 100).toFixed(3)}%`,
                          width: `max(6px, ${(at.width * 100).toFixed(3)}%)`,
                        }}
                      >
                        <Popover open={openId === task.id} onOpenChange={(next) => setOpenId(next ? task.id : null)}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="k-al-block"
                              data-slot="lanes-block"
                              data-id={task.id}
                              data-status={task.status}
                              aria-label={[agent.name, task.title, labels.status[task.status], when].join('，')}
                            >
                              <span>{task.title}</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="k-al-pop" aria-label={task.title}>
                            <p className="k-al-pop-title">
                              {task.title} · {labels.status[task.status]}
                            </p>
                            <p className="k-al-pop-time">{when}</p>
                            {task.status === 'waiting' ? (
                              <>
                                {task.ask !== undefined && <p className="k-al-ask">{task.ask}</p>}
                                <div className="k-al-decide">
                                  <Button size="sm" variant="primary" onClick={() => decide(task, true)}>
                                    {labels.approve}
                                  </Button>
                                  <Button size="sm" variant="danger" onClick={() => decide(task, false)}>
                                    {labels.reject}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                {task.summary !== undefined && <p className="k-al-summary">{task.summary}</p>}
                                {task.tools !== undefined && task.tools.length > 0 && (
                                  <p className="k-al-tools">
                                    {labels.tools}：{task.tools.join(' · ')}
                                  </p>
                                )}
                                {task.handoff !== undefined && (
                                  <p className="k-al-tools">{labels.handoff(nameOf(task.handoff))}</p>
                                )}
                                {onOpen !== undefined && (
                                  <Button size="sm" variant="link" onClick={() => onOpen(task)}>
                                    {labels.open}
                                  </Button>
                                )}
                              </>
                            )}
                          </PopoverContent>
                        </Popover>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )
        })}
        {agents.length > 0 && (
          <svg
            className="k-al-links"
            style={{ gridRow: `2 / ${agents.length + 2}` }}
            viewBox={`0 0 100 ${agents.length * 10}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {links.map((link) => (
              <g key={link.id} data-slot="lanes-handoff">
                <line x1={link.x * 100} x2={link.x * 100} y1={link.from * 10 + 5} y2={link.to * 10 + 5} />
                <circle cx={link.x * 100} cy={link.to * 10 + 5} r={0.8} />
              </g>
            ))}
          </svg>
        )}
      </div>
    </section>
  )
}
