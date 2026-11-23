// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ExperimentCard, type ExperimentMetric, type ExperimentVariant } from '../../src/quant'

// 示例数据：三组双均线参数的回测对比，数是手写的演示值，不是回测结果。A 是基准；回撤越小越好。
const METRICS: readonly ExperimentMetric[] = [
  { id: 'cagr', label: '年化', format: (v) => `${(v * 100).toFixed(1)}%` },
  { id: 'sharpe', label: '夏普', format: (v) => v.toFixed(2) },
  { id: 'mdd', label: '最大回撤', format: (v) => `${(v * 100).toFixed(1)}%`, lowerIsBetter: true },
]

const VARIANTS: readonly ExperimentVariant[] = [
  {
    id: 'a',
    badge: 'A',
    name: '快 10 / 慢 40',
    control: true,
    values: { cagr: 0.124, sharpe: 1.08, mdd: 0.162 },
    samples: 312,
  },
  {
    id: 'b',
    badge: 'B',
    name: '快 13 / 慢 60',
    values: { cagr: 0.151, sharpe: 1.31, mdd: 0.148 },
    samples: 268,
    confidence: 0.93,
  },
  {
    id: 'c',
    badge: 'C',
    name: '快 8 / 慢 30',
    values: { cagr: 0.139, sharpe: 0.97, mdd: 0.211 },
    samples: 401,
    confidence: 0.71,
  },
]

export function ExperimentCardUsage() {
  const [adopted, setAdopted] = useState<string | null>(null)
  return (
    <div className="gal-wide" style={{ maxWidth: 560 }} data-gallery-experiment="main">
      <ExperimentCard
        title="双均线参数对比"
        label="示例：实验卡"
        status={{ label: '已跑完', tone: 'ok' }}
        note="2024-01 → 2026-10"
        variants={VARIANTS}
        metrics={METRICS}
        defaultMetric="sharpe"
        onAction={(variant) => setAdopted(variant.name)}
        labels={{
          metric: '指标',
          variants: '参数组',
          baseline: '基准',
          leader: '领先',
          hint: '点一行选为胜者',
          preview: (variant, value) => `${variant.badge}：${value}`,
          picked: (variant) => `已选 ${variant.badge}（${variant.name}）`,
          action: (variant) => `采用参数 ${variant.badge}`,
          samples: (count) => `${count} 笔`,
          confidence: (confidence) => `置信 ${Math.round(confidence * 100)}%`,
          missing: '–',
          empty: '没有参数组',
        }}
        source={adopted === null ? '来源 / 示例数据' : `来源 / 示例数据 · 已采用 ${adopted}`}
      />
    </div>
  )
}
