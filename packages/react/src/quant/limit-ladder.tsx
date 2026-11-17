// SPDX-License-Identifier: MIT
import { useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { useEnterMarks, useFlipList, useStatusFlash, useValueFlash } from '../lib/live.ts'
import { RollingText } from '../katana/rolling-text.tsx'
import { RowActions, RowContextMenu, type RowAction } from '../patterns/row-actions.tsx'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { ChangeText } from './change-text.tsx'
import { formatVolume } from './format/index.ts'

// 连板天梯（#12）：顶上一行汇总读数，下面按板位从高到低分层，层头写板位、只数与晋级率，层里列个股；炸板、跌停、没涨停的票文字淡显、状态胶囊保持全亮。
// 画法参照 KATANAview 的「涨停梯队」（分组列表 + 晋级条 + 状态标签，用户在看板截图里看过），只取结构与版式，实现在这里重写。
// v2（用户看过 v1 后改）：表格手感取 TradingView 的列表（无衬线加 tabular-nums、右对齐、紧凑行、品种徽标，只看只量），
// 汇总读数与分组头取 Arc UI（uiarc.dev，2026-11-14 读：Revenue explorer、Metric explorer 的块），实现原创。
// 包里不带语言、不认任何数据集：层号单位、晋级率文字、状态名、列名都由调用方传；数字、涨跌幅的格式在件里。
// 刷新动效全走共用层 lib/live.ts（皮肤在 theme/live.css）：涨幅、封单额变了闪涨跌色，汇总读数滚动；封板→炸板整行警示琥珀闪，炸板→回封闪涨色；
// 升板时整行 FLIP 移到新层并闪涨色；新晋的票用蓝色强调线高亮。数据不变就一动不动，首次渲染也不闪。

export type LadderStatus = 'sealed' | 'broken' | 'down' | 'none'

export type LadderItem = {
  code: string
  name: string
  /** 涨跌幅，已经是百分数（10 就是 +10%）。 */
  change: number
  /** 首次封板的时刻，调用方写好（「09:31」）；没封过不给。 */
  firstSeal?: string
  /** 封单额（元）。 */
  sealAmount?: number
  /** 开板次数。 */
  opens?: number
  industry?: string
  /** 品种徽标的图片地址；不给就画字母圆标。 */
  logo?: string
  status: LadderStatus
}

export type LadderLevel = {
  /** 板位：几连板。 */
  board: number
  /** 晋级 [已晋级只数, 候选只数]：昨天低一档的票里今天封到这一档的。不给就不画晋级率。 */
  promoted?: [number, number]
  items: readonly LadderItem[]
}

export type LimitLadderLabels = {
  /** 层号旁的单位（「板」）。 */
  board: string
  /** 层头的晋级率文字，例「晋级 1/3」。 */
  promoted: (done: number, total: number) => string
  /** 层头的只数文字，例「3 只」。 */
  count: (n: number) => string
  status: Record<LadderStatus, string>
  columns: { name: string; change: string; firstSeal: string; sealAmount: string; opens: string; industry: string }
  /** 顶部汇总读数的名字：涨停只数、最高板、整体晋级率。 */
  summary: { sealed: string; highest: string; promoteRate: string }
  /** 整张天梯的读屏名。 */
  list: string
  empty: string
  /** 行快捷操作按钮条与右键菜单的读屏名；省略时用英文。 */
  rowActions?: string
  rowMenu?: string
}

export type LimitLadderProps = {
  levels: readonly LadderLevel[]
  labels: LimitLadderLabels
  /** 选中的个股代码。 */
  selected?: string | null
  onSelect?: (code: string) => void
  /** 行快捷操作（#23，一般传 symbolMenu(...)）：悬停或键盘落到这一行时右端浮出前几颗带图标的按钮，右键（菜单键、Shift+F10）出整份菜单；不传就没有。 */
  rowActions?: (item: LadderItem) => readonly RowAction[]
  className?: string
}

const DASH = '—'

/** 一行个股：数值、状态的刷新动效挂在这里；换层时这一行会在新的层容器里重新挂载，所以「刚升板」由外面按 代码@板位 判断后传进来（moved）。 */
function LadderRow({
  item,
  labels,
  selected,
  tabbable,
  onSelect,
  rowActions,
  entering,
  moved,
}: {
  item: LadderItem
  labels: LimitLadderLabels
  selected: boolean
  tabbable: boolean
  onSelect?: (code: string) => void
  rowActions?: (item: LadderItem) => readonly RowAction[]
  entering: boolean
  moved: boolean
}) {
  const seal = useValueFlash(item.sealAmount)
  const status = useStatusFlash(item.status)
  // 封板→炸板与跌停是要人去看的事：整行警示闪（跌停用跌红）；回封与升板是好消息：整行闪涨色。
  const alert = status.flash && (item.status === 'broken' || item.status === 'down')
  const good = (status.flash && item.status === 'sealed') || moved
  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={tabbable ? 0 : -1}
      className={cn(
        'k-ladder-row',
        selected && 'is-selected',
        entering && 'k-live-enter',
        alert && 'k-live-alert',
        good && !alert && 'k-live-flash',
      )}
      data-flash={good && !alert ? 'up' : undefined}
      data-tone={alert && item.status === 'down' ? 'negative' : undefined}
      data-slot="ladder-row"
      data-code={item.code}
      data-live-id={item.code}
      data-status={item.status}
      onClick={() => onSelect?.(item.code)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(item.code)
        }
      }}
    >
      <span className="k-ladder-name">
        <SymbolMark code={item.code} name={item.name} src={item.logo} size={18} />
        <span className="k-ladder-symbol">{item.code}</span>
        <span className="k-ladder-sub">{item.name}</span>
      </span>
      <ChangeText className="k-ladder-num" value={item.change} flash />
      <span className="k-ladder-num">{item.firstSeal ?? DASH}</span>
      <span
        key={`seal-${seal.key}`}
        className="k-ladder-num k-live-flash"
        data-flash={seal.flash ?? undefined}
        data-slot="ladder-seal"
      >
        {!item.sealAmount ? DASH : formatVolume(item.sealAmount)}
      </span>
      <span className="k-ladder-num">{item.opens ?? DASH}</span>
      <span className="k-ladder-industry">{item.industry ?? DASH}</span>
      <span className="k-ladder-status" data-status={item.status}>
        {labels.status[item.status]}
      </span>
      {rowActions && <RowActions items={rowActions(item)} label={labels.rowActions ?? 'Row actions'} pointerOnly />}
    </div>
  )
}

