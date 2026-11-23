// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AgentTree, type AgentResolution, type AgentRunStatus, type RunAgent } from '../../src/blocks'
import { formatCnAmount } from '../../src/cn'

// 示例数据：一次「写周报」的运行，编排 Agent 派出研究员与风控，研究员又派出两个取数的子 Agent。花费是人民币元、时间是毫秒，都是手写的演示值；
// 时钟固定在 NOW，不走。回答之后状态由这里的数据改（件只回调人的决定）。
const NOW = 300_000
const ROOT: RunAgent = {
  id: 'lead',
  name: '编排',
  model: 'model-a',
  task: '写本周复盘',
  status: 'running',
  cost: 0.08,
  started: 0,
  tools: ['计划'],
  children: [
    {
      id: 'research',
      name: '研究员',
      model: 'model-a',
      task: '读龙虎榜与研报，挑三只票',
      status: 'running',
      cost: 0.21,
      started: 12_000,
      tools: ['研报库', '龙虎榜', 'SQL', '图表', '摘要'],
      children: [
        {
          id: 'fetch-day',
          name: '取日线',
          task: '拉 30 只票的日线',
          status: 'done',
          cost: 0.01,
          started: 15_000,
          ended: 48_000,
        },
        {
          id: 'fetch-news',
          name: '取公告',
          task: '拉近 5 天公告',
          status: 'failed',
          error: '公告源限流，第 3 次也没拿到',
          cost: 0.004,
          started: 15_000,
          ended: 91_000,
          steps: [
            { title: '请求公告列表', status: 'done', tool: 'HTTP', duration: 2_000 },
            { title: '翻第 2 页', status: 'failed', tool: 'HTTP', duration: 30_000 },
          ],
        },
      ],
    },
    {
      id: 'risk',
      name: '风控',
      model: 'model-b',
      task: '核对组合敞口',
      status: 'waiting',
      ask: '组合 A 的单票仓位到了 22%，超过 20% 的上限，继续写进复盘吗？',
      cost: 0.03,
      started: 140_000,
    },
    { id: 'writer', name: '撰稿', task: '等研究员与风控', status: 'queued' },
  ],
}

const NEXT: Record<AgentResolution, AgentRunStatus> = {
  approve: 'running',
  reject: 'stopped',
  retry: 'running',
  dismiss: 'stopped',
}
const patch = (node: RunAgent, id: string, status: AgentRunStatus): RunAgent =>
  node.id === id ? { ...node, status } : { ...node, children: node.children?.map((child) => patch(child, id, status)) }

const seconds = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} 秒` : `${Math.floor(ms / 60_000)} 分`)

export function AgentTreeUsage() {
  const [root, setRoot] = useState(ROOT)
  return (
    <div className="gal-wide" style={{ maxWidth: 760 }} data-gallery-agent-tree="main">
      <AgentTree
        root={root}
        now={NOW}
        title="周报运行（示例）"
        onResolve={(agent, action) => setRoot((current) => patch(current, agent.id, NEXT[action]))}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 2 })}`}
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
          hint: '方向键走，← → 收起展开，Enter 打开小窗',
          bar: {
            agents: (count) => `${count} 个 Agent`,
            running: (count) => `${count} 在跑`,
            waiting: (count) => `${count} 要你`,
            failed: (count) => `${count} 失败`,
          },
          tree: 'Agent 树',
        }}
      />
    </div>
  )
}
