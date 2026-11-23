// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentLanes, type AgentLanesLabels } from './agent-lanes.tsx'
import { agentTag, attentionCount, blockSpan, handoffLinks, type LaneAgent, type LaneTask } from './lanes-model.ts'

// 分钟 ×60000。窗口 0..30，now = 30。
const m = (minutes: number) => minutes * 60_000
const AGENTS: LaneAgent[] = [
  { id: 'research', name: '研究员', model: 'model-a' },
  { id: 'risk', name: '风控', initials: '风' },
  { id: 'writer', name: '撰稿' },
]
const TASKS: LaneTask[] = [
  { id: 't1', agent: 'research', title: '读研报', status: 'done', start: m(-5), end: m(12), handoff: 'risk' },
  { id: 't2', agent: 'risk', title: '算敞口', status: 'waiting', start: m(12), ask: '把仓位降到 60%？' },
  { id: 't3', agent: 'research', title: '查资金流', status: 'running', start: m(20) },
  { id: 'old', agent: 'writer', title: '旧任务', status: 'done', start: m(-40), end: m(-35) },
]
const LABELS: AgentLanesLabels = {
  status: { done: '完成', running: '在跑', waiting: '等你', failed: '失败' },
  tag: { needs: '要你', busy: '在忙', idle: '空闲' },
  attention: (n) => (n > 0 ? `${n} 个块等你` : ''),
  approve: '批准',
  reject: '拒绝',
  open: '打开',
  tools: '工具',
  handoff: (agent) => `交给 ${agent}`,
}

describe('泳道的几何', () => {
  it('块夹在窗口里，没结束的长到 now，窗口外的不画', () => {
    expect(blockSpan(TASKS[0]!, m(0), m(30), m(30))).toEqual({ left: 0, width: 0.4 })
    expect(blockSpan(TASKS[2]!, m(0), m(30), m(30))!.width).toBeCloseTo(1 / 3)
    expect(blockSpan(TASKS[3]!, m(0), m(30), m(30))).toBeNull()
  })

  it('交接线画在交出那一块的结束处；泳道标签按块的状态', () => {
    expect(handoffLinks(TASKS, AGENTS, m(0), m(30), m(30))).toEqual([{ id: 't1', from: 0, to: 1, x: 0.4 }])
    expect(agentTag('risk', TASKS)).toBe('needs')
    expect(agentTag('research', TASKS)).toBe('busy')
    expect(agentTag('writer', TASKS)).toBe('idle')
    expect(attentionCount(TASKS)).toBe(1)
  })
})

describe('泳道的渲染', () => {
  it('每个 Agent 一条泳道、窗口内的块各一个按钮，交接线与等人计数都在', () => {
    const html = renderToStaticMarkup(
      <AgentLanes
        agents={AGENTS}
        tasks={TASKS}
        now={m(30)}
        title="Agent（示例）"
        formatTime={(t) => `${t / 60_000}`}
        labels={LABELS}
      />,
    )
    expect(html.match(/data-slot="lanes-lane"/g)).toHaveLength(3)
    expect(html.match(/data-slot="lanes-block"/g)).toHaveLength(3)
    expect(html.match(/data-slot="lanes-handoff"/g)).toHaveLength(1)
    expect(html).toContain('1 个块等你')
    expect(html).toContain('aria-label="风控，算敞口，等你，12–30"')
    expect(html).toContain('data-tag="idle"')
  })
})
