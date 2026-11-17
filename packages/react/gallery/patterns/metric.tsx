// SPDX-License-Identifier: MIT
import { MetricCard, MetricCardGrid } from '../../src/quant'
import type { Pattern } from './types'

// 演示数据：固定的 60 个点，不是行情。
const VIX = Array.from({ length: 60 }, (_, i) => Number((17 + Math.sin(i / 5) * 2.4 + i * 0.03).toFixed(2)))
const BASIS = Array.from({ length: 60 }, (_, i) => Number((52 + Math.cos(i / 7) * 6 - i * 0.05).toFixed(1)))

const RANGES = [
  { key: '1m', label: '1 月', n: 21 },
  { key: '3m', label: '3 月', n: 60 },
] as const

const since = (values: readonly number[], back: number) => {
  const base = values[values.length - 1 - back]
  return base ? ((values[values.length - 1]! - base) / Math.abs(base)) * 100 : null
}

function Demo() {
  const cards = [
    { title: 'VIX 波动率（演示数据）', values: VIX, digits: 2, unit: undefined, tone: 'inverse' as const },
    { title: '期现基差（演示数据）', values: BASIS, digits: 1, unit: 'bp', tone: 'direction' as const },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <MetricCardGrid label="关键读数" minWidth={300} ranges={RANGES} rangeLabel="走势区间">
        {cards.map((c) => (
          <MetricCard
            key={c.title}
            title={c.title}
            value={c.values[c.values.length - 1]!.toFixed(c.digits)}
            unit={c.unit}
            ranges={RANGES.map((r) => ({ key: r.key, label: r.label, values: c.values.slice(-r.n) }))}
            changes={[
              { key: 'd', label: '较前日', value: since(c.values, 1) },
              { key: 'w', label: '较前周', value: since(c.values, 5) },
              { key: 'm', label: '较前月', value: since(c.values, 21) },
            ]}
            trendTone={c.tone}
            rangeLabel={`${c.title}走势区间`}
            sparkLabel={`${c.title}走势`}
            source="演示数据，不是行情"
            updatedAt="更新 2026-11-17 15:00"
          />
        ))}
      </MetricCardGrid>
    </div>
  )
}

const pattern: Pattern = {
  id: 'metric',
  title: '关键读数',
  summary: '一个指标一张卡：大号当前值、较前日 / 周 / 月的变化、迷你走势线，最底下一行写来源和更新时间。',
  Demo,
  use: [
    '看盘首屏的几个核心指标：波动率、基差、资金净流入、情绪分',
    '要一眼比较「现在多少、比以前高还是低」，不需要读具体曲线',
  ],
  avoid: [
    '要看曲线细节、十字光标、叠加：用图表（SeriesExplorer、EquityCurve）',
    '只有一个数、没有历史：用 KeyStats 的一行',
  ],
  parts: [
    { page: 'metric-card', role: '卡本体：大数 + 变化 + 走势线 + 来源' },
    { page: 'spark-tile', role: '更小的点阵标签版，放在指标墙的一行里' },
    { page: 'change-text', role: '带符号和涨跌色的变化百分数' },
    { page: 'sparkline', role: '没有卡片外框时单独用的走势线' },
  ],
  rules: [
    '大数最大、单位次一级墨色放右边；变化行最多 3 项（较前日 / 周 / 月），不堆满',
    '涨跌色按指标含义给：VIX 这类「越高越坏」的指标用 inverse，别一律红涨绿跌',
    '一排卡共享一个区间切换（1 月 / 3 月 / 6 月 / 1 年），不要每张卡各一套按钮',
    '走势线只表达方向，不画坐标轴和网格；高度 24–36px',
    '来源和更新时间必须有（「来源 · 更新 2026-11-17 15:00」），没接入就写「未连接」，数写 —',
    '卡片栅格 minmax(280px, 1fr) 自动换行；单卡不小于 280px 宽',
  ],
  source: { label: 'Salt · Metric', href: 'https://www.saltdesignsystem.com/salt/patterns/metric' },
}
export default pattern
