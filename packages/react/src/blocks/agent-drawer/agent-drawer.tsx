// SPDX-License-Identifier: MIT
/**
 * Agent drawer: the profile of one agent (what it is, how it starts, who owns it, how much it is used, what it ran lately) in a panel that fits a side sheet or a docked pane.
 * Agent 档案抽屉：头（名字、一句说明）、属性区（状态、标签、触发、负责人、创建时间）、三个页签（用量 / 配置 / 历史）；用量页内置两块：
 * 顶上的指标卡（节省时间、本月花费，数值与环比由调用方写好）、活动热力格（AgentActivity）、最近运行列表（点一行只回调运行 id，可接 AgentRunDetail）。
 * 配置与历史的内容是调用方给的槽；没给槽的页签不出现。底部 footer 槽放「通知我」「暂停」这类动作，件自己不做动作。
 * 信息结构与交互借自 Jamie Merrill 公开的 Agent 抽屉与 Agent tracker 表格截图（2026-11-24 读），样子是 KatanaUI 的：中性灰的热力格，不用它的蓝；实现原创。
 * 用色：状态与结果的字、图标走 --k-status-*；「在跑」与「进行中」用中性亮色 --k-content-primary-foreground，不用 accent（Graphite 下是橙，色弱下与失败红分不出，#211），
 * 靠转圈图标加状态词表达在动；暂停是 warn，停用是 neutral。状态永不单靠颜色：图标与词一起写。
 * 件不取时间：创建时间、相对时间、时长都由调用方格式化后给；包里不带语言。放进抽屉用 Sheet（renderTitle 与 renderDescription 接 SheetTitle、SheetDescription），放进面板直接摆。
 * 表格（Agent 列表）不新建件：用 DataGrid 的 custom 列加 onOpen，演示见文档站。纯逻辑在 agent-drawer-model.ts。
 */
import {
  CalendarClock,
  CircleCheck,
  CirclePause,
  CircleSlash,
  CircleX,
  Hand,
  LoaderCircle,
  Tag as TagIcon,
  Upload,
  User,
  Zap,
  Calendar,
  CircleDot,
  CircleMinus,
} from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import type { Severity } from '../../lib/severity.ts'
import { Avatar } from '../../primitives/avatar.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../primitives/tabs.tsx'
import { Tag } from '../../katana/tag.tsx'
import { AgentActivity, type AgentActivityProps } from './agent-activity.tsx'
import {
  agentStatusTone,
  runResultTone,
  type AgentRunResult,
  type AgentStatus,
  type AgentTone,
  type AgentTrigger,
} from './agent-drawer-model.ts'

/** The drawer's tabs. */
export type AgentDrawerTab = 'usage' | 'configure' | 'history'

/** One metric card on the usage page: label, value, a change badge. */
export type AgentMetric = {
  id: string
  label: string
  /** Value as text, formatted by the caller ("155"). */
  value: string
  /** Small text after the value ("hours"). */
  unit?: string
  /** Icon before the label; decorative. */
  icon?: ReactNode
  /** Change versus the last period, written by the caller ("+8%"), with the tone it should wear (more time saved is ok, more cost is warn). */
  delta?: { text: string; tone: Severity }
}

/** One row of the recent runs list. */
export type AgentRecentRun = {
  id: string
  /** Who or what started it: a person's name, or the source ("price breakout"). */
  actor: string
  /** How it started; shows the trigger's icon before the name. */
  trigger?: AgentTrigger
  result: AgentRunResult
  /** Start time in milliseconds; written by formatTime. */
  startedAt: number
  /** How long it took in milliseconds; a run still going has none. */
  durationMs?: number
}

