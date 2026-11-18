// SPDX-License-Identifier: MIT
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Led } from '../../katana/led.tsx'
import { MeasuredSkeleton } from '../../katana/measured-skeleton.tsx'
import { Skeleton } from '../../katana/skeleton.tsx'
import { ChipGroup } from '../../patterns/chip-group.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import {
  HYPOTHESIS_LAYERS,
  HYPOTHESIS_STATUSES,
  countByLayer,
  countByStatus,
  countEvidence,
  daysLeft,
  effectiveStatus,
  hypothesisSeverity,
  visibleHypotheses,
  type EvidenceKind,
  type Hypothesis,
  type HypothesisLayer,
  type HypothesisStatus,
  type WatchRow,
} from './hypothesis-ledger-model.ts'

// 假说账（#43）：研究「地缘与国内利益结构 → 货币与信用流向 → 购买力与利润再分配 → 资产定价」这类框架用的面板。
// 一条假说一行、可展开：命题、所属传导层、状态、提前写好的失败条件与检验期限（到期倒计时，过期自动标）、证据列表
// （学者观点 / 政策原文 / 数据 / 财报，各带发布时间、来源链接、支持或反对）、关联品种或资产。顶上按层与状态筛选；
// 同一面板可切「观察表」：传导层 × 核心证据 × 最容易混淆的地方。
// 把学者观点、已发生的政策与资金变化、我们的假说分开放：证据按类型打标，假说自己永远是「命题」，不混排。
// 对设计稿 HypothesisLedger 卡的功能（假设账、证据与反例、状态），字段按用户 2026-11-15 的框架重写；样子照 TradingView 的告警列表（一行一条、
// 状态靠灯与字）和 uiarc 卡片（来源 + 时间、标题、摘要，待核对）的手感，实现原创。
// 件不改状态：状态由调用方写回；待验证过了期限按「过期」画。数据、文案、当前时间 now 全由调用方传，件不认识任何应用或交易所。

export type HypothesisLedgerLabels = {
  ledger: string
  views: string
  viewLedger: string
  viewWatch: string
  statusFilter: string
  layerFilter: string
  clearLayers: string
  all: string
  layer: Record<HypothesisLayer, string>
  status: Record<HypothesisStatus, string>
  kind: Record<EvidenceKind, string>
  stance: { support: string; oppose: string }
  failure: string
  evidence: string
  assets: string
  noEvidence: string
  /** 一行上的证据对比：「2 支持 · 1 反对」。 */
  tally: (support: number, oppose: number) => string
  /** 倒计时：传入剩余整天数（0 表示今天到期）。 */
  deadlineIn: (days: number) => string
  /** 过期：传入已过去的整天数。 */
  overdueBy: (days: number) => string
  /** 日期的显示，如「2026-11-01」。 */
  date: (time: number) => string
  empty: ReactNode
  watchLayer: string
  watchEvidence: string
  watchConfusion: string
  /** 加载中读屏读的话；不给就读 ledger。 */
  loading?: string
}

export type HypothesisLedgerProps = {
  items: readonly Hypothesis[]
  /** 在加载：给了（含 false）账本的列表区就走量出来的骨架，false 时骨架退场、真假说淡入；不传和以前一样。 */
  loading?: boolean
  /** 加载时拿来量骨架的示例假说（命题长度、证据条数跟真的差不多；4 到 6 条够用）；不给画几行条。 */
  sample?: readonly Hypothesis[]
  /** 观察表的行；不给就没有「观察表」视图。 */
  watch?: readonly WatchRow[]
  /** 当前时间（毫秒）：倒计时、过期都按它算；件不在渲染里取时间。 */
  now: number
  labels: HypothesisLedgerLabels
  /** 关联资产旁的内容（如品种徽标），可省。 */
  renderAsset?: (asset: { label: string; tag?: string }) => ReactNode
  defaultView?: 'ledger' | 'watch'
  className?: string
}

