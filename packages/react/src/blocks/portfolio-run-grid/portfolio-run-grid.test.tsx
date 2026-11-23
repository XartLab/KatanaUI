// SPDX-License-Identifier: MIT
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vite-plus/test'
import {
  PortfolioRunGrid,
  RunRowActions,
  buildRunColumns,
  type PortfolioRunFormat,
  type PortfolioRunLabels,
} from './portfolio-run-grid.tsx'
import { canClose, toggleActionOf, type PortfolioRunRow } from './portfolio-run-model.ts'

// 单测在 node 里跑，没有 DOM：「点按钮」的做法是调用行内动作件（不带 hook 的纯函数件）拿到它画出的元素树，
// 找到带 data-action 的按钮元素，调它的 onClick——与真点击走同一条回调，只是少了浏览器事件。真浏览器里的点击在 e2e 里验。

const labels: PortfolioRunLabels = {
  grid: '组合运行表',
  summary: '组合汇总',
  equity: '权益',
  availableFunds: '可用资金',
  buyingPower: '购买力',
  drawdown: '回撤',
  columns: {
    symbol: '品种',
    position: '持仓',
    unrealizedPnl: '浮动盈亏',
    realizedPnl: '已实现盈亏',
    riskAmount: '占用风险资金',
    equityContribution: '权益贡献',
    status: '状态',
    actions: '操作',
  },
  status: { running: '运行', paused: '暂停', noNewEntries: '停新开', disconnected: '断流' },
  pause: '暂停',
  resume: '恢复',
  closePosition: '平掉',
  empty: '没有品种',
}
const format: PortfolioRunFormat = {
  amount: (v) => v.toFixed(2),
  quantity: (v) => String(v),
  percent: (v) => `${(v * 100).toFixed(1)}%`,
}
const row = (id: string, status: PortfolioRunRow['status'], position = 2): PortfolioRunRow => ({
  id,
  symbol: id,
  position,
  unrealizedPnl: 12.5,
  realizedPnl: -3,
  riskAmount: 400,
  equityContribution: 9.5,
  status,
})
const summary = { equity: 10_000, availableFunds: 8_000, buyingPower: 16_000, drawdown: -0.034 }

/** 在元素树里按 data-action 找按钮元素；函数件（Button 之类）不展开，只看它收到的 props。 */
function findAction(node: ReactNode, action: string): ReactElement<Record<string, unknown>> | null {
  if (!isValidElement(node)) return null
  const props = node.props as Record<string, unknown>
  if (props['data-action'] === action) return node as ReactElement<Record<string, unknown>>
  const children = props.children as ReactNode
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = findAction(child as ReactNode, action)
    if (found) return found
  }
  return null
}
/** 取一行的动作按钮树：经列定义的 cell 拿到元素，再调用行内动作件。 */
function actionsOf(r: PortfolioRunRow, env: Parameters<typeof buildRunColumns>[0]) {
  const cell = buildRunColumns(env).find((column) => column.id === 'actions')!.cell!(r) as ReactElement<{
    row: PortfolioRunRow
    env: typeof env
  }>
  return RunRowActions(cell.props)
}

