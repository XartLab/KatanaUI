// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { descendantTotals, type RunAgent } from '../agent-tree/agent-tree-model.ts'
import { AgentFleet, type AgentFleetLabels } from './agent-fleet.tsx'

const AGENTS: RunAgent[] = [
  {
    id: 'research',
    name: '研究',
    task: '读三份研报',
    status: 'running',
    cost: 0.2,
    started: 0,
    children: [
      { id: 'r1', name: '读研报 A', task: '摘要', status: 'done', cost: 0.1 },
      {
        id: 'r2',
        name: '读研报 B',
        task: '摘要',
        status: 'failed',
        error: '文件打不开',
        steps: [{ title: '下载', status: 'failed', tool: 'fetch' }],
      },
    ],
  },
  { id: 'risk', name: '风控', task: '查敞口', status: 'waiting', ask: '放行吗？' },
]

const LABELS: AgentFleetLabels = {
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
  hint: 'Enter 打开',
  bar: {
    agents: (count) => `${count} 个 Agent`,
    running: (count) => `${count} 在跑`,
    waiting: (count) => `${count} 要你`,
    failed: (count) => `${count} 失败`,
  },
  fleet: '主 Agent',
  ring: (totals) => `${totals.agents} 个子 Agent 里 ${totals.done} 个做完`,
  subAgentsOf: (name) => `${name}的子 Agent`,
  noSubAgents: '没有子 Agent',
}

const render = (props: Partial<Parameters<typeof AgentFleet>[0]> = {}) =>
  renderToStaticMarkup(
    <AgentFleet
      agents={AGENTS}
      title="Agent（示例）"
      now={5000}
      formatCost={(cost) => `¥${cost.toFixed(2)}`}
      formatDuration={(ms) => `${ms / 1000} 秒`}
      labels={LABELS}
      {...props}
    />,
  )

describe('Agent 总览', () => {
  it('主卡的环按子孙做完的占比画，那句说明写成字', () => {
    expect(descendantTotals(AGENTS[0]!)).toMatchObject({ agents: 2, done: 1, failed: 1 })
    const html = render()
    expect(html).toContain('2 个子 Agent 里 1 个做完')
    // r = 9 的圆周长 56.55，一半是 28.27。
    expect(html).toContain('stroke-dasharray="28.27 56.55"')
  })

  it('默认打开第一个主 Agent：它的钮 aria-expanded 为真、树紧跟在它后面，别的不画树', () => {
    const html = render()
    expect(html.match(/data-slot="fleet-main"/g)).toHaveLength(2)
    expect(html).toMatch(/data-id="research"[^>]*aria-expanded="true"/)
    expect(html).toMatch(/data-id="risk"[^>]*aria-expanded="false"/)
    expect(html.match(/data-slot="fleet-panel"/g)).toHaveLength(1)
    expect(html.match(/role="treeitem"/g)).toHaveLength(2)
    expect(html).toContain('研究的子 Agent')
    // 失败的子 Agent 带步骤，能打开小窗；主卡写整个分支的花费。
    expect(html).toMatch(/aria-haspopup="dialog"[^>]*data-id="r2"/)
    expect(html).toContain('¥0.30')
    expect(html).toContain('1 要你')
  })

  it('defaultOpen 为 null 时全收着；没有子 Agent 的写空态', () => {
    expect(render({ defaultOpen: null })).not.toContain('data-slot="fleet-panel"')
    const html = render({ defaultOpen: 'risk' })
    expect(html).toContain('没有子 Agent')
  })
})
