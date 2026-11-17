# MetricCard

报价类读数卡的共用壳（2026-11-18）：variant="card" 照 uiarc 的 Metric explorer 的结构，variant="tile" 是 KPI 瓦片（原 SparkTile）。卡：标题、大号当前值、较前日 / 周 / 月 / 年的变化（涨跌色）、迷你走势线（1 月 / 3 月 / 6 月 / 1 年分段）、可选阶段带（五档边界与文案由调用方给）、来源与更新时间一行；MetricCardGrid 把卡排成墙。组件只画不算，数据与文字都由调用方传，没有数据就是空态。

## Provide

`*` marks a required prop.

### MetricCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'card' \| 'tile'` | `'card'` | card 是完整指标卡；tile 是 KPI 瓦片（原 SparkTile，字段见 SparkTile 页）。 |
| `label / value / unit` | `string / string \| null / string` | — | 标题（旧名 title）、已格式化的当前值（没有数据传 null，写 —）、数值后的小字。 |
| `changePct / changes` | `number / MetricChange[]` | — | changePct 一个变化（百分数）；changes 多个：{ id, label, value（百分数，null 写 —） }，涨跌色带箭头。 |
| `series / ranges` | `number[] / MetricRange[]` | — | series 一段走势；ranges 多段：{ id, label, values }（从旧到新），多于一段时出分段控件。 |
| `range / defaultRange / onRangeChange` | `string / string / (key) => void` | — | 当前段；不给就内部管。 |
| `trendTone` | `'direction' \| 'neutral' \| 'inverse'` | — | 走势线着色：direction 头尾涨跌（默认）；neutral 中性灰白（恐惧贪婪、情绪分这类没有好坏方向的）；inverse 涨是坏（如 VIX），涨取跌色。 |
| `labels` | `{ range?, spark }` | — | 分段控件与走势线的读屏名（整句；旧名 rangeLabel / sparkLabel）。 |
| `stages / current` | `MetricStage[] / number` | — | 阶段带：{ label, from, to } 从低到高，current 是当前值；所在档全亮、其余 35%，带上一根竖线标当前，下面写档名。 |
| `source / updatedAt` | `ReactNode` | — | 来源与更新时间，底部一行。 |

### MetricCardGrid

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 整墙的读屏名。 |
| `ranges / range / defaultRange / onRangeChange / rangeLabel` | `{ id, label }[] / string / string / (id) => void / string` | — | 共用区间分段，放在墙顶一次；传了它卡片不再各画分段控件，都按这个 id 取自己 ranges 里同 id 的一段。 |
| `minWidth` | `number` | — | 每张卡最小宽（px），默认 260；一行几张由容器宽决定。 |

### metricTrendTone(trend, values) / metricStageIndex(stages, value)

纯函数，跟件里用的同一份。metricTrendTone：按 trendTone 与走势线头尾给 up / down / flat（neutral 恒为 flat，inverse 涨跌色互换）。metricStageIndex：当前值落在第几档（最后一档含上界），没有值或落在所有档外返回 -1。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import { MetricCard, MetricCardGrid, type MetricChange, type MetricRange, type MetricStage } from '@katana-ui/react/quotes'

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
```

## States

- 变化与走势线用涨跌色（跟 data-updown）；走势线颜色按所选区间的头尾涨跌。
- 阶段带从跌色经灰到涨色，当前档全亮；档名写在带下面，不只靠颜色。
- 没有数据：数值写 —，变化写 —，线的位置写 —，不画样本。
- variant="tile"：DOM 与样子同原 SparkTile（k-spark-tile*），数值一格与卡共用 ReadoutValue（— / 闪色 / 滚轮 / 单位）。

## Don't

- 不要在件里算指标、写死中文或写死阶段边界；都由调用方传。
- 不要再新写 SparkTile：用 MetricCard variant="tile"，SparkTile 只是兼容的旧名。
- 不要把阶段带当买卖信号；它只是读数落在哪一档。
- 不要用橙色或蓝色画数据。

## Composition

```
MetricCardGrid
  MetricCard
    标题 | 分段控件（ToggleGroup）
    当前值
    变化（ChangeText）
    走势线（Sparkline）
    阶段带
    来源 · 更新时间
```

## Keyboard

- `Tab`：到分段控件（← → 移动，Space / Enter 选）
