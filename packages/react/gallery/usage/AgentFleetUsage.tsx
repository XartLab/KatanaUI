// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AgentFleet, type AgentResolution, type AgentRunStatus, type RunAgent } from '../../src/blocks'
import { formatCnAmount } from '../../src/cn'

// 示例数据：同时跑的三个主 Agent（盘后研究、风控巡检、回补数据）与它们的子 Agent。花费是人民币元、时间是毫秒，都是手写的演示值；时钟固定在 NOW。
const NOW = 600_000
const AGENTS: readonly RunAgent[] = [
  {
    id: 'research',
    name: '盘后研究',
    model: 'model-a',
    task: '找今天放量的板块',
    status: 'running',
    cost: 0.06,
    started: 0,
    tools: ['研报库', '龙虎榜'],
    children: [
      {
        id: 'sector',
        name: '板块扫描',
        task: '算 31 个行业的量比',
        status: 'done',
        cost: 0.02,
        started: 5_000,
        ended: 62_000,
      },
      {
        id: 'reader',
        name: '读研报',
        task: '读 4 篇券商晨报',
        status: 'running',
        cost: 0.11,
        started: 70_000,
        steps: [
          { title: '下载晨报', status: 'done', tool: '研报库', duration: 4_000 },
          { title: '摘出观点', status: 'running', tool: '摘要' },
        ],
      },
      {
        id: 'confirm',
        name: '确认标的',
        task: '要不要把 3 只票加进自选',
        status: 'waiting',
        ask: '把 600519、000858、300750 加进「盘后观察」自选吗？',
        started: 300_000,
      },
    ],
  },
  {
    id: 'risk',
    name: '风控巡检',
    model: 'model-b',
    task: '每 10 分钟查一次敞口',
    status: 'done',
    cost: 0.01,
    started: 0,
    ended: 45_000,
    children: [
      { id: 'expo', name: '算敞口', task: '组合 A、B', status: 'done', cost: 0.004, started: 2_000, ended: 40_000 },
    ],
  },
  {
    id: 'backfill',
    name: '回补数据',
    task: '补 2024 年的分钟线',
    status: 'failed',
    cost: 0.002,
    started: 120_000,
    ended: 190_000,
    children: [
      { id: 'b1', name: '一季度', task: '补 1–3 月', status: 'done', started: 120_000, ended: 160_000 },
      {
        id: 'b2',
        name: '二季度',
        task: '补 4–6 月',
        status: 'failed',
        error: '数据源返回空，可能停牌',
        ended: 190_000,
      },
      { id: 'b3', name: '三季度', task: '补 7–9 月', status: 'queued' },
    ],
  },
]

const NEXT: Record<AgentResolution, AgentRunStatus> = {
  approve: 'running',
  reject: 'stopped',
  retry: 'running',
  dismiss: 'stopped',
}
const patch = (node: RunAgent, id: string, status: AgentRunStatus): RunAgent =>
  node.id === id ? { ...node, status } : { ...node, children: node.children?.map((child) => patch(child, id, status)) }

const seconds = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} 秒` : `${Math.floor(ms / 60_000)} 分`)

export function AgentFleetUsage() {
  const [agents, setAgents] = useState(AGENTS)
  return (
    <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-agent-fleet="main">
      <AgentFleet
        agents={agents}
        now={NOW}
        title="Agent（示例）"
        onResolve={(agent, action) =>
          setAgents((current) => current.map((main) => patch(main, agent.id, NEXT[action])))
        }
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 3 })}`}
        formatDuration={seconds}
        labels={{
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
          hint: '方向键走，Enter 打开小窗',
          bar: {
            agents: (count) => `${count} 个 Agent`,
            running: (count) => `${count} 在跑`,
            waiting: (count) => `${count} 要你`,
            failed: (count) => `${count} 失败`,
          },
          fleet: '主 Agent',
          ring: (totals) =>
            totals.agents === 0
              ? '没有子 Agent'
              : totals.waiting > 0
                ? `${totals.waiting} 个要你 · ${totals.done} / ${totals.agents} 做完`
                : `${totals.done} / ${totals.agents} 个子 Agent 做完`,
          subAgentsOf: (name) => `${name}的子 Agent`,
          noSubAgents: '没有子 Agent',
        }}
      />
    </div>
  )
}
