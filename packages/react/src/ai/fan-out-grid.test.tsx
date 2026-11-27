// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { FanOutGrid, type FanOutGridLabels } from './fan-out-grid.tsx'
import { fanCost, fanCounts, fanEta, fanProgress, moveCell, type FanTask } from './fan-out-model.ts'

const TASKS: FanTask[] = [
  { id: 'a', label: '600519', status: 'done', start: 0, end: 4000, cost: 0.01, worker: 'w1' },
  { id: 'b', label: '000001', status: 'done', start: 0, end: 2000, cost: 0.01 },
  { id: 'c', label: '300750', status: 'failed', start: 0, end: 1000, error: '没有数据', attempts: 2 },
  { id: 'd', label: '601318', status: 'running', start: 2000 },
  { id: 'e', label: '000858', status: 'queued' },
]

const LABELS: FanOutGridLabels = {
  status: { queued: '排队', running: '在跑', retrying: '重试', done: '成功', failed: '失败' },
  grid: '子任务',
  progress: (f, t) => `${f}/${t}`,
  live: (p) => `完成 ${p}%`,
  eta: (text) => (text === null ? '剩余 估算中' : `剩余 ${text}`),
  cost: (text) => `花费 ${text}`,
  worker: 'worker',
  took: '耗时',
  attempts: '第几次',
  result: '结果',
  error: '错误',
  filter: '按状态看',
  retry: (n) => `重试失败的 ${n} 个`,
  hint: '悬停或聚焦一格看详情',
}

describe('分发网格的读数', () => {
  it('进度算跑完的（含失败）；剩余 = 没跑完的 × 平均耗时 ÷ 并行数', () => {
    expect(fanProgress(TASKS)).toBe(0.6)
    expect(fanCounts(TASKS)).toMatchObject({ done: 2, failed: 1, running: 1, queued: 1 })
    // 平均 3000 ms，剩 2 个；给了 2 个 worker → 3000；没给按在跑的 1 个 → 6000。
    expect(fanEta(TASKS, 2)).toBe(3000)
    expect(fanEta(TASKS)).toBe(6000)
    expect(fanEta([{ id: 'x', label: 'x', status: 'queued' }])).toBeNull()
    expect(fanCost(TASKS)).toBeCloseTo(0.02)
  })

  it('格子间的键盘按行走，到边不越界', () => {
    expect(moveCell(0, 'ArrowDown', 5, 3)).toBe(3)
    expect(moveCell(3, 'ArrowDown', 5, 3)).toBe(3)
    expect(moveCell(4, 'ArrowRight', 5, 3)).toBe(4)
    expect(moveCell(2, 'End', 5, 3)).toBe(4)
  })
})

describe('分发网格的渲染', () => {
  it('一格一个任务，计数是开关，有失败的出重试，进度按整成播报', () => {
    const html = renderToStaticMarkup(
      <FanOutGrid
        tasks={TASKS}
        title="补资金流（示例）"
        job="5 只票"
        onRetry={() => {}}
        formatCost={(c) => `¥${c.toFixed(2)}`}
        formatDuration={(ms) => `${ms / 1000} 秒`}
        labels={LABELS}
      />,
    )
    expect(html.match(/data-slot="fan-cell"/g)).toHaveLength(5)
    expect(html.match(/class="k-fan-count"/g)).toHaveLength(5)
    expect(html).toContain('重试失败的 1 个')
    expect(html).toContain('完成 60%')
    expect(html).toContain('剩余 6 秒')
    expect(html).toContain('aria-label="300750，失败"')
  })
})
