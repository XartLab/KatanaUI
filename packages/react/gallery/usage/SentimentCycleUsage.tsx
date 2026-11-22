// SPDX-License-Identifier: MIT
import { SentimentCycle, type SentimentDay, type SentimentMetric, type SentimentStage } from '../../src/blocks'

// 演示数据：20 个交易日的情绪分、阶段与四项小线图都是编出来的（闭式公式），不是行情，也不是任何口径的真实结果。
// 阶段与阈值是演示用的划分：调用方自己定口径，件不带算法。
export const SENTIMENT_STAGES: readonly SentimentStage[] = [
  { id: 'ice', name: '冰点', tone: 'neutral' },
  { id: 'repair', name: '修复', tone: 'warn' },
  { id: 'ferment', name: '发酵', tone: 'ok' },
  { id: 'climax', name: '高潮', tone: 'danger' },
]

const stageOf = (score: number) => (score < 25 ? 'ice' : score < 50 ? 'repair' : score < 75 ? 'ferment' : 'climax')
const SCORES = Array.from({ length: 20 }, (_, i) => Math.round(48 + 34 * Math.sin((i - 4) / 3.2) + (i % 3) * 3))

export const SENTIMENT_DAYS: readonly SentimentDay[] = SCORES.map((score, i) => ({
  date: `${i < 8 ? '10' : '11'}-${String(i < 8 ? 20 + i : i - 6).padStart(2, '0')}`,
  score,
  stage: stageOf(score),
}))

export const SENTIMENT_METRICS: readonly SentimentMetric[] = [
  { key: 'limitUp', label: '涨停数', values: SCORES.map((s) => Math.round(s * 1.1 + 12)), format: (v) => `${v} 只` },
  {
    key: 'height',
    label: '连板高度',
    values: SCORES.map((s) => Math.max(2, Math.round(s / 12))),
    format: (v) => `${v} 板`,
  },
  { key: 'losers', label: '亏钱数', values: SCORES.map((s) => Math.round((100 - s) * 0.9)), format: (v) => `${v} 只` },
  { key: 'seal', label: '封板率', values: SCORES.map((s) => Math.round(50 + s * 0.35)), format: (v) => `${v}%` },
]

export function SentimentCycleUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <SentimentCycle
        days={SENTIMENT_DAYS}
        stages={SENTIMENT_STAGES}
        metrics={SENTIMENT_METRICS}
        labels={{
          title: '情绪周期（演示数据）',
          score: '情绪分',
          gauge: '情绪温度',
          trend: '近 20 日',
          band: '情绪阶段带',
          metrics: '情绪分项',
          current: '当前',
          empty: '没有情绪数据',
        }}
      />
    </div>
  )
}
