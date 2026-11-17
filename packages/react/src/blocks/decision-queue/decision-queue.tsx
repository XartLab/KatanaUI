// SPDX-License-Identifier: MIT
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { HoldToConfirm } from '../../patterns/hold-to-confirm.tsx'
import { Led } from '../../katana/led.tsx'
import { MeasuredSkeleton } from '../../katana/measured-skeleton.tsx'
import { Skeleton } from '../../katana/skeleton.tsx'
import { Button } from '../../primitives/button.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import {
  DECISION_FILTERS,
  countByFilter,
  decisionSeverity,
  effectiveStatus,
  secondsLeft,
  visibleDecisions,
  type DecisionFilter,
  type DecisionItem,
  type DecisionStatus,
} from './decision-queue-model.ts'

// 建议卡片队列（#37）：产品底线「Agent 输出只是带来源的建议，人接受后才生效」的界面。
// 每张卡：建议动作 + 对象、理由摘要、置信与依据、来源链接、生成时间、过期倒计时；按钮 接受 / 拒绝 / 稍后，回调由调用方给。
// 接受用 HoldToConfirm（按住才生效，单击不触发）；拒绝与稍后可撤，普通按钮。队列按状态筛选；已处理的收成一行（谁、何时、结果），点开才看全文。
// 样子照 uiarc 卡片（来源 + 时间、标题、摘要，待核对）与 TradingView 的提示 / 告警列表（一行一条、状态靠字与灯，读法同告警列表）的手感，实现原创。
// 件不改状态：接受 / 拒绝 / 稍后只回调，调用方把条目的 status 改了再传回来；过了有效期的待处理项按「已过期」画，接受与拒绝都关掉。
// 数据、文案、当前时间 now 全由调用方传，件不认识任何应用或交易所；detail 插槽可放 ConsensusBlock 这类「必要条件」块。

export type DecisionQueueLabels = {
  /** 整个件、筛选分段、列表的读屏名。 */
  queue: string
  filters: string
  filter: Record<DecisionFilter, string>
  accept: string
  reject: string
  snooze: string
  /** 接受按钮的读屏与悬停提示：「按住 2 秒确认接受」。 */
  acceptHint: string
  /** 接受填满后按钮上换的字（已提交）。 */
  accepted: string
  snoozed: string
  /** 各状态在一行记录与读屏里的字。 */
  status: Record<DecisionStatus, string>
  confidence: (percent: number) => string
  basis: string
  sources: string
  details: string
  /** 「生成于 3 分钟前」 */
  createdAgo: (seconds: number) => string
  /** 倒计时：「还剩 4:32」，传入剩余秒数。 */
  expiresIn: (seconds: number) => string
  expired: string
  /** 已处理的一行：「张三 · 3 分钟前」 */
  resolvedBy: (by: string, ago: string) => string
  /** 相对时间：已过去的秒数。 */
  ago: (seconds: number) => string
  absolute: (time: number) => string
  empty: Record<DecisionFilter, ReactNode>
  /** 加载中读屏读的话；不给就读 queue。 */
  loading?: string
}

export type DecisionQueueProps = {
  items: readonly DecisionItem[]
  /** 在加载：给了（含 false）队列的列表区就走量出来的骨架，false 时骨架退场、真卡片淡入；不传和以前一样。 */
  loading?: boolean
  /** 加载时拿来量骨架的示例建议（理由长度、有没有来源与详情跟真的差不多；2 到 3 张卡够用）；不给画几行条。 */
  sample?: readonly DecisionItem[]
  /** 当前时间（毫秒）：倒计时、过期都按它算，调用方每秒更新；件不在渲染里取时间。 */
  now: number
  labels: DecisionQueueLabels
  onAccept?: (item: DecisionItem) => void
  onReject?: (item: DecisionItem) => void
  onSnooze?: (item: DecisionItem) => void
  /** 卡上「详情」展开的内容（如 ConsensusBlock）；返回空就没有详情按钮。 */
  renderDetail?: (item: DecisionItem) => ReactNode
  /** 对象旁的内容（如品种徽标），可省。 */
  renderTarget?: (item: DecisionItem) => ReactNode
  defaultFilter?: DecisionFilter
  onFilterChange?: (filter: DecisionFilter) => void
  /** 按住多久才算接受（毫秒），传给 HoldToConfirm。 */
  holdMs?: number
  className?: string
}

