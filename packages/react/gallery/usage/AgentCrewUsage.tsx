// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  AgentCrew,
  type CrewAgent,
  type CrewHandoff,
  type CrewProject,
  type CrewStatus,
  type CrewSteer,
} from '../../src/blocks'
import { formatCnAmount } from '../../src/cn'
import { Button } from '../../src/index'

// 示例数据：两个项目各一组常驻 Agent（盘后复盘、可转债轮动）。上下文、花费、token、时间都是手写的演示值；时钟固定在 NOW。
// 「交接一次」把下一条写好的交接交给件，看接手的卡亮一下；引导动作的结果由这里的数据改（件只回调人的决定）。
const NOW = 900_000
const CREWS: Record<string, CrewAgent> = {
  review: {
    id: 'lead',
    name: '主管',
    model: 'model-a',
    status: 'working',
    activity: '分派今天的复盘',
    context: 0.42,
    contextLimit: 200_000,
    task: '收盘后写今天的复盘',
    started: 0,
    cost: 0.12,
    tokens: 84_000,
    tools: ['计划', '日历'],
    children: [
      {
        id: 'research',
        name: '研究员',
        model: 'model-a',
        status: 'working',
        activity: '读龙虎榜与连板梯队',
        context: 0.83,
        contextLimit: 200_000,
        task: '挑出三只值得跟的票',
        started: 60_000,
        cost: 0.31,
        tokens: 166_000,
        tools: ['龙虎榜', '研报库', 'SQL', '图表', '摘要'],
        last: { from: 'lead', text: '看三只连板' },
        children: [
          { id: 'fetch', name: '取数', status: 'idle', activity: '等下一份清单', context: 0.12, tools: ['行情'] },
        ],
      },
      {
        id: 'risk',
        name: '风控',
        model: 'model-b',
        status: 'waiting',
        activity: '组合 A 单票仓位 22%，超过 20%',
        context: 0.97,
        contextLimit: 128_000,
        task: '核对组合敞口',
        started: 300_000,
        cost: 0.05,
        tokens: 124_000,
        last: { from: 'research', text: '三只候选票' },
      },
      { id: 'writer', name: '撰稿', status: 'paused', activity: '等研究员与风控', context: 0.2 },
    ],
  },
  bonds: {
    id: 'bond-lead',
    name: '轮动主管',
    model: 'model-a',
    status: 'idle',
    activity: '下次调仓在周五',
    context: 0.18,
    children: [
      { id: 'screen', name: '筛选', status: 'done', activity: '筛出 12 只低溢价', context: 0.35 },
      { id: 'order', name: '下单草稿', status: 'failed', activity: '券商接口超时', context: 0.4 },
    ],
  },
}
const PROJECTS: readonly CrewProject[] = [
  { id: 'review', name: '盘后复盘', working: 2, needsYou: 1 },
  { id: 'bonds', name: '可转债轮动', working: 0, needsYou: 0 },
]
const SCRIPT: readonly Omit<CrewHandoff, 'id'>[] = [
  { from: 'lead', to: 'writer', label: '开始写' },
  { from: 'research', to: 'fetch', label: '再拉两只' },
  { from: 'risk', to: 'lead', label: '敞口报告' },
]
const NEXT: Partial<Record<CrewSteer, CrewStatus>> = {
  pause: 'paused',
  stop: 'done',
  resume: 'working',
  approve: 'working',
  decline: 'idle',
  retry: 'working',
}
const patch = (node: CrewAgent, id: string, status: CrewStatus): CrewAgent =>
  node.id === id ? { ...node, status } : { ...node, children: node.children?.map((child) => patch(child, id, status)) }

const seconds = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} 秒` : `${Math.floor(ms / 60_000)} 分`)

export function AgentCrewUsage() {
  const [project, setProject] = useState('review')
  const [crews, setCrews] = useState(CREWS)
  const [handoffs, setHandoffs] = useState<readonly CrewHandoff[]>([])
  const root = crews[project]!
  return (
    <div className="gal-wide" style={{ maxWidth: 760 }} data-gallery-agent-crew="main">
      <AgentCrew
        root={root}
        handoffs={handoffs}
        title="复盘小组（示例）"
        projects={PROJECTS}
        project={project}
        onProjectChange={(id) => {
          setProject(id)
          setHandoffs([])
        }}
        onSteer={(agent, action) => {
          const status = NEXT[action]
          if (status !== undefined) setCrews({ ...crews, [project]: patch(root, agent.id, status) })
        }}
        now={NOW}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 2 })}`}
        formatDuration={seconds}
        formatTokens={(tokens) => `${Math.round(tokens / 1000)}k`}
        labels={{
          status: { working: '在忙', idle: '空闲', paused: '暂停', waiting: '要你', done: '做完', failed: '失败' },
          steer: {
            message: '留言',
            pause: '暂停',
            stop: '停止',
            resume: '继续',
            approve: '批准',
            decline: '拒绝',
            retry: '重试',
          },
          tree: '小组成员',
          counts: (counts) => `${counts.working} 在忙 · ${counts.waiting} 要你 · 共 ${counts.total} 个`,
          project: '项目',
          projectCounts: (item) => `${item.working ?? 0} 在忙 · ${item.needsYou ?? 0} 要你`,
          context: (percent) => `上下文 ${percent}%`,
          hint: '方向键走，Enter 打开详情',
          details: {
            task: '任务',
            model: '模型',
            time: '用时',
            cost: '花费',
            tokens: 'token',
            tools: '工具',
            last: '最近交接',
          },
          close: '关闭',
          message: '给它留言',
          send: '发出',
          handed: (from, to, label) => `${from} 交给 ${to}${label === undefined ? '' : `：${label}`}`,
          steered: (name, action) => `已对${name}：${action}`,
          more: (count) => `+${count}`,
        }}
      />
      {project === 'review' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const next = SCRIPT[handoffs.length % SCRIPT.length]!
            setHandoffs([...handoffs, { ...next, id: `h${handoffs.length + 1}` }])
          }}
        >
          交接一次（示例）
        </Button>
      )}
    </div>
  )
}