/** Texts of AgentDrawer. */
export type AgentDrawerLabels = {
  /** Names of the properties. */
  properties: { status: string; tags: string; trigger: string; owner: string; created: string }
  /** The three statuses as words. */
  statuses: Record<AgentStatus, string>
  /** The four triggers as words. */
  triggers: Record<AgentTrigger, string>
  /** The four run results as words. */
  results: Record<AgentRunResult, string>
  /** Tab names and the accessible name of the tab list. */
  tabs: { list: string; usage: string; configure: string; history: string }
  /** Heading above the activity grid. */
  activity: string
  /** Accessible name of the activity grid. */
  activityGrid: string
  /** Ends of the activity legend. */
  legend: { less: string; more: string }
  /** Heading above the recent runs. */
  recentRuns: string
  /** Line when there are no runs. */
  noRuns: string
  /** Accessible name of the metric cards. */
  metrics: string
}

export type AgentDrawerProps = {
  /** Agent name. */
  name: ReactNode
  /** One line about it. */
  description?: ReactNode
  /** Whether the agent is running, paused or disabled. */
  status: AgentStatus
  /** Tags, as text. */
  tags?: readonly string[]
  /** How it starts; detail is the schedule or the rule ("weekdays 08:30"). */
  trigger: { kind: AgentTrigger; detail?: string }
  /** Who is responsible. Without avatar the initials show. */
  owner: { name: string; avatar?: string; initials?: string }
  /** Creation date, formatted by the caller. */
  created: ReactNode
  /** Metric cards at the top of the usage page. */
  metrics?: readonly AgentMetric[]
  /** Activity grid data and sentence writer; see AgentActivity. */
  activity: Pick<
    AgentActivityProps,
    'days' | 'from' | 'to' | 'weekStart' | 'max' | 'monthLabels' | 'weekdayLabels' | 'describe' | 'idle'
  >
  /** Recent runs, newest first. */
  runs: readonly AgentRecentRun[]
  /** Called with the run id when a row is clicked or gets Enter; without it the rows are plain text. */
  onOpenRun?: (id: string) => void
  /** How a run's start is written ("6m ago"); the component does not read the clock. */
  formatTime: (at: number) => string
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** Content of the Configure tab; without it there is no such tab. */
  configure?: ReactNode
  /** Content of the History tab; without it there is no such tab. */
  history?: ReactNode
  /** Current tab (controlled). A tab without content falls back to usage. */
  tab?: AgentDrawerTab
  /** Tab at first (uncontrolled); defaults to usage. A tab without content falls back to usage. */
  defaultTab?: AgentDrawerTab
  /** Called when the tab changes. */
  onTabChange?: (tab: AgentDrawerTab) => void
  /** Actions pinned at the bottom (notify me, pause agent); the component runs none of them. */
  footer?: ReactNode
  /** Writes the title element; inside a Sheet pass `(props) => <SheetTitle {...props} />` so the dialog is named by it. Defaults to an h2. */
  renderTitle?: (props: { className: string; children: ReactNode }) => ReactNode
  /** Writes the description element; inside a Sheet pass `(props) => <SheetDescription {...props} />`. Defaults to a p. */
  renderDescription?: (props: { className: string; children: ReactNode }) => ReactNode
  /** Texts. */
  labels: AgentDrawerLabels
  /** Extra class name on the root. */
  className?: string
}

const TRIGGER_ICON: Record<AgentTrigger, typeof Zap> = {
  schedule: CalendarClock,
  event: Zap,
  upload: Upload,
  manual: Hand,
}

const STATUS_ICON: Record<AgentStatus, typeof Zap> = {
  running: LoaderCircle,
  paused: CirclePause,
  disabled: CircleSlash,
}

const RESULT_ICON: Record<AgentRunResult, typeof Zap> = {
  ok: CircleCheck,
  failed: CircleX,
  running: LoaderCircle,
  cancelled: CircleMinus,
}

