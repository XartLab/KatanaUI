// SPDX-License-Identifier: MIT
// 组合运行表：一个策略跑在一组品种上，每个品种一行（持仓、浮动与已实现盈亏、占用风险资金、权益贡献、状态），
// 行内「暂停 / 恢复」「平掉」，顶上一行组合汇总（权益、可用资金、购买力、回撤）。
// 功能参照 MultiCharts Portfolio Trader 的 Forward Testing 窗口（2026-11-21 读官方页面，界面细节未实看，待核对），实现原创。
// 为什么只发回调：件不认识引擎也不下单，「暂停」「平掉」是调用方的事；件只保证点哪一行就把哪一行交回去。
// 底座是 DataGrid（interactive=false 的只读表），按钮放在 custom 列里，表不把按钮的点击当整行点击。
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../primitives/button.tsx'
import { Lcd, type LcdTone } from '../../katana/lcd.tsx'
import { Led } from '../../katana/led.tsx'
import { cn } from '../../lib/cn.ts'
import { DataGrid, type GridColumnLayout } from '../data-grid/data-grid.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import { STATUS_TONE, canClose, toggleActionOf, type PortfolioRunRow, type RunStatus } from './portfolio-run-model.ts'

/** 组合汇总：每项给 null 表示还没有数据，写「—」。 */
export type PortfolioRunSummary = {
  equity: number | null
  availableFunds: number | null
  buyingPower: number | null
  /** 当前回撤，小数，≤ 0（-0.034 是回撤 3.4%）。 */
  drawdown: number | null
}

/** 数字怎么写成文字：件里没有语言与币种，调用方给。 */
export type PortfolioRunFormat = {
  /** 金额（权益、盈亏、风险资金）；盈亏带不带正号由它定。 */
  amount: (value: number) => string
  /** 持仓数量，带符号的原始数，正多负空。 */
  quantity: (value: number) => string
  /** 比例，小数（-0.034）。 */
  percent: (value: number) => string
}

export type PortfolioRunLabels = {
  /** 整张表的读屏名。 */
  grid: string
  /** 汇总一行的读屏名。 */
  summary: string
  equity: string
  availableFunds: string
  buyingPower: string
  drawdown: string
  columns: {
    symbol: string
    position: string
    unrealizedPnl: string
    realizedPnl: string
    riskAmount: string
    equityContribution: string
    status: string
    actions: string
  }
  /** 四个状态各一个词。 */
  status: Readonly<Record<RunStatus, string>>
  pause: string
  resume: string
  closePosition: string
  /** 行内按钮的读屏名（要带上品种，读屏才分得清是哪一行）；省略时是「按钮文字 品种」。 */
  actionLabel?: (action: 'pause' | 'resume' | 'close', symbol: string) => string
  /** 没有任何行时写什么。 */
  empty?: string
}

export type PortfolioRunGridProps = {
  /**
   * One row per symbol.
   * 每个品种一行。
   */
  rows: readonly PortfolioRunRow[]
  /**
   * Portfolio totals shown above the table; a null item shows a dash.
   * 顶上的组合汇总。
   */
  summary: PortfolioRunSummary
  /**
   * How numbers are written as text (amount, quantity, percent).
   * 数字写成文字的方式，由调用方给。
   */
  format: PortfolioRunFormat
  /**
   * All text; the package has no language of its own.
   * 全部文字；包里没有语言。
   */
  labels: PortfolioRunLabels
  /**
   * Called with the clicked row when its Pause button is clicked; without it the button is disabled.
   * 点「暂停」：收到被点的那一行。没给就没有可点的暂停。
   */
  onPause?: (row: PortfolioRunRow) => void
  /**
   * Called with the clicked row when its Resume button is clicked.
   * 点「恢复」：收到被点的那一行。
   */
  onResume?: (row: PortfolioRunRow) => void
  /**
   * Called with the clicked row when its Close button is clicked; confirming the close is the caller's job.
   * 点「平掉」：收到被点的那一行；平仓的确认由调用方做。
   */
  onClose?: (row: PortfolioRunRow) => void
  /** Extra class name on the root. */
  className?: string
}

/** 列构造要的那几样：文字、格式与三个回调。 */
export type RunColumnEnv = Pick<PortfolioRunGridProps, 'format' | 'labels' | 'onPause' | 'onResume' | 'onClose'>

const ORDER = [
  'symbol',
  'position',
  'unrealizedPnl',
  'realizedPnl',
  'riskAmount',
  'equityContribution',
  'status',
  'actions',
] as const
const WIDTHS = [110, 90, 100, 100, 100, 100, 110, 190] as const

/** 一行末尾的两个按钮。是不带 hook 的纯函数件，单测直接调用它读出按钮树。 */
export function RunRowActions({ row, env }: { row: PortfolioRunRow; env: RunColumnEnv }) {
  const { labels } = env
  const toggle = toggleActionOf(row.status)
  const text = { pause: labels.pause, resume: labels.resume, close: labels.closePosition }
  const name = (action: 'pause' | 'resume' | 'close') =>
    labels.actionLabel ? labels.actionLabel(action, row.symbol) : `${text[action]} ${row.symbol}`
  const toggleHandler = toggle === 'pause' ? env.onPause : env.onResume
  return (
    <span className="k-prg-actions" data-slot="portfolio-run-actions">
      <Button
        size="sm"
        data-action={toggle}
        aria-label={name(toggle)}
        disabled={!toggleHandler}
        onClick={() => toggleHandler?.(row)}
      >
        {text[toggle]}
      </Button>
      <Button
        size="sm"
        variant="danger"
        data-action="close"
        aria-label={name('close')}
        disabled={!canClose(row) || !env.onClose}
        onClick={() => env.onClose?.(row)}
      >
        {labels.closePosition}
      </Button>
    </span>
  )
}

