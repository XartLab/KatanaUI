// SPDX-License-Identifier: MIT
// KATANAview #1908 第一批量化件：实验卡、并行尝试、变化摘要、KPI 图的纯逻辑与服务端渲染结构。
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ChangeSummary } from './change-summary.tsx'
import { ExperimentCard, type ExperimentCardLabels } from './experiment-card.tsx'
import { baselineOf, changeVerdict, leaderOf, relativeChange, type ExperimentVariant } from './experiment-model.ts'
import { KpiChart } from './kpi-chart.tsx'
import { axisIndexes, hasKpiData, kpiRange, normalizeValues, plotValues } from './kpi-chart-model.ts'
import { ParallelAttempts, type ParallelAttemptsLabels } from './parallel-attempts.tsx'
import { attemptFill, bestAttempt, countAttempts, type Attempt } from './parallel-attempts-model.ts'

const variant = (id: string, values: Record<string, number | null>, control = false): ExperimentVariant => ({
  id,
  badge: id.toUpperCase(),
  name: `参数 ${id}`,
  values,
  control,
})

const XP_LABELS: ExperimentCardLabels = {
  metric: '指标',
  variants: '变体',
  baseline: '基准',
  leader: '领先',
  hint: '选一个胜者',
  preview: (v, value) => `预览 ${v.badge} ${value}`,
  picked: (v) => `已选 ${v.badge}`,
  action: (v) => `采用 ${v.badge}`,
  samples: (n) => `${n} 笔`,
  confidence: (c) => `置信 ${Math.round(c * 100)}%`,
  missing: '–',
  empty: '没有变体',
}

describe('实验卡', () => {
  const variants = [
    variant('a', { sharpe: 1.1, dd: -0.2 }, true),
    variant('b', { sharpe: 1.4, dd: -0.25 }),
    variant('c', { sharpe: null, dd: -0.1 }),
  ]

  it('基准取标了 control 的，没标取第一个', () => {
    expect(baselineOf(variants)?.id).toBe('a')
    expect(baselineOf([variant('x', {}), variant('y', {})])?.id).toBe('x')
    expect(baselineOf([])).toBeNull()
  })

  it('领先按方向取，跳过没测出的；越小越好的指标取最小', () => {
    expect(leaderOf(variants, { id: 'sharpe' })?.id).toBe('b')
    // 回撤是负数：-0.1 比 -0.25 回撤小，但「越大越好」看的是数值本身。
    expect(leaderOf(variants, { id: 'dd' })?.id).toBe('c')
    expect(leaderOf(variants, { id: 'dd', lowerIsBetter: true })?.id).toBe('b')
    expect(leaderOf([variant('x', { m: null })], { id: 'm' })).toBeNull()
  })

  it('相对变化按 |基准| 做分母；基准为 0 或没测出时没有变化', () => {
    expect(relativeChange(1.4, 1.1)).toBeCloseTo(0.3 / 1.1, 12)
    expect(relativeChange(-0.5, -1)).toBeCloseTo(0.5, 12)
    expect(relativeChange(1, 0)).toBeNull()
    expect(relativeChange(null, 1)).toBeNull()
  })

  it('好坏随方向翻转', () => {
    expect(changeVerdict(0.1)).toBe('better')
    expect(changeVerdict(0.1, true)).toBe('worse')
    expect(changeVerdict(-0.1, true)).toBe('better')
    expect(changeVerdict(0)).toBe('same')
    expect(changeVerdict(null)).toBe('same')
  })

  it('渲染：每个变体是单选，基准与领先各有小标，选了胜者出动作按钮', () => {
    const html = renderToStaticMarkup(
      <ExperimentCard
        title="双均线"
        label="实验"
        variants={variants}
        metrics={[
          { id: 'sharpe', label: '夏普' },
          { id: 'dd', label: '回撤', lowerIsBetter: true },
        ]}
        defaultWinner="b"
        onAction={() => {}}
        labels={XP_LABELS}
      />,
    )
    expect(html.match(/role="radio"/g)).toHaveLength(3)
    expect(html).toContain('data-tag="baseline"')
    expect(html).toContain('data-tag="leader"')
    expect(html).toMatch(/data-id="b"[^>]*data-leader/)
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('采用 B')
    expect(html).toContain('data-verdict="better"')
  })

  it('没有变体时写空态，不画行', () => {
    const html = renderToStaticMarkup(
      <ExperimentCard title="t" label="l" variants={[]} metrics={[{ id: 'm', label: 'm' }]} labels={XP_LABELS} />,
    )
    expect(html).toContain('没有变体')
    expect(html).not.toContain('role="radio"')
  })
})

const PA_LABELS: ParallelAttemptsLabels = {
  status: { queued: '排队', running: '运行中', done: '跑完', failed: '失败' },
  best: '最优',
  use: '用这组',
  picked: '已选',
  counts: (c) => `${c.done} 跑完 · ${c.running} 运行 · ${c.failed} 失败`,
  empty: '没有尝试',
}