describe('行内动作的回调', () => {
  it('点「暂停」：回调收到被点的那一行', () => {
    const onPause = vi.fn()
    const target = row('BTCUSDT', 'running')
    const tree = actionsOf(target, { format, labels, onPause, onResume: vi.fn(), onClose: vi.fn() })
    const button = findAction(tree, 'pause')!
    expect(button.props.disabled).toBe(false)
    ;(button.props.onClick as () => void)()
    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onPause).toHaveBeenCalledWith(target)
  })

  it('暂停的行：按钮变成「恢复」，点它走 onResume，不走 onPause', () => {
    const onPause = vi.fn()
    const onResume = vi.fn()
    const target = row('ETHUSDT', 'paused')
    const tree = actionsOf(target, { format, labels, onPause, onResume, onClose: vi.fn() })
    expect(findAction(tree, 'pause')).toBeNull()
    ;(findAction(tree, 'resume')!.props.onClick as () => void)()
    expect(onResume).toHaveBeenCalledWith(target)
    expect(onPause).not.toHaveBeenCalled()
  })

  it('暂停的行「平掉」仍可点，点了回调收到这一行', () => {
    const onClose = vi.fn()
    const target = row('ETHUSDT', 'paused', -3)
    const tree = actionsOf(target, { format, labels, onPause: vi.fn(), onResume: vi.fn(), onClose })
    const close = findAction(tree, 'close')!
    expect(close.props.disabled).toBe(false)
    ;(close.props.onClick as () => void)()
    expect(onClose).toHaveBeenCalledWith(target)
  })

  it('空仓没有东西可平：「平掉」灰掉；没给回调的动作也灰掉', () => {
    const flat = actionsOf(row('SOLUSDT', 'running', 0), { format, labels, onPause: vi.fn(), onClose: vi.fn() })
    expect(findAction(flat, 'close')!.props.disabled).toBe(true)
    const noHandlers = actionsOf(row('SOLUSDT', 'running'), { format, labels })
    expect(findAction(noHandlers, 'pause')!.props.disabled).toBe(true)
    expect(findAction(noHandlers, 'close')!.props.disabled).toBe(true)
  })

  it('按钮的读屏名带品种', () => {
    const tree = actionsOf(row('BTCUSDT', 'running'), { format, labels, onPause: vi.fn(), onClose: vi.fn() })
    expect(findAction(tree, 'pause')!.props['aria-label']).toBe('暂停 BTCUSDT')
    expect(findAction(tree, 'close')!.props['aria-label']).toBe('平掉 BTCUSDT')
  })
})

describe('模型', () => {
  it('toggleActionOf 与 canClose', () => {
    expect(toggleActionOf('running')).toBe('pause')
    expect(toggleActionOf('noNewEntries')).toBe('pause')
    expect(toggleActionOf('disconnected')).toBe('pause')
    expect(toggleActionOf('paused')).toBe('resume')
    expect(canClose({ position: 0 })).toBe(false)
    expect(canClose({ position: -1 })).toBe(true)
  })
})

describe('PortfolioRunGrid 的结构', () => {
  const html = renderToStaticMarkup(
    <PortfolioRunGrid
      rows={[
        row('BTCUSDT', 'running'),
        row('ETHUSDT', 'paused'),
        row('SOLUSDT', 'disconnected'),
        row('XRPUSDT', 'noNewEntries'),
      ]}
      summary={summary}
      format={format}
      labels={labels}
      onPause={() => {}}
      onResume={() => {}}
      onClose={() => {}}
    />,
  )

  it('四种状态的行各自带 data-run-status，状态格写出文字', () => {
    for (const status of ['running', 'paused', 'noNewEntries', 'disconnected'])
      expect(html).toContain(`data-run-status="${status}"`)
    for (const text of ['运行', '暂停', '停新开', '断流']) expect(html).toContain(`>${text}<`)
  })

  it('暂停行有 is-paused 的类，且这一行的「平掉」没有 disabled', () => {
    const pausedRow = html.slice(html.indexOf('data-symbol="ETHUSDT"'))
    const upToNext = pausedRow.slice(0, pausedRow.indexOf('data-symbol="SOLUSDT"'))
    expect(upToNext).toContain('is-paused')
    const close = /<button[^>]*data-action="close"[^>]*>/.exec(upToNext)![0]
    expect(close).not.toContain('disabled=""')
    // 暂停行的第一个动作是「恢复」。
    expect(upToNext).toContain('data-action="resume"')
  })

  it('顶上汇总写出四项读数，回撤是负数时走跌色', () => {
    for (const text of ['权益', '可用资金', '购买力', '回撤']) expect(html).toContain(`>${text}<`)
    expect(html).toContain('10000.00')
    expect(html).toContain('-3.4%')
    expect(html).toMatch(/k-lcd[^"]*tone-down[^>]*>(?:(?!<\/span>\s*<\/span>).)*回撤/s)
  })

  it('汇总项是 null 时写破折号', () => {
    const empty = renderToStaticMarkup(
      <PortfolioRunGrid
        rows={[]}
        summary={{ equity: null, availableFunds: null, buyingPower: null, drawdown: null }}
        format={format}
        labels={labels}
      />,
    )
    expect(empty).toContain('>—<')
    expect(empty).toContain('没有品种')
  })
})