const directionOf = (value: number) => (value > 0 ? ('up' as const) : value < 0 ? ('down' as const) : undefined)

/** 列定义；依赖文字、格式与回调，所以是函数，不是模块常量（组件里按依赖 memo，回调走 ref，不让列重建）。 */
export function buildRunColumns(env: RunColumnEnv): GridColumn<PortfolioRunRow>[] {
  const { format, labels } = env
  return [
    { id: 'symbol', type: 'symbol', value: (row) => row.symbol, rowHeader: true },
    {
      id: 'position',
      type: 'number',
      value: (row) => row.position,
      text: (row) => format.quantity(row.position),
      tone: (row) => directionOf(row.position),
    },
    {
      id: 'unrealizedPnl',
      type: 'pnl',
      value: (row) => row.unrealizedPnl,
      text: (row) => format.amount(row.unrealizedPnl),
    },
    { id: 'realizedPnl', type: 'pnl', value: (row) => row.realizedPnl, text: (row) => format.amount(row.realizedPnl) },
    { id: 'riskAmount', type: 'number', value: (row) => row.riskAmount, text: (row) => format.amount(row.riskAmount) },
    {
      id: 'equityContribution',
      type: 'pnl',
      value: (row) => row.equityContribution,
      text: (row) => format.amount(row.equityContribution),
    },
    {
      id: 'status',
      type: 'custom',
      text: (row) => labels.status[row.status],
      sort: (row) => labels.status[row.status],
      cell: (row) => (
        <span className="k-prg-status" data-run-status={row.status}>
          <Led tone={STATUS_TONE[row.status]} label={labels.status[row.status]} />
          <span>{labels.status[row.status]}</span>
        </span>
      ),
    },
    { id: 'actions', type: 'custom', text: () => '', cell: (row) => <RunRowActions row={row} env={env} /> },
  ]
}

const SUMMARY_KEYS = ['equity', 'availableFunds', 'buyingPower', 'drawdown'] as const

function SummaryBar({ summary, format, labels }: Pick<PortfolioRunGridProps, 'summary' | 'format' | 'labels'>) {
  return (
    <div className="k-prg-summary" role="group" aria-label={labels.summary} data-slot="portfolio-run-summary">
      {SUMMARY_KEYS.map((key) => {
        const value = summary[key]
        const text = value === null ? null : key === 'drawdown' ? format.percent(value) : format.amount(value)
        const tone: LcdTone = key === 'drawdown' && value !== null && value < 0 ? 'down' : 'neutral'
        return <Lcd key={key} label={labels[key]} value={text} tone={tone} fill />
      })}
    </div>
  )
}

export function PortfolioRunGrid({
  rows,
  summary,
  format,
  labels,
  onPause,
  onResume,
  onClose,
  className,
}: PortfolioRunGridProps) {
  // 回调放进 ref、列里只拿稳定的转发函数：父组件每次渲染都传新函数，列若跟着重建，表会丢掉列状态与滚动位置。
  const pauseRef = useRef(onPause)
  const resumeRef = useRef(onResume)
  const closeRef = useRef(onClose)
  // 渲染期间不写 ref；点击发生在 effect 之后，读到的总是最新一份。
  useEffect(() => {
    pauseRef.current = onPause
    resumeRef.current = onResume
    closeRef.current = onClose
  })
  // 转发函数只建一次（状态的初始化函数），引用不变，列不会因为回调换了而重建。
  const [forward] = useState(() => ({
    pause: (row: PortfolioRunRow) => pauseRef.current?.(row),
    resume: (row: PortfolioRunRow) => resumeRef.current?.(row),
    close: (row: PortfolioRunRow) => closeRef.current?.(row),
  }))
  const hasPause = !!onPause
  const hasResume = !!onResume
  const hasClose = !!onClose
  const columns = useMemo(
    () =>
      buildRunColumns({
        format,
        labels,
        onPause: hasPause ? forward.pause : undefined,
        onResume: hasResume ? forward.resume : undefined,
        onClose: hasClose ? forward.close : undefined,
      }),
    [format, labels, hasPause, hasResume, hasClose, forward],
  )
  const layout = useMemo<GridColumnLayout[]>(
    () =>
      ORDER.map((id, index) => ({
        id,
        label: labels.columns[id],
        width: WIDTHS[index]!,
        visible: true,
        fixed: id === 'symbol' ? true : undefined,
      })),
    [labels],
  )
  return (
    <div className={cn('k-prg', className)} data-slot="portfolio-run-grid">
      <SummaryBar summary={summary} format={format} labels={labels} />
      <DataGrid
        columns={columns}
        layout={layout}
        rows={rows}
        rowId={(row) => row.id}
        label={labels.grid}
        interactive={false}
        density="relaxed"
        ruled
        live
        fit
        stretch
        collapseColumns={false}
        rowProps={(row) => ({
          className: `k-prg-row is-${row.status}`,
          'data-run-status': row.status,
          'data-symbol': row.symbol,
        })}
        foot={rows.length === 0 ? labels.empty : undefined}
      />
    </div>
  )
}