export function DecisionQueue({
  items,
  loading,
  sample,
  now,
  labels,
  onAccept,
  onReject,
  onSnooze,
  renderDetail,
  renderTarget,
  defaultFilter = 'pending',
  onFilterChange,
  holdMs,
  className,
}: DecisionQueueProps) {
  const [filter, setFilter] = useState<DecisionFilter>(defaultFilter)
  const counts = countByFilter(items, now)
  const rows = visibleDecisions(items, filter, now)
  const shared = { now, labels, renderDetail, renderTarget }
  const loadingLabel = labels.loading ?? labels.queue
  // 一列卡片；加载时用示例建议排同样的版，量出来的骨架就和真卡对得上。
  const list = (shown: readonly DecisionItem[]) =>
    shown.length === 0 ? (
      <div className="k-dq-empty">{labels.empty[filter]}</div>
    ) : (
      <ol className="k-dq-list" aria-label={labels.queue}>
        {shown.map((item) => {
          const status = effectiveStatus(item, now)
          return (
            <li key={item.id} className="k-dq-item" data-status={status} data-decision-id={item.id}>
              {status === 'pending' || status === 'snoozed' ? (
                <OpenCard
                  item={item}
                  status={status}
                  holdMs={holdMs}
                  onAccept={onAccept}
                  onReject={onReject}
                  onSnooze={onSnooze}
                  {...shared}
                />
              ) : (
                <DoneRow item={item} status={status} {...shared} />
              )}
            </li>
          )
        })}
      </ol>
    )
  return (
    <section className={cn('k-dq', className)} aria-label={labels.queue}>
      <ToggleGroup
        size="sm"
        aria-label={labels.filters}
        value={filter}
        onValueChange={(next) => {
          if (!next) return
          setFilter(next as DecisionFilter)
          onFilterChange?.(next as DecisionFilter)
        }}
      >
        {DECISION_FILTERS.map((f) => (
          <ToggleGroupItem key={f} value={f}>
            {labels.filter[f]}
            <span className="k-dq-count" data-testid={`dq-count-${f}`}>
              {counts[f]}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="k-dq-scroll">
        {loading === undefined ? (
          list(rows)
        ) : loading && sample === undefined ? (
          <Skeleton label={loadingLabel} lines={8} rows />
        ) : (
          <MeasuredSkeleton loading={loading} label={loadingLabel}>
            {list(loading ? (sample ?? []) : rows)}
          </MeasuredSkeleton>
        )}
      </div>
    </section>
  )
}

type Shared = Pick<DecisionQueueProps, 'now' | 'renderDetail' | 'renderTarget'> & { labels: DecisionQueueLabels }

function Headline({ item, labels, renderTarget }: { item: DecisionItem } & Pick<Shared, 'labels' | 'renderTarget'>) {
  return (
    <div className="k-dq-head">
      <span className="k-dq-action">{item.action}</span>
      {renderTarget?.(item)}
      <span className="k-dq-target">{item.target}</span>
      {item.targetTag && <span className="k-dq-tag">{item.targetTag}</span>}
      <span className="sr-only">{labels.status[item.status]}</span>
    </div>
  )
}

function Body({ item, labels }: { item: DecisionItem; labels: DecisionQueueLabels }) {
  return (
    <>
      <p className="k-dq-rationale">{item.rationale}</p>
      {(item.confidence !== undefined || item.basis) && (
        <div className="k-dq-evidence">
          {item.confidence !== undefined && (
            <span className="k-dq-conf" data-testid="dq-confidence">
              <span className="k-dq-conf-bar" aria-hidden="true">
                <i style={{ width: `${Math.round(item.confidence * 100)}%` }} />
              </span>
              {labels.confidence(Math.round(item.confidence * 100))}
            </span>
          )}
          {item.basis && (
            <span className="k-dq-basis">
              <span className="k-dq-basis-label">{labels.basis}</span> {item.basis}
            </span>
          )}
        </div>
      )}
      {item.sources.length > 0 && (
        <ul className="k-dq-sources" aria-label={labels.sources}>
          {item.sources.map((s) => (
            <li key={s.href}>
              <a className="k-dq-source" href={s.href} target="_blank" rel="noreferrer">
                <ExternalLink size={11} aria-hidden />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function OpenCard({
  item,
  status,
  now,
  labels,
  renderDetail,
  renderTarget,
  holdMs,
  onAccept,
  onReject,
  onSnooze,
}: { item: DecisionItem; status: DecisionStatus } & Shared &
  Pick<DecisionQueueProps, 'holdMs' | 'onAccept' | 'onReject' | 'onSnooze'>) {
  const [detailOpen, setDetailOpen] = useState(false)
  const detailId = useId()
  const left = secondsLeft(item, now)
  const detail = renderDetail?.(item)
  const age = Math.max(0, Math.floor((now - item.createdAt) / 1000))
  return (
    <article className="k-dq-card" aria-label={`${item.action} ${item.target}`}>
      <div className="k-dq-meta">
        <Led tone={decisionSeverity(status)} small label={labels.status[status]} />
        {status === 'snoozed' && <span className="k-dq-snoozed">{labels.snoozed}</span>}
        <time
          className="k-dq-time"
          dateTime={new Date(item.createdAt).toISOString()}
          title={labels.absolute(item.createdAt)}
        >
          {labels.createdAgo(age)}
        </time>
        {left !== null && (
          <span className="k-dq-left" data-urgent={left <= 60 ? '' : undefined} data-testid="dq-left">
            {labels.expiresIn(left)}
          </span>
        )}
      </div>
      <Headline item={item} labels={labels} renderTarget={renderTarget} />
      <Body item={item} labels={labels} />
      {detail ? (
        <>
          <button
            type="button"
            className="k-dq-more"
            aria-expanded={detailOpen}
            aria-controls={detailId}
            onClick={() => setDetailOpen(!detailOpen)}
          >
            <ChevronRight size={12} aria-hidden />
            {labels.details}
          </button>
          {detailOpen && (
            <div id={detailId} className="k-dq-detail">
              {detail}
            </div>
          )}
        </>
      ) : null}
      <div className="k-dq-buttons">
        <HoldToConfirm
          tone="neutral"
          labels={{ hint: labels.acceptHint, confirmed: labels.accepted }}
          holdMs={holdMs}
          onConfirm={() => onAccept?.(item)}
        >
          {labels.accept}
        </HoldToConfirm>
        <Button onClick={() => onReject?.(item)}>{labels.reject}</Button>
        {status === 'pending' && <Button onClick={() => onSnooze?.(item)}>{labels.snooze}</Button>}
      </div>
    </article>
  )
}

function DoneRow({ item, status, now, labels, renderTarget }: { item: DecisionItem; status: DecisionStatus } & Shared) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const at = item.resolvedAt ?? item.expiresAt ?? item.createdAt
  const ago = labels.ago(Math.max(0, Math.floor((now - at) / 1000)))
  return (
    <div className="k-dq-done">
      <button
        type="button"
        className="k-dq-row"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <ChevronRight size={12} aria-hidden className="k-dq-chevron" />
        <Led tone={decisionSeverity(status)} small label={labels.status[status]} />
        <span className="k-dq-result">{labels.status[status]}</span>
        <span className="k-dq-action">{item.action}</span>
        {renderTarget?.(item)}
        <span className="k-dq-target">{item.target}</span>
        <span className="k-dq-who" title={labels.absolute(at)}>
          {status === 'expired' || !item.resolvedBy ? ago : labels.resolvedBy(item.resolvedBy, ago)}
        </span>
      </button>
      {open && (
        <div id={bodyId} className="k-dq-done-body">
          <Body item={item} labels={labels} />
        </div>
      )}
    </div>
  )
}
