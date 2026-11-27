// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentTree, type AgentTreeLabels } from './agent-tree.tsx'
import {
  agentElapsed,
  agentTotals,
  branchCost,
  moveAgent,
  toolTiles,
  visibleAgents,
  type RunAgent,
} from './agent-tree-model.ts'

const ROOT: RunAgent = {
  id: 'lead',
  name: '编排',
  task: '写周报',
  status: 'running',
  cost: 0.1,
  started: 0,
  children: [
    {
      id: 'research',
      name: '研究员',
      task: '读研报',
      status: 'running',
      cost: 0.3,
      started: 1000,
      tools: ['search', 'read', 'sql', 'chart', 'pdf'],
      children: [
        { id: 'fetch', name: '取数', task: '拉日线', status: 'done', cost: 0.05, started: 1000, ended: 4000 },
        { id: 'risk', name: '风控', task: '查敞口', status: 'waiting', ask: '仓位超限，继续吗？', cost: Number.NaN },
      ],
    },
    { id: 'exec', name: '执行', task: '等信号', status: 'queued' },
  ],
}

const TREE_LABELS: AgentTreeLabels = {
  status: { queued: '排队', running: '在跑', waiting: '要你', done: '做完', failed: '失败', stopped: '停了' },
  children: (count) => `${count} 个子 Agent`,
  branch: '分支',
  approve: '批准',
  reject: '拒绝',
  retry: '重试',
  dismiss: '不管了',
  answerOf: (name) => `回答${name}`,
  stepsOf: (name) => `${name}的步骤`,
  more: (count) => `+${count}`,
  hint: '← → 收起展开，Enter 打开',
  bar: {
    agents: (count) => `${count} 个 Agent`,
    running: (count) => `${count} 在跑`,
    waiting: (count) => `${count} 要你`,
    failed: (count) => `${count} 失败`,
  },
  tree: 'Agent 树',
}

describe('Agent 树的读数', () => {
  it('分支花费加整棵子树（NaN 不算）；合计数每种状态', () => {
    expect(branchCost(ROOT)).toBeCloseTo(0.45)
    expect(branchCost({ id: 'x', name: 'x', task: '', status: 'queued' })).toBeUndefined()
    expect(agentTotals([ROOT])).toMatchObject({ agents: 5, running: 2, waiting: 1, done: 1, failed: 0 })
  })

  it('耗时量到调用方的 now；没给 now 不写；开始在将来算 0', () => {
    expect(agentElapsed({ started: 1000, ended: 4000 })).toBe(3000)
    expect(agentElapsed({ started: 1000 }, 6000)).toBe(5000)
    expect(agentElapsed({ started: 1000 })).toBeUndefined()
    expect(agentElapsed({ started: 9000 }, 6000)).toBe(0)
  })

  it('收起的分支不展开；键盘照 APG 树（复用 moveSpan）', () => {
    const rows = visibleAgents([ROOT], new Set(['research']))
    expect(rows.map((row) => row.agent.id)).toEqual(['lead', 'research', 'exec'])
    expect(moveAgent(rows, 'research', 'ArrowRight')).toEqual({ toggle: 'research' })
    expect(moveAgent(rows, 'exec', 'ArrowLeft')).toEqual({ focus: 'lead' })
    expect(moveAgent(rows, 'lead', 'End')).toEqual({ focus: 'exec' })
  })

  it('工具多于 4 个只摆前 3 个，再加 +N', () => {
    expect(toolTiles(['a', 'b', 'c', 'd'])).toEqual({ shown: ['a', 'b', 'c', 'd'], more: 0 })
    expect(toolTiles(['a', 'b', 'c', 'd', 'e'])).toEqual({ shown: ['a', 'b', 'c'], more: 2 })
  })
})

describe('Agent 树的渲染', () => {
  const render = (collapsed: readonly string[] = []) =>
    renderToStaticMarkup(
      <AgentTree
        root={ROOT}
        defaultCollapsed={collapsed}
        now={10_000}
        title="周报（示例）"
        formatCost={(cost) => `¥${cost.toFixed(2)}`}
        formatDuration={(ms) => `${ms / 1000} 秒`}
        labels={TREE_LABELS}
      />,
    )

  it('一棵 treeitem 树，分支写整个分支的花费，要你的卡能打开小窗，排队的变淡', () => {
    const html = render()
    expect(html.match(/role="treeitem"/g)).toHaveLength(5)
    expect(html.match(/role="group"/g)).toHaveLength(2)
    expect(html).toContain('分支 ¥0.45')
    expect(html).toContain('分支 ¥0.35')
    expect(html).toMatch(/data-id="risk"[^>]*data-status="waiting"/)
    expect(html).toMatch(/aria-haspopup="dialog"[^>]*data-id="risk"/)
    expect(html).toMatch(/data-id="exec"[^>]*data-muted=""/)
    expect(html).toContain('+2')
    expect(html).toContain('10 秒')
    expect(html).toContain('1 要你')
  })

  it('收起的分支不画它的子，aria-expanded 为假', () => {
    const html = render(['research'])
    expect(html.match(/role="treeitem"/g)).toHaveLength(3)
    expect(html).toMatch(/aria-expanded="false"[^>]*data-id="research"/)
  })
})
