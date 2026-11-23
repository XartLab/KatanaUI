// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { costAxis, costRows, priciestStep, runState, runTotals, stepTotals, type CostStep } from './cost-model.ts'
import { CostWaterfall, type CostWaterfallLabels } from './cost-waterfall.tsx'

// 一次会话：规划（模型 0.10）→ 子 Agent 取数（自己 0.02，下面两次工具 0.01、0.03，一次模型 0.20）→ 写报告（模型 0.30）→ 缓存抵扣 −0.05。
const STEPS: CostStep[] = [
  { id: 'plan', name: '规划', kind: 'llm', cost: 0.1, tokensIn: 1000, tokensOut: 200, duration: 2000 },
  {
    id: 'fetch',
    name: '取数子 Agent',
    kind: 'agent',
    cost: 0.02,
    children: [
      { id: 'q1', name: '查成交', kind: 'tool', cost: 0.01, duration: 300 },
      { id: 'q2', name: '查权益', kind: 'tool', cost: 0.03, duration: 500 },
      { id: 'sum', name: '汇总', kind: 'llm', cost: 0.2, tokensIn: 4000, tokensOut: 600, duration: 3000 },
    ],
  },
  { id: 'report', name: '写报告', kind: 'llm', cost: 0.3, tokensIn: 5000, tokensOut: 1500, duration: 6000 },
  { id: 'cache', name: '缓存抵扣', kind: 'tool', cost: -0.05 },
]

const LABELS: CostWaterfallLabels = {
  mode: '看什么',
  cost: '花费',
  tokens: 'token',
  kind: { agent: '子 Agent', llm: '模型', tool: '工具' },
  status: { running: '进行中', done: '完成', failed: '失败' },
  run: { live: '进行中', done: '完成', failed: '失败' },
  priciest: '最贵一步',
  name: '步骤',
  time: '时长',
  tokensIn: '输入',
  tokensOut: '输出',
  io: { agent: ['任务', '结果'], llm: ['提示', '回答'], tool: ['输入', '输出'] },
  details: '这一步的详情',
  error: '错误',
}

const close = (value: number) => Math.round(value * 1000) / 1000

describe('花费瀑布的累计', () => {
  it('子 Agent 的数是自己的加子步的，时长没给取子步之和', () => {
    expect(close(stepTotals(STEPS[1]!).cost)).toBe(0.26)
    expect(stepTotals(STEPS[1]!).duration).toBe(3800)
    expect(close(runTotals(STEPS).cost)).toBe(0.61)
  })

  it('每步的条从前面各步的累计处起；抵扣往回走；折叠的子 Agent 整块算', () => {
    const open = costRows(STEPS, new Set(), 'cost').map((row) => [row.step.id, close(row.from), close(row.to)])
    expect(open).toEqual([
      ['plan', 0, 0.1],
      ['fetch', 0.1, 0.36],
      ['q1', 0.1, 0.11],
      ['q2', 0.11, 0.14],
      ['sum', 0.14, 0.34],
      ['report', 0.36, 0.66],
      ['cache', 0.66, 0.61],
    ])
    const folded = costRows(STEPS, new Set(['fetch']), 'cost').map((row) => row.step.id)
    expect(folded).toEqual(['plan', 'fetch', 'report', 'cache'])
    expect(costAxis(costRows(STEPS, new Set(), 'cost')).lo).toBe(0)
  })

  it('最贵一步是叶子里最大的，带它的上级；会话状态跟着在跑的步', () => {
    expect(priciestStep(STEPS, 'cost')).toEqual({ id: 'report', ancestors: [] })
    expect(priciestStep(STEPS, 'tokens')).toEqual({ id: 'report', ancestors: [] })
    const nested: CostStep[] = [{ ...STEPS[1]!, children: [{ id: 'x', name: 'x', kind: 'llm', cost: 1 }] }]
    expect(priciestStep(nested, 'cost')).toEqual({ id: 'x', ancestors: ['fetch'] })
    expect(runState(STEPS)).toBe('done')
    expect(runState([{ id: 'r', name: 'r', kind: 'llm', status: 'running' }])).toBe('live')
  })
})

describe('花费瀑布的渲染', () => {
  it('每步一行，最贵的标出，抵扣的条带标记，详情按种类写字段名', () => {
    const html = renderToStaticMarkup(
      <CostWaterfall
        steps={[...STEPS.slice(0, 3), { ...STEPS[3]!, input: '命中缓存 4k token' }]}
        title="会话花费（示例）"
        label="步骤"
        defaultOpenId="cache"
        formatCost={(c) => `¥${c.toFixed(2)}`}
        formatTokens={(t) => `${t}`}
        formatDuration={(ms) => `${ms / 1000} 秒`}
        labels={LABELS}
      />,
    )
    expect(html.match(/data-slot="cost-step"/g)).toHaveLength(7)
    expect(html).toContain('data-id="report" data-kind="llm" data-status="done" data-priciest=""')
    expect(html).toContain('data-credit=""')
    expect(html).toContain('完成 · ¥0.61')
    expect(html).toContain('<span>输入</span><pre tabindex="0">命中缓存 4k token</pre>')
  })
})