export function HypothesisLedger({
  items,
  loading,
  sample,
  watch,
  now,
  labels,
  renderAsset,
  defaultView = 'ledger',
  className,
}: HypothesisLedgerProps) {
  const [view, setView] = useState<'ledger' | 'watch'>(watch ? defaultView : 'ledger')
  const [status, setStatus] = useState<HypothesisStatus | 'all'>('all')
  const [layers, setLayers] = useState<HypothesisLayer[]>([])
  const byStatus = countByStatus(items, layers, now)
  const byLayer = countByLayer(items, status, now)
  const rows = visibleHypotheses(items, { layers, status }, now)
  const loadingLabel = labels.loading ?? labels.ledger
  // 一张账本列表；加载时用示例假说排同样的版，量出来的骨架就和真行对得上。
  const list = (shown: readonly Hypothesis[]) =>
    shown.length === 0 ? (
      <div className="k-hl-empty">{labels.empty}</div>
    ) : (
      <ol className="k-hl-list" aria-label={labels.ledger}>
        {shown.map((h) => (
          <li key={h.id} className="k-hl-item" data-hypothesis-id={h.id}>
            <Row h={h} now={now} labels={labels} renderAsset={renderAsset} />
          </li>
        ))}
      </ol>
    )
  return (
    <section className={cn('k-hl', className)} aria-label={labels.ledger}>
      <div className="k-hl-bar">
        {watch && (
          <ToggleGroup
            size="sm"
            aria-label={labels.views}
            value={view}
            onValueChange={(next) => next && setView(next as 'ledger' | 'watch')}
          >
            <ToggleGroupItem value="ledger">{labels.viewLedger}</ToggleGroupItem>
            <ToggleGroupItem value="watch">{labels.viewWatch}</ToggleGroupItem>
          </ToggleGroup>
        )}
        {view === 'ledger' && (
          <ToggleGroup
            size="sm"
            aria-label={labels.statusFilter}
            value={status}
            onValueChange={(next) => next && setStatus(next as HypothesisStatus | 'all')}
          >
            {(['all', ...HYPOTHESIS_STATUSES] as const).map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s === 'all' ? labels.all : labels.status[s]}
                <span className="k-hl-count" data-testid={`hl-count-${s}`}>
                  {byStatus[s]}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      {view === 'ledger' ? (
        <>
          <ChipGroup
            label={labels.layerFilter}
            labels={{ clear: labels.clearLayers }}
            value={layers}
            onValueChange={(next) => setLayers(next as HypothesisLayer[])}
            items={HYPOTHESIS_LAYERS.map((l) => ({ value: l, label: labels.layer[l], count: byLayer[l] }))}
          />
          <div className="k-hl-scroll">
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
        </>
      ) : (
        <div className="k-hl-scroll">
          <table className="k-hl-watch k-table-comfortable">
            <thead>
              <tr>
                <th scope="col">{labels.watchLayer}</th>
                <th scope="col">{labels.watchEvidence}</th>
                <th scope="col">{labels.watchConfusion}</th>
              </tr>
            </thead>
            <tbody>
              {(watch ?? []).map((w) => (
                <tr key={w.layer}>
                  <th scope="row">{labels.layer[w.layer]}</th>
                  <td>{w.evidence}</td>
                  <td>{w.confusion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Row({
  h,
  now,
  labels,
  renderAsset,
}: {
  h: Hypothesis
  now: number
  labels: HypothesisLedgerLabels
  renderAsset: HypothesisLedgerProps['renderAsset']
}) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const status = effectiveStatus(h, now)
  const { support, oppose } = countEvidence(h)
  const left = daysLeft(h, now)
  const over = Math.max(0, Math.floor((now - h.deadline) / 86_400_000))
  const timing =
    status === 'expired'
      ? labels.overdueBy(over)
      : status === 'pending'
        ? labels.deadlineIn(left)
        : labels.date(h.deadline)
  return (
    <div className="k-hl-row-wrap" data-status={status}>
      <button
        type="button"
        className="k-hl-row"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <ChevronRight size={12} aria-hidden className="k-hl-chevron" />
        <Led tone={hypothesisSeverity(status)} small label={labels.status[status]} />
        <span className="k-hl-status">{labels.status[status]}</span>
        <span className="k-hl-layer">{labels.layer[h.layer]}</span>
        <span className="k-hl-claim">{h.claim}</span>
        <span className="k-hl-tally" data-testid="hl-tally">
          {labels.tally(support, oppose)}
        </span>
        <span
          className="k-hl-due"
          data-urgent={status === 'pending' && left <= 14 ? '' : undefined}
          data-testid="hl-due"
        >
          {timing}
        </span>
      </button>
      {open && (
        <div id={bodyId} className="k-hl-body">
          <p className="k-hl-failure">
            <span className="k-hl-label">{labels.failure}</span> {h.failure}
          </p>
          <div className="k-hl-label">{labels.evidence}</div>
          {h.evidence.length === 0 ? (
            <p className="k-hl-none">{labels.noEvidence}</p>
          ) : (
            <ul className="k-hl-evidence" aria-label={labels.evidence}>
              {h.evidence.map((e) => (
                <li key={e.id} className="k-hl-ev" data-stance={e.stance}>
                  <span className="k-hl-kind" data-kind={e.kind}>
                    {labels.kind[e.kind]}
                  </span>
                  <span className="k-hl-stance">
                    <i aria-hidden="true" />
                    {labels.stance[e.stance]}
                  </span>
                  <time className="k-hl-time" dateTime={new Date(e.publishedAt).toISOString()}>
                    {labels.date(e.publishedAt)}
                  </time>
                  <a className="k-hl-source" href={e.href} target="_blank" rel="noreferrer">
                    <ExternalLink size={11} aria-hidden />
                    {e.source}
                  </a>
                  <span className="k-hl-summary">{e.summary}</span>
                </li>
              ))}
            </ul>
          )}
          {h.assets && h.assets.length > 0 && (
            <div className="k-hl-assets">
              <span className="k-hl-label">{labels.assets}</span>
              {h.assets.map((a) => (
                <span key={a.label} className="k-hl-asset">
                  {renderAsset?.(a)}
                  {a.label}
                  {a.tag && <span className="k-hl-tag">{a.tag}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