/** 名字缩写：多个词取前两个词的首字母，单个词（含中文名）取前两个字。 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const chars = (text: string) => Array.from(text)
  return words.length > 1 ? words[0]![0]! + words[1]![0]! : chars(words[0]!).slice(0, 2).join('')
}

function ToneMark({ tone, icon: Icon, spin }: { tone: AgentTone; icon: typeof Zap; spin?: boolean }) {
  return <Icon aria-hidden="true" className={cn('k-ad-mark', spin && 'k-ad-spin')} data-tone={tone} />
}

function Property({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="k-ad-key">
        <span className="k-ad-key-icon" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="k-ad-value">{children}</dd>
    </>
  )
}

export function AgentDrawer({
  name,
  description,
  status,
  tags,
  trigger,
  owner,
  created,
  metrics,
  activity,
  runs,
  onOpenRun,
  formatTime,
  formatDuration,
  configure,
  history,
  tab,
  defaultTab = 'usage',
  onTabChange,
  footer,
  renderTitle,
  renderDescription,
  labels,
  className,
}: AgentDrawerProps) {
  const titleId = useId()
  // 重复的标签只画一枚（调用方拼出来的标签难免重复，重复的标签没有信息）。
  const uniqueTags = tags ? [...new Set(tags)] : []
  const tone = agentStatusTone(status)
  const TriggerIcon = TRIGGER_ICON[trigger.kind]
  const title = (props: { className: string; children: ReactNode }) =>
    renderTitle ? renderTitle(props) : <h2 id={titleId} {...props} />
  const about = (props: { className: string; children: ReactNode }) =>
    renderDescription ? renderDescription(props) : <p {...props} />
  // 受控与不受控固定成一种：件自己记页签，tab 给了就听它的；指向没给槽的页签时落到用量。
  const [innerTab, setInnerTab] = useState<AgentDrawerTab>(defaultTab)
  const wanted = tab ?? innerTab
  const current: AgentDrawerTab =
    (wanted === 'configure' && configure !== undefined) || (wanted === 'history' && history !== undefined)
      ? wanted
      : 'usage'

  return (
    <section
      className={cn('k-ad', className)}
      data-slot="agent-drawer"
      data-status={status}
      aria-labelledby={renderTitle ? undefined : titleId}
    >
      <header className="k-ad-head">
        {title({ className: 'k-ad-title', children: name })}
        {description ? about({ className: 'k-ad-desc', children: description }) : null}
      </header>
      <div className="k-ad-scroll">
        <dl className="k-ad-props" data-slot="agent-drawer-props">
          <Property icon={<CircleDot />} label={labels.properties.status}>
            <span className="k-ad-status" data-slot="agent-drawer-status" data-tone={tone} data-status={status}>
              <ToneMark tone={tone} icon={STATUS_ICON[status]} spin={status === 'running'} />
              {labels.statuses[status]}
            </span>
          </Property>
          {uniqueTags.length > 0 ? (
            <Property icon={<TagIcon />} label={labels.properties.tags}>
              <ul className="k-ad-tags">
                {uniqueTags.map((text, index) => (
                  <li key={`${index}-${text}`}>
                    <Tag>{text}</Tag>
                  </li>
                ))}
              </ul>
            </Property>
          ) : null}
          <Property icon={<Zap />} label={labels.properties.trigger}>
            <span className="k-ad-trigger" data-slot="agent-drawer-trigger" data-trigger={trigger.kind}>
              <TriggerIcon aria-hidden="true" className="k-ad-mark" />
              {labels.triggers[trigger.kind]}
              {trigger.detail ? <span className="k-ad-detail">{trigger.detail}</span> : null}
            </span>
          </Property>
          <Property icon={<User />} label={labels.properties.owner}>
            <span className="k-ad-owner">
              <span aria-hidden="true" className="k-ad-avatar">
                <Avatar
                  size="sm"
                  src={owner.avatar}
                  alt={owner.name}
                  fallback={owner.initials ?? initialsOf(owner.name)}
                />
              </span>
              {owner.name}
            </span>
          </Property>
          <Property icon={<Calendar />} label={labels.properties.created}>
            {created}
          </Property>
        </dl>

        <Tabs
          value={current}
          onValueChange={(value) => {
            if (tab === undefined) setInnerTab(value as AgentDrawerTab)
            onTabChange?.(value as AgentDrawerTab)
          }}
          className="k-ad-tabs"
        >
          <TabsList variant="line" aria-label={labels.tabs.list} className="k-ad-tablist">
            <TabsTrigger value="usage">{labels.tabs.usage}</TabsTrigger>
            {configure !== undefined ? <TabsTrigger value="configure">{labels.tabs.configure}</TabsTrigger> : null}
            {history !== undefined ? <TabsTrigger value="history">{labels.tabs.history}</TabsTrigger> : null}
          </TabsList>
          <TabsContent value="usage" className="k-ad-usage">
            {metrics && metrics.length > 0 ? (
              <ul className="k-ad-metrics" aria-label={labels.metrics} data-slot="agent-drawer-metrics">
                {metrics.map((metric) => (
                  <li key={metric.id} className="k-ad-metric" data-slot="agent-drawer-metric" data-id={metric.id}>
                    <div className="k-ad-metric-head">
                      {metric.icon ? (
                        <span className="k-ad-metric-icon" aria-hidden="true">
                          {metric.icon}
                        </span>
                      ) : null}
                      <span className="k-ad-metric-label">{metric.label}</span>
                      {metric.delta ? (
                        <Tag tone={metric.delta.tone} className="k-ad-delta">
                          {metric.delta.text}
                        </Tag>
                      ) : null}
                    </div>
                    <div className="k-ad-metric-value">
                      {metric.value}
                      {metric.unit ? <span className="k-ad-metric-unit">{metric.unit}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <section className="k-ad-block" aria-labelledby={`${titleId}-activity`}>
              <h3 id={`${titleId}-activity`} className="k-ad-h">
                {labels.activity}
              </h3>
              <AgentActivity {...activity} label={labels.activityGrid} legend={labels.legend} />
            </section>
            <section className="k-ad-block" aria-labelledby={`${titleId}-runs`}>
              <h3 id={`${titleId}-runs`} className="k-ad-h">
                {labels.recentRuns}
              </h3>
              {runs.length === 0 ? (
                <p className="k-ad-empty">{labels.noRuns}</p>
              ) : (
                <ul className="k-ad-runs" data-slot="agent-drawer-runs">
                  {runs.map((run) => {
                    const ResultIcon = RESULT_ICON[run.result]
                    const resultTone = runResultTone(run.result)
                    const TriggerOfRun = run.trigger ? TRIGGER_ICON[run.trigger] : null
                    const body = (
                      <>
                        {TriggerOfRun ? <TriggerOfRun aria-hidden="true" className="k-ad-mark" /> : null}
                        {run.trigger ? <span className="k-ad-sr">{labels.triggers[run.trigger]}</span> : null}
                        <span className="k-ad-run-actor">{run.actor}</span>
                        <span className="k-ad-run-meta">
                          {run.durationMs === undefined ? null : <span>{formatDuration(run.durationMs)}</span>}
                          <span>{formatTime(run.startedAt)}</span>
                        </span>
                        <span className="k-ad-run-result" data-tone={resultTone} data-result={run.result}>
                          <ResultIcon
                            aria-hidden="true"
                            className={cn('k-ad-mark', run.result === 'running' && 'k-ad-spin')}
                          />
                          {labels.results[run.result]}
                        </span>
                      </>
                    )
                    return (
                      <li key={run.id} className="k-ad-run" data-slot="agent-drawer-run" data-id={run.id}>
                        {onOpenRun ? (
                          <button type="button" className="k-ad-run-body is-link" onClick={() => onOpenRun(run.id)}>
                            {body}
                          </button>
                        ) : (
                          <div className="k-ad-run-body">{body}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </TabsContent>
          {configure !== undefined ? <TabsContent value="configure">{configure}</TabsContent> : null}
          {history !== undefined ? <TabsContent value="history">{history}</TabsContent> : null}
        </Tabs>
      </div>
      {footer ? (
        <footer className="k-ad-foot-actions" data-slot="agent-drawer-footer">
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
