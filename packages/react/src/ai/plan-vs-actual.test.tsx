// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { planDomain, planShift, projectPlan, type PlanStep } from './plan-actual-model.ts'
import { PlanVsActual, type PlanVsActualLabels } from './plan-vs-actual.tsx'

// 单位是分钟。计划：取数 0–10、清洗 10–20、算因子 20–40、写报告 40–45。
const STEPS: PlanStep[] = [
  { id: 'fetch', name: '取数', plannedStart: 0, plannedEnd: 10, actualStart: 0, actualEnd: 14 },
  { id: 'clean', name: '清洗', plannedStart: 10, plannedEnd: 20, actualStart: 14, actualEnd: null },
  { id: 'factor', name: '算因子', plannedStart: 20, plannedEnd: 40 },
  { id: 'report', name: '写报告', plannedStart: 40, plannedEnd: 45 },
]

const LABELS: PlanVsActualLabels = {
  state: { pending: '排队', running: '进行中', late: '超时', done: '完成', overrun: '超时完成' },
  planned: '计划完成',
  projected: '推算完成',
  shift: (s) => (s > 0 ? `晚 ${s} 分` : s < 0 ? `早 ${-s} 分` : '按时'),
  steps: '步骤',
  durations: (p, a) => (a === null ? `计划 ${p}` : `计划 ${p} · 实际 ${a}`),
  empty: '还没有计划',
}

describe('计划对实际的推算', () => {
  it('做完的用实际；进行中的按计划时长与 now 取晚的；没开始的接在后面', () => {
    const at20 = projectPlan(STEPS, 20)
    expect(at20.map((item) => item.state)).toEqual(['overrun', 'running', 'pending', 'pending'])
    expect(at20[0]).toMatchObject({ start: 0, end: 14, overrun: 4 })
    expect(at20[1]).toMatchObject({ start: 14, end: 24 })
    expect(at20[2]).toMatchObject({ start: 24, end: 44 })
    expect(at20[3]).toMatchObject({ start: 44, end: 49 })
    const at30 = projectPlan(STEPS, 30)
    expect(at30[1]).toMatchObject({ state: 'late', end: 30, overrun: 6 })
    expect(at30[2]).toMatchObject({ start: 30, end: 50 })
  })

  it('推移是推算完成减计划完成；没有步时都是 0', () => {
    expect(planShift(STEPS, 20)).toEqual({ planned: 45, projected: 49, shift: 4 })
    expect(planShift([], 20)).toEqual({ planned: 0, projected: 0, shift: 0 })
    expect(planDomain(STEPS, 20)).toEqual([0, 49])
  })

  it('没开始的步不早于 now', () => {
    const fresh: PlanStep[] = [{ id: 'a', name: 'a', plannedStart: 0, plannedEnd: 10 }]
    expect(projectPlan(fresh, 5)[0]).toMatchObject({ start: 5, end: 15, state: 'pending' })
  })
})

describe('计划对实际的渲染', () => {
  it('每步一行，状态写成字；超时的画超时段，没开始的画推算框', () => {
    const html = renderToStaticMarkup(
      <PlanVsActual
        steps={STEPS}
        now={20}
        title="周报生成"
        formatTime={(t) => `${t} 分`}
        formatDuration={(d) => `${d} 分`}
        labels={LABELS}
      />,
    )
    expect(html.match(/data-slot="plan-step"/g)).toHaveLength(4)
    expect(html).toContain('超时完成')
    expect(html).toContain('data-part="overrun"')
    // 两个没开始的步各一个推算框，进行中的清洗 now 之后的部分也是推算框。
    expect(html.match(/data-part="projected"/g)).toHaveLength(3)
    expect(html).toContain('晚 4 分')
  })
})
