// SPDX-License-Identifier: MIT
import { ParallelAttempts, type Attempt } from '../../src/quant'

// 示例数据：一次参数扫描的五组，分数是样本外夏普；数是手写的演示值。
const ATTEMPTS: readonly Attempt[] = [
  { id: 'p1', name: '组 1', approach: 'fast=8 slow=30 stop=1.5', status: 'done', score: 1.12, took: 41_000 },
  {
    id: 'p2',
    name: '组 2',
    approach: 'fast=10 slow=40 stop=2',
    status: 'done',
    score: 1.38,
    took: 44_000,
    note: '交易 268 笔',
  },
  {
    id: 'p3',
    name: '组 3',
    approach: 'fast=13 slow=60 stop=2',
    status: 'running',
    progress: 0.62,
    step: '第 5 / 8 年',
  },
  {
    id: 'p4',
    name: '组 4',
    approach: 'fast=5 slow=20 stop=1',
    status: 'failed',
    progress: 0.35,
    note: '2025-03 日 K 缺 3 根，停在这里',
  },
  { id: 'p5', name: '组 5', approach: 'fast=21 slow=90 stop=3', status: 'queued' },
]

export function ParallelAttemptsUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 760 }} data-gallery-attempts="main">
      <ParallelAttempts
        title="参数扫描"
        task="双均线 · 样本外 2025-01 → 2026-10 · 分数是样本外夏普"
        label="示例：参数组"
        attempts={ATTEMPTS}
        formatScore={(score) => score.toFixed(2)}
        formatTook={(ms) => `${Math.round(ms / 1000)} 秒`}
        labels={{
          status: { queued: '排队', running: '运行中', done: '跑完', failed: '失败' },
          best: '最优',
          use: '用这组',
          picked: '已选',
          counts: (c) => `${c.done} 跑完 · ${c.running} 运行 · ${c.failed} 失败 · ${c.queued} 排队`,
          empty: '没有参数组',
        }}
        source="来源 / 示例数据"
      />
    </div>
  )
}
