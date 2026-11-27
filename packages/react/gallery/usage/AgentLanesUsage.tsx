// SPDX-License-Identifier: MIT
import { AgentLanes, type LaneAgent, type LaneTask } from '../../src/index'

// 示例数据：三个 Agent 最近 30 分钟的工作（时间是毫秒，now = 30 分），条目是手写的演示值。研究员读完研报交给风控，风控在等你批准。
const MIN = 60_000
const AGENTS: readonly LaneAgent[] = [
  { id: 'research', name: '研究员', model: 'model-a', initials: '研' },
  { id: 'risk', name: '风控', model: 'model-b', initials: '风' },
  { id: 'writer', name: '撰稿', model: 'model-a', initials: '撰' },
]
const TASKS: readonly LaneTask[] = [
  {
    id: 't1',
    agent: 'research',
    title: '读研报',
    status: 'done',
    start: 2 * MIN,
    end: 12 * MIN,
    handoff: 'risk',
    summary: '读完 6 篇，摘出 3 条风险提示',
    tools: ['研报库', '摘要'],
  },
  {
    id: 't2',
    agent: 'risk',
    title: '算敞口',
    status: 'waiting',
    start: 12 * MIN,
    ask: '把组合 A 的仓位从 80% 降到 60%？',
  },
  { id: 't3', agent: 'research', title: '查资金流', status: 'running', start: 18 * MIN, tools: ['资金流'] },
  {
    id: 't4',
    agent: 'writer',
    title: '盘中简报',
    status: 'failed',
    start: 6 * MIN,
    end: 9 * MIN,
    summary: '模板缺字段，停了',
  },
]

export function AgentLanesUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 760 }} data-gallery-al="main">
      <AgentLanes
        title="Agent（示例）"
        agents={AGENTS}
        tasks={TASKS}
        now={30 * MIN}
        onOpen={() => {}}
        formatTime={(time) => `${Math.round(time / MIN)} 分`}
        labels={{
          status: { done: '完成', running: '在跑', waiting: '等你', failed: '失败' },
          tag: { needs: '要你', busy: '在忙', idle: '空闲' },
          attention: (count) => (count > 0 ? `${count} 个块等你` : ''),
          approve: '批准',
          reject: '拒绝',
          open: '打开',
          tools: '工具',
          handoff: (agent) => `交给 ${agent}`,
        }}
      />
    </div>
  )
}