describe('并行尝试', () => {
  const attempts: Attempt[] = [
    { id: 'a', name: 'A', status: 'done', score: 1.2 },
    { id: 'b', name: 'B', status: 'done', score: 1.6 },
    { id: 'c', name: 'C', status: 'running', progress: 0.4, step: '第 3 / 8 年' },
    { id: 'd', name: 'D', status: 'failed', progress: 0.7, note: '数据缺口' },
    { id: 'e', name: 'E', status: 'done', score: null },
  ]

  it('最优只在跑完且有分的里面挑；方向可翻', () => {
    expect(bestAttempt(attempts)?.id).toBe('b')
    expect(bestAttempt(attempts, true)?.id).toBe('a')
    expect(bestAttempt([{ id: 'x', name: 'x', status: 'running', score: 9 }])).toBeNull()
  })

  it('进度条：跑完满格、排队空、失败停在 progress、越界夹住', () => {
    expect(attemptFill({ status: 'done', progress: 0.2 })).toBe(1)
    expect(attemptFill({ status: 'queued', progress: 0.5 })).toBe(0)
    expect(attemptFill({ status: 'failed', progress: 0.7 })).toBe(0.7)
    expect(attemptFill({ status: 'running', progress: 3 })).toBe(1)
    expect(attemptFill({ status: 'running' })).toBe(0)
  })

  it('计数按状态，没写状态算排队', () => {
    expect(countAttempts([...attempts, { id: 'f', name: 'F' }])).toEqual({ queued: 1, running: 1, done: 3, failed: 1 })
  })

  it('渲染：只有跑完的有单选，默认选中最优并标「最优」', () => {
    const html = renderToStaticMarkup(
      <ParallelAttempts attempts={attempts} title="参数扫描" label="尝试" labels={PA_LABELS} />,
    )
    expect(html.match(/role="radio"/g)).toHaveLength(3)
    expect(html).toMatch(/data-id="b"[^>]*data-best=""[^>]*data-picked=""/)
    expect(html).toContain('第 3 / 8 年')
    expect(html).toContain('aria-label="用这组 B 1.6"')
  })
})

describe('变化摘要', () => {
  it('用 dl：每行一个 dt 一个 dd，好坏写在 data-tone', () => {
    const html = renderToStaticMarkup(
      <ChangeSummary
        title="本周变化"
        period="11-16 → 11-22"
        changes={[
          { id: 's', label: '夏普', change: '1.12 → 1.38', tone: 'good', direction: 'up' },
          { id: 'd', label: '最大回撤', change: '8.1% → 9.4%', tone: 'bad', direction: 'up' },
        ]}
      />,
    )
    expect(html).toContain('<dl')
    expect(html.match(/<dt>/g)).toHaveLength(2)
    expect(html).toContain('data-tone="bad"')
    expect(html).toContain('11-16 → 11-22')
  })
})

describe('KPI 图', () => {
  it('normalized：各自压到 0..1，平线放中间，缺的点是 NaN', () => {
    expect(normalizeValues([1, 3, 2])).toEqual([0, 1, 0.5])
    expect(normalizeValues([5, 5])).toEqual([0.5, 0.5])
    const out = normalizeValues([1, null, 3])
    expect(out[0]).toBe(0)
    expect(Number.isNaN(out[1])).toBe(true)
  })

  it('纵轴区间：shared 取全部线的范围，normalized 固定 0..1', () => {
    const series = [
      { key: 'a', label: 'a', values: [1, 2] },
      { key: 'b', label: 'b', values: [-3, null] },
    ]
    expect(kpiRange(series, 'shared')).toEqual([-3, 2])
    expect(kpiRange(series, 'normalized')).toEqual([0, 1])
    expect(plotValues(series[1]!, 'shared')[0]).toBe(-3)
  })

  it('横轴字在首、中、末，点少时去重；0 也算数据', () => {
    expect(axisIndexes(5)).toEqual([0, 2, 4])
    expect(axisIndexes(1)).toEqual([0])
    expect(axisIndexes(0)).toEqual([])
    expect(hasKpiData([{ key: 'a', label: 'a', values: [0, 0] }])).toBe(true)
    expect(hasKpiData([{ key: 'a', label: 'a', values: [null] }])).toBe(false)
  })

  it('渲染：每条线一条路径，图是可键盘操作的 slider；没有数据写空态', () => {
    const html = renderToStaticMarkup(
      <KpiChart
        title="权益"
        label="示例 KPI 图"
        value="1.23M"
        delta={0.05}
        labels={['一', '二', '三']}
        series={[
          { key: 'eq', label: '权益', values: [1, 2, 3] },
          { key: 'bm', label: '基准', values: [1, 1.5, 2] },
        ]}
        emptyText="还没有数据"
      />,
    )
    expect(html.match(/data-slot="kpi-line"/g)).toHaveLength(2)
    expect(html).toContain('role="slider"')
    expect(html).toContain('data-tone="up"')
    const empty = renderToStaticMarkup(<KpiChart title="t" label="l" labels={[]} series={[]} emptyText="还没有数据" />)
    expect(empty).toContain('还没有数据')
    expect(empty).not.toContain('role="slider"')
  })
})
