// SPDX-License-Identifier: MIT
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import { MetricCard, MetricCardGrid, type MetricChange, type MetricRange, type MetricStage } from '../../src/quotes'

function walk(seed: number, start: number, step: number, lo: number, hi: number, n = 250): number[] {
  let state = seed
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i += 1) {
    v = Math.min(hi, Math.max(lo, v + (rand() - 0.5) * 2 * step))
    out.push(Number(v.toFixed(2)))
  }
  return out
}

const METRIC_RANGES = [
  { id: '1m', label: '1 月', n: 21 },
  { id: '3m', label: '3 月', n: 63 },
  { id: '6m', label: '6 月', n: 126 },
  { id: '1y', label: '1 年', n: 250 },
] as const

function metricProps(values: readonly number[]): { ranges: MetricRange[]; changes: MetricChange[] } {
  const last = values[values.length - 1]!
  const since = (back: number): number | null => {
    const base = values[values.length - 1 - back]
    return base === undefined || base === 0 ? null : ((last - base) / Math.abs(base)) * 100
  }
  return {
    ranges: METRIC_RANGES.map((r) => ({ id: r.id, label: r.label, values: values.slice(-r.n) })),
    changes: [
      { id: 'd', label: '较前日', value: since(1) },
      { id: 'w', label: '较前周', value: since(5) },
      { id: 'm', label: '较前月', value: since(21) },
      { id: 'y', label: '较前年', value: since(249) },
    ],
  }
}

const FEAR_GREED_STAGES: MetricStage[] = [
  { label: '极度恐惧', from: 0, to: 25 },
  { label: '恐惧', from: 25, to: 45 },
  { label: '中性', from: 45, to: 55 },
  { label: '贪婪', from: 55, to: 75 },
  { label: '极度贪婪', from: 75, to: 100 },
]

const CYCLE_STAGES: MetricStage[] = [
  { label: '冰点', from: 0, to: 20 },
  { label: '低迷', from: 20, to: 40 },
  { label: '平稳', from: 40, to: 60 },
  { label: '活跃', from: 60, to: 80 },
  { label: '亢奋', from: 80, to: 100 },
]

const GLOBAL_DEMO = [
  {
    title: '恐惧与贪婪指数',
    trend: 'neutral' as const,
    seed: 11,
    start: 48,
    step: 4,
    lo: 5,
    hi: 95,
    digits: 0,
    stages: FEAR_GREED_STAGES,
  },
  { title: 'VIX 波动率', trend: 'inverse' as const, seed: 23, start: 17, step: 1.2, lo: 10, hi: 45, digits: 2 },
  { title: '金油比', seed: 37, start: 24, step: 0.5, lo: 15, hi: 35, digits: 2 },
  { title: '美元指数', seed: 41, start: 102, step: 0.6, lo: 94, hi: 112, digits: 2 },
]

const ASHARE_DEMO = [
  {
    title: '情绪分',
    trend: 'neutral' as const,
    seed: 53,
    start: 52,
    step: 6,
    lo: 3,
    hi: 97,
    digits: 0,
    stages: CYCLE_STAGES,
  },
  { title: '涨停数', seed: 67, start: 60, step: 9, lo: 15, hi: 140, digits: 0, unit: '只' },
  { title: '连板高度', seed: 71, start: 4, step: 0.9, lo: 1, hi: 9, digits: 0, unit: '板' },
  { title: '封板率', seed: 83, start: 72, step: 3, lo: 40, hi: 95, digits: 1, unit: '%' },
]

function MetricWall({
  name,
  demo,
}: {
  name: string
  demo: readonly (typeof GLOBAL_DEMO)[number][] | typeof ASHARE_DEMO
}) {
  return (
    <MetricCardGrid label={name} minWidth={280} ranges={METRIC_RANGES} rangeLabel={`${name}走势区间`}>
      {demo.map((d) => {
        const values = walk(d.seed, d.start, d.step, d.lo, d.hi).map((v) => Number(v.toFixed(d.digits)))
        const last = values[values.length - 1]!
        return (
          <MetricCard
            key={d.title}
            label={d.title}
            value={last.toFixed(d.digits)}
            unit={'unit' in d ? d.unit : undefined}
            {...metricProps(values)}
            trendTone={'trend' in d ? d.trend : 'direction'}
            labels={{ range: `${d.title}走势区间`, spark: `${d.title}走势` }}
            stages={'stages' in d ? d.stages : undefined}
            current={last}
            source="演示数据，不是行情"
            updatedAt="更新 2026-11-15 15:00"
          />
        )
      })}
    </MetricCardGrid>
  )
}

export function MetricCardUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 1080, height: 780 }}>
      <PanelFrame focused aria-label="指标卡">
        <PanelFrameHeader heading="指标卡" object="演示数据" />
        <PanelFrameBody>
          <div className="gal-metric-wall" style={{ overflow: 'auto', padding: 12, display: 'grid', gap: 16 }}>
            <section data-testid="metric-global">
              <MetricWall name="全球情绪" demo={GLOBAL_DEMO} />
            </section>
            <section data-testid="metric-ashare">
              <MetricWall name="A 股情绪周期" demo={ASHARE_DEMO} />
            </section>
            <section data-testid="metric-empty">
              <MetricCardGrid label="空态" minWidth={280}>
                <MetricCard
                  label="未接入的指标"
                  value={null}
                  changes={[{ id: 'd', label: '较前日', value: null }]}
                  ranges={[{ id: '1m', label: '1 月', values: [] }]}
                  labels={{ range: '走势区间', spark: '没有数据' }}
                  source="未连接"
                />
              </MetricCardGrid>
            </section>
          </div>
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}
