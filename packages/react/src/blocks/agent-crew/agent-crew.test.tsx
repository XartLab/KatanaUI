// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentCrew, type AgentCrewLabels } from './agent-crew.tsx'
import {
  clampContext,
  crewContextLevel,
  crewCounts,
  crewOrder,
  handoffEdge,
  steerActions,
  type CrewAgent,
} from './crew-model.ts'

const ROOT: CrewAgent = {
  id: 'lead',
  name: '主管',
  status: 'working',
  activity: '分派今天的复盘',
  context: 0.42,
  contextLimit: 200_000,
  children: [
    {
      id: 'research',
      name: '研究员',
      status: 'working',
      activity: '读龙虎榜',
      context: 0.86,
      tools: ['search', 'sql'],
      last: { from: 'lead', text: '看三只连板' },
      children: [{ id: 'fetch', name: '取数', status: 'idle', context: 1.4 }],
    },
    { id: 'risk', name: '风控', status: 'waiting', activity: '仓位超限', context: 0.97 },
  ],
}

const LABELS: AgentCrewLabels = {
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
  tree: '小组',
  counts: (counts) => `${counts.working} 在忙 · ${counts.waiting} 要你 · 共 ${counts.total}`,
  project: '项目',
  projectCounts: (project) => `${project.working ?? 0} 在忙`,
  context: (percent) => `上下文 ${percent}%`,
  hint: 'Enter 打开详情',
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
  message: '留言',
  send: '发出',
  handed: (from, to) => `${from} 交给 ${to}`,
  steered: (name, action) => `${name}：${action}`,
  more: (count) => `+${count}`,
}

describe('多角色小组的读数', () => {
  it('上下文到 80% 变 warn、到 95% 变 danger；越界夹住，NaN 不画', () => {
    expect(crewContextLevel(0.79)).toBe('ok')
    expect(crewContextLevel(0.8)).toBe('warn')
    expect(crewContextLevel(0.95)).toBe('danger')
    expect(clampContext(1.4)).toBe(1)
    expect(clampContext(Number.NaN)).toBeUndefined()
  })

  it('引导动作跟着状态走：留言总在', () => {
    expect(steerActions('working')).toEqual(['message', 'pause', 'stop'])
    expect(steerActions('paused')).toEqual(['message', 'resume'])
    expect(steerActions('waiting')).toEqual(['message', 'approve', 'decline'])
    expect(steerActions('failed')).toEqual(['message', 'retry'])
    expect(steerActions('done')).toEqual(['message'])
  })

  it('读的次序是前序；从上级来的交接从上边进卡', () => {
    expect(crewOrder(ROOT).map((agent) => agent.id)).toEqual(['lead', 'research', 'fetch', 'risk'])
    expect(crewCounts(ROOT)).toEqual({ total: 4, working: 2, waiting: 1 })
    expect(handoffEdge(ROOT, { id: 'h', from: 'lead', to: 'fetch' })).toBe('top')
    expect(handoffEdge(ROOT, { id: 'h', from: 'fetch', to: 'lead' })).toBe('bottom')
  })
})

describe('多角色小组的渲染', () => {
  const render = (props: Partial<Parameters<typeof AgentCrew>[0]> = {}) =>
    renderToStaticMarkup(
      <AgentCrew
        root={ROOT}
        handoffs={[{ id: 'h1', from: 'lead', to: 'research' }]}
        title="复盘小组（示例）"
        formatCost={(cost) => `¥${cost.toFixed(2)}`}
        formatDuration={(ms) => `${ms / 1000} 秒`}
        formatTokens={(tokens) => `${Math.round(tokens / 1000)}k`}
        labels={LABELS}
        {...props}
      />,
    )

  it('每个成员一张卡，上下文条按档着色，给了上限写 token 数；卡下写工具与最近交接', () => {
    const html = render()
    expect(html.match(/role="treeitem"/g)).toHaveLength(4)
    expect(html).toContain('84k / 200k')
    expect(html.match(/data-level="warn"/g)).toHaveLength(1)
    expect(html.match(/data-level="danger"/g)).toHaveLength(2)
    expect(html).toContain('主管：看三只连板')
    expect(html).toContain('2 在忙 · 1 要你 · 共 4')
    expect(html).toContain('aria-label="风控，要你，仓位超限，上下文 97%"')
  })

  it('打开时已有的交接不点亮；给了项目时标题换成项目切换', () => {
    expect(render()).not.toContain('data-slot="crew-handoff"')
    const html = render({ projects: [{ id: 'p1', name: '复盘', working: 2 }], project: 'p1' })
    expect(html).toContain('data-slot="crew-project"')
    expect(html).not.toContain('复盘小组（示例）')
  })
})
