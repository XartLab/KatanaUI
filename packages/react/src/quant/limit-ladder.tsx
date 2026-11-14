// SPDX-License-Identifier: MIT
import { useId, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { ChangeText } from './change-text.tsx'
import { formatCompact } from './format/index.ts'

// 连板天梯（#12）：按板位从高到低分层，层头写层号（点阵字）、只数与晋级率，层里列个股；炸板、跌停、没涨停的票淡显并带状态标签。
// 画法参照 KATANAview 的「涨停梯队」（分组列表 + 晋级条 + 状态标签，用户在看板截图里看过），只取结构与版式，实现在这里重写。
// 包里不带语言、不认任何数据集：层号单位、晋级率文字、状态名、列名都由调用方传；数字、涨跌幅的格式在件里。

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
  /** 整张天梯的读屏名。 */
  list: string
  empty: string
}

export type LimitLadderProps = {
  levels: readonly LadderLevel[]
  labels: LimitLadderLabels
  /** 选中的个股代码。 */
  selected?: string | null
  onSelect?: (code: string) => void
  className?: string
}

const DASH = '—'

export function LimitLadder({ levels, labels, selected = null, onSelect, className }: LimitLadderProps) {
  const uid = useId()
  const sorted = [...levels].sort((a, b) => b.board - a.board)

  // 上下键在行间走（roving）：焦点所在行 tabIndex=0，其余 -1；没有焦点行时选中行、再没有就第一行进 Tab 序。
  const rows = sorted.flatMap((level) => level.items)
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

  if (sorted.length === 0) {
    return (
      <div className={cn('k-ladder', className)} data-slot="limit-ladder" role="status">
        <p className="k-ladder-empty">{labels.empty}</p>
      </div>
    )
  }

  return (
    <div className={cn('k-ladder', className)} data-slot="limit-ladder">
      <div className="k-ladder-columns" aria-hidden="true">
        <span>{labels.columns.name}</span>
        <span className="is-num">{labels.columns.change}</span>
        <span className="is-num">{labels.columns.firstSeal}</span>
        <span className="is-num">{labels.columns.sealAmount}</span>
        <span className="is-num">{labels.columns.opens}</span>
        <span>{labels.columns.industry}</span>
        <span />
      </div>
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
                {level.promoted ? (
                  <span className="k-ladder-promote" data-slot="ladder-promote">
                    <span className="k-ladder-promote-text">{labels.promoted(done, total)}</span>
                    <span className="k-ladder-promote-bar" aria-hidden="true">
                      <i style={{ width: `${total > 0 ? Math.min(100, (done / total) * 100) : 0}%` }} />
                    </span>
                  </span>
                ) : null}
              </div>
              {level.items.map((item) => {
                const isSelected = item.code === selected
                return (
                  <div
                    key={item.code}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={item.code === tabbable ? 0 : -1}
                    className={cn('k-ladder-row', isSelected && 'is-selected')}
                    data-slot="ladder-row"
                    data-code={item.code}
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
                      <span className="k-ladder-title">{item.name}</span>
                      <span className="k-ladder-code">{item.code}</span>
                    </span>
                    <ChangeText className="k-ladder-num" value={item.change} />
                    <span className="k-ladder-num">{item.firstSeal ?? DASH}</span>
                    <span className="k-ladder-num">
                      {!item.sealAmount ? DASH : formatCompact(item.sealAmount, 'base')}
                    </span>
                    <span className="k-ladder-num">{item.opens ?? DASH}</span>
                    <span className="k-ladder-industry">{item.industry ?? DASH}</span>
                    <span className="k-ladder-status" data-status={item.status}>
                      {labels.status[item.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
