// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AgentQueue, type QueueJob } from '../../src/blocks'

// 示例数据：仓库回补队列的一个时刻（时间是毫秒，now = 120 秒），数是手写的演示值，不是任何数据源的真实限额。
const s = (sec: number) => sec * 1000
const JOBS: readonly QueueJob[] = [
  { id: 'q1', name: '回补 沪市 600xxx', kind: '回补', status: 'queued', enqueued: s(70) },
  { id: 'q2', name: '回补 深市 000xxx', kind: '回补', status: 'queued', enqueued: s(80) },
  { id: 'q3', name: '新闻 东财快讯', kind: '新闻', status: 'queued', enqueued: s(100), priority: 'high' },
  { id: 'q4', name: '回补 创业板', kind: '回补', status: 'queued', enqueued: s(110) },
  { id: 'r1', name: '回补 科创板', kind: '回补', status: 'running', enqueued: s(20), started: s(40), progress: 0.62 },
  {
    id: 'r2',
    name: '因子取数 动量',
    kind: '因子',
    status: 'running',
    enqueued: s(30),
    started: s(60),
    progress: 0.3,
    limitedUntil: s(150),
    attempt: 2,
    maxAttempts: 3,
  },
  { id: 'd1', name: '新闻 新浪滚动', kind: '新闻', status: 'done', enqueued: s(0), started: s(5), ended: s(35) },
  { id: 'd2', name: '回补 北交所', kind: '回补', status: 'done', enqueued: s(10), started: s(15), ended: s(58) },
  {
    id: 'f1',
    name: '新闻 腾讯财经',
    kind: '新闻',
    status: 'failed',
    enqueued: s(5),
    started: s(20),
    ended: s(22),
    error: '限流 456',
  },
]

export function AgentQueueUsage() {
  const [workers, setWorkers] = useState(3)
  const [paused, setPaused] = useState(false)
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-aq="main">
      <AgentQueue
        title="回补队列（示例）"
        name="warehouse-backfill"
        jobs={JOBS}
        workers={workers}
        onConcurrencyChange={setWorkers}
        paused={paused}
        onPausedChange={setPaused}
        now={s(120)}
        backpressure={3}
        onPromote={() => {}}
        onCancel={() => {}}
        formatDuration={(ms) => `${Math.round(ms / 1000)} 秒`}
        labels={{
          status: { queued: '排队', running: '在跑', done: '完成', failed: '失败' },
          workers: '工位',
          idle: '空闲',
          high: '高优先',
          place: (place) => `第 ${place} 位`,
          attempt: (attempt, max) => (max === undefined ? `第 ${attempt} 次` : `第 ${attempt} / ${max} 次`),
          limited: (left) => `限流 ${left}`,
          pause: '暂停',
          resume: '继续',
          concurrency: '并发',
          fewer: '少一个工位',
          more: '多一个工位',
          depth: '积压（最近 2 分钟）',
          backpressure: '背压线',
          depthSummary: (sum) => `现在 ${sum.now} · 峰值 ${sum.peak} · 平均 ${sum.average.toFixed(1)}`,
          live: (limited, over) =>
            [limited > 0 ? `${limited} 个任务被限流` : '', over ? '排队超过背压线' : ''].filter(Boolean).join('，'),
          details: '任务详情',
          waited: '排了',
          ran: '跑了',
          error: '错误',
          promote: '提到最前',
          cancel: '取消',
          moreItems: (count) => `还有 ${count} 个`,
        }}
      />
    </div>
  )
}
