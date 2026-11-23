// SPDX-License-Identifier: MIT
/**
 * Agent run list: the overview of runs, grouped ("Active now", "This week"), one row per run that opens its detail.
 * Agent 运行列表（KatanaUI #196）：AgentRunDetail 的列表侧。一行：左上名字、左下副标题、右上状态字（着状态色，灯加词）、右下相对时间、行尾箭头；分组带小标题。
 * 现有的 RunningNow 是标题栏里的一颗胶囊加弹层、AgentFleet 是一列主卡带状态环与子树，都不是「一行一个运行」的平列表，所以补这一件，放在详情旁边。
 * 交互借自 Jamie Merrill 的 Agent tracker（x.com/jamiemerrill，2026-11-24 看截图，只借信息结构，样子是我们的）。
 * 分组标题是真正的标题（读屏按 H 键能跳），分组用 aria-labelledby 指向它；每行是原生按钮（Tab 走、Enter / Space 打开），读屏名依次写名字、副标题、状态、时间；选中的行 aria-current。
 * 时间文字（「Started 6m ago」「Yesterday」）由调用方写好传进来，件不读钟。包里不带语言。
 */
import { ChevronRightIcon } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { runTone, type RunDetailStatus } from '../agent-run-detail/run-model.ts'

/** One run of the list. */
export type RunListItem = {
  /** Stable key; the callback gets it back. */
  id: string
  /** Run name. */
  name: string
  /** Muted line under the name (「48 contractors · United States」). */
  subtitle?: string
  /** State of the run. */
  status: RunDetailStatus
  /** Relative time already written by the caller (「Started 6m ago」). */
  when?: string
}

/** A titled group of runs. */
export type RunListGroup = {
  /** Stable key. */
  id: string
  /** Group heading. */
  title: string
  /** Runs of the group, in order. */
  items: readonly RunListItem[]
}

/** Texts of AgentRunList (the package ships no text). */
export type AgentRunListLabels = {
  /** State words. */
  status: Record<RunDetailStatus, string>
}

export type AgentRunListProps = {
  /** Heading of the list. */
  title?: ReactNode
  /** Right side of the heading, usually a button such as "New agent". */
  actions?: ReactNode
  /** Groups of runs. */
  groups: readonly RunListGroup[]
  /** The run whose detail is open. */
  selectedId?: string | null
  /** Called with the id of the run to open. */
  onOpen?: (id: string) => void
  /** Texts. */
  labels: AgentRunListLabels
  /** Extra class name on the root. */
  className?: string
}

export function AgentRunList({
  title,
  actions,
  groups,
  selectedId = null,
  onOpen,
  labels,
  className,
}: AgentRunListProps) {
  const titleId = useId()
  return (
    <section
      className={cn('k-arl', className)}
      data-slot="agent-run-list"
      aria-labelledby={title !== undefined ? titleId : undefined}
    >
      {(title !== undefined || actions !== undefined) && (
        <header className="k-arl-head">
          {title !== undefined && (
            <h3 id={titleId} className="k-arl-title">
              {title}
            </h3>
          )}
          {actions !== undefined && <div className="k-arl-actions">{actions}</div>}
        </header>
      )}
      {groups.map((group) => (
        <div
          key={group.id}
          className="k-arl-group"
          role="group"
          aria-labelledby={`${titleId}-${group.id}`}
          data-group={group.id}
        >
          <h4 id={`${titleId}-${group.id}`} className="k-arl-group-title">
            {group.title}
          </h4>
          <ul className="k-arl-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="k-arl-row"
                  data-slot="run-row"
                  data-id={item.id}
                  data-status={item.status}
                  data-tone={runTone(item.status)}
                  aria-current={selectedId === item.id ? 'true' : undefined}
                  aria-label={[item.name, item.subtitle, labels.status[item.status], item.when]
                    .filter(Boolean)
                    .join(', ')}
                  onClick={() => onOpen?.(item.id)}
                >
                  <span className="k-arl-name">{item.name}</span>
                  <span className="k-arl-state">
                    <i className="k-ard-lamp" aria-hidden="true" />
                    {labels.status[item.status]}
                  </span>
                  <span className="k-arl-subtitle">{item.subtitle}</span>
                  <span className="k-arl-when">{item.when}</span>
                  <ChevronRightIcon className="k-arl-chevron" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