/** 层头的晋级率：已晋级只数涨了，文字闪一下涨色。 */
function PromoteText({ done, total, labels }: { done: number; total: number; labels: LimitLadderLabels }) {
  const flash = useValueFlash(done)
  return (
    <span className="k-ladder-promote" data-slot="ladder-promote">
      <span
        key={`promote-${flash.key}`}
        className="k-ladder-promote-text k-live-flash"
        data-flash={flash.flash ?? undefined}
      >
        {labels.promoted(done, total)}
      </span>
      <span className="k-ladder-promote-bar" aria-hidden="true">
        <i style={{ width: `${total > 0 ? Math.min(100, (done / total) * 100) : 0}%` }} />
      </span>
    </span>
  )
}

export function LimitLadder({ levels, labels, selected = null, onSelect, rowActions, className }: LimitLadderProps) {
  const uid = useId()
  const root = useRef<HTMLDivElement>(null)
  const sorted = [...levels].sort((a, b) => b.board - a.board)

  // 上下键在行间走（roving）：焦点所在行 tabIndex=0，其余 -1；没有焦点行时选中行、再没有就第一行进 Tab 序。
  const rows = sorted.flatMap((level) => level.items)
  const codes = rows.map((item) => item.code)
  // 新来的票（代码第一次出现）与换层的票（代码@板位第一次出现，扣掉新来的）；升板的行在新层容器里重挂载，状态带不过去，所以在这一层按 id 判断。
  const entering = useEnterMarks(codes)
  const placed = sorted.flatMap((level) => level.items.map((item) => `${item.code}@${level.board}`))
  const tiered = useEnterMarks(placed)
  // 重排的判据带上板位：升板的票若恰好在代码顺序里原地不动（上一层末尾与下一层开头相接），位置仍然变了，也要换位。
  useFlipList(root, placed)
  const tabbable = rows.find((item) => item.code === selected)?.code ?? rows[0]?.code

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const all = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')]
    const at = all.indexOf(document.activeElement as HTMLElement)
    const next = all[Math.max(0, Math.min(all.length - 1, at + (event.key === 'ArrowDown' ? 1 : -1)))]
    if (!next) return
    event.preventDefault()
    next.focus()
  }

  const actionsFor = rowActions
    ? (code: string) => {
        const item = rows.find((entry) => entry.code === code)
        return item ? rowActions(item) : []
      }
    : undefined

  const sealed = rows.filter((item) => item.status === 'sealed').length
  const highest = sorted[0]?.board
  const candidates = sorted.reduce((sum, level) => sum + (level.promoted?.[1] ?? 0), 0)
  const advanced = sorted.reduce((sum, level) => sum + (level.promoted?.[0] ?? 0), 0)
  const ratePct = candidates > 0 ? Math.round((advanced / candidates) * 100) : null

  if (sorted.length === 0) {
    return (
      <div className={cn('k-ladder', className)} data-slot="limit-ladder" role="status">
        <p className="k-ladder-empty">{labels.empty}</p>
      </div>
    )
  }

  return (
    <div ref={root} className={cn('k-ladder', className)} data-slot="limit-ladder">
      <dl className="k-ladder-summary" data-slot="ladder-summary">
        {[
          { name: labels.summary.sealed, text: String(sealed), value: sealed },
          { name: labels.summary.highest, text: highest === undefined ? DASH : String(highest), value: highest ?? NaN },
          { name: labels.summary.promoteRate, text: ratePct === null ? DASH : `${ratePct}%`, value: ratePct ?? NaN },
        ].map(({ name, text, value }) => (
          <div key={name} className="k-ladder-read">
            <dt>{name}</dt>
            <dd>
              <RollingText text={text} value={value} animate />
            </dd>
          </div>
        ))}
      </dl>
      <div className="k-ladder-columns" aria-hidden="true">
        <span>{labels.columns.name}</span>
        <span className="is-num">{labels.columns.change}</span>
        <span className="is-num">{labels.columns.firstSeal}</span>
        <span className="is-num">{labels.columns.sealAmount}</span>
        <span className="is-num">{labels.columns.opens}</span>
        <span>{labels.columns.industry}</span>
        <span />
      </div>
      <RowContextMenu actionsFor={actionsFor} label={labels.rowMenu ?? 'Row menu'}>
        <div className="k-ladder-list" role="listbox" aria-label={labels.list} onKeyDown={onKeyDown}>
          {sorted.map((level) => {
            const headId = `${uid}-${level.board}`
            const [done, total] = level.promoted ?? [0, 0]
            return (
              <div
                key={level.board}
                role="group"
                aria-labelledby={headId}
                className="k-ladder-level"
                data-board={level.board}
              >
                <div className="k-ladder-head" id={headId} data-slot="ladder-head">
                  <span className="k-ladder-board" data-slot="ladder-board">
                    {level.board}
                  </span>
                  <span className="k-ladder-unit">{labels.board}</span>
                  <span className="k-ladder-count">{labels.count(level.items.length)}</span>
                  {level.promoted ? <PromoteText done={done} total={total} labels={labels} /> : null}
                </div>
                {level.items.map((item) => (
                  <LadderRow
                    key={item.code}
                    item={item}
                    labels={labels}
                    selected={item.code === selected}
                    tabbable={item.code === tabbable}
                    onSelect={onSelect}
                    rowActions={rowActions}
                    entering={entering.has(item.code)}
                    moved={!entering.has(item.code) && tiered.has(`${item.code}@${level.board}`)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </RowContextMenu>
    </div>
  )
}
