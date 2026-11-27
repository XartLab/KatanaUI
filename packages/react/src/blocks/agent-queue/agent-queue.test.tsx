// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentQueue, type AgentQueueLabels } from './agent-queue.tsx'
import { depthSummary, limitLeft, moveJob, queueDepth, queueOrder, workerSlots, type QueueJob } from './queue-model.ts'

// 时间是秒（×1000 成毫秒）。now = 100 秒。
const s = (sec: number) => sec * 1000
const JOBS: QueueJob[] = [
  { id: 'a', name: '回补 600xxx', kind: 'backfill', status: 'queued', enqueued: s(60) },
  { id: 'b', name: '新闻 东财', kind: 'news', status: 'queued', enqueued: s(80), priority: 'high' },
  { id: 'c', name: '回补 000xxx', kind: 'backfill', status: 'running', enqueued: s(10), started: s(40), progress: 0.5 },
  {
    id: 'd',
    name: '因子取数',
    kind: 'factor',
    status: 'running',
    enqueued: s(20),
    started: s(30),
    limitedUntil: s(130),
  },
  {
    id: 'e',
    name: '新闻 新浪',
    kind: 'news',
    status: 'failed',
    enqueued: s(0),
    started: s(5),
    ended: s(9),
    error: '456',
  },
]

const LABELS: AgentQueueLabels = {
  status: { queued: '排队', running: '在跑', done: '完成', failed: '失败' },
  workers: '工位',
  idle: '空闲',
  high: '高优先',
  place: (n) => `第 ${n} 位`,
  attempt: (n, max) => `第 ${n}/${max ?? '-'} 次`,
  limited: (left) => `限流 ${left}`,
  pause: '暂停',
  resume: '继续',
  concurrency: '并发',
  fewer: '少一个工位',
  more: '多一个工位',
  depth: '积压',
  backpressure: '背压线',
  depthSummary: (sum) => `现在 ${sum.now} · 峰值 ${sum.peak}`,
  live: (limited, over) => `${limited} 个限流${over ? ' · 超过背压' : ''}`,
  details: '任务详情',
  waited: '排了',
  ran: '跑了',
  error: '错误',
  promote: '提到最前',
  cancel: '取消',
  moreItems: (n) => `还有 ${n} 个`,
}

describe('任务队列的排法', () => {
  it('高优先在前，同级按入队早晚；工位按开始早晚占槽，空槽是 null', () => {
    expect(queueOrder(JOBS).map((job) => job.id)).toEqual(['b', 'a'])
    expect(workerSlots(JOBS, 3).map((job) => job?.id ?? null)).toEqual(['d', 'c', null])
    expect(workerSlots(JOBS, 1)).toHaveLength(2)
  })

  it('积压深度从任务记录推：已入队、还没开始的', () => {
    const depth = queueDepth(JOBS, s(0), s(100), 11)
    // 第 50 秒：a 还没入队，c 已开始；b 没入队 → 0。第 90 秒：a、b 在排 → 2。
    expect(depth[5]!.waiting).toBe(0)
    expect(depth[9]!.waiting).toBe(2)
    expect(depthSummary(depth)).toMatchObject({ now: 2, peak: 2 })
    expect(limitLeft(JOBS[3]!, s(100))).toBe(s(30))
    expect(moveJob(['d', 'c', 'b'], 'c', 'ArrowDown')).toBe('b')
    expect(moveJob(['d', 'c', 'b'], 'c', 'Home')).toBe('d')
  })
})

describe('任务队列的渲染', () => {
  it('四列各就各位，限流的写倒计时，排队超过背压变色，钉住的出详情与动作', () => {
    const html = renderToStaticMarkup(
      <AgentQueue
        jobs={JOBS}
        workers={3}
        now={s(100)}
        title="回补队列（示例）"
        backpressure={1}
        defaultOpenId="a"
        onPromote={() => {}}
        onCancel={() => {}}
        onPausedChange={() => {}}
        onConcurrencyChange={() => {}}
        formatDuration={(ms) => `${Math.round(ms / 1000)} 秒`}
        labels={LABELS}
      />,
    )
    expect(html.match(/data-slot="queue-job"/g)).toHaveLength(5)
    expect(html.match(/data-slot="queue-slot"/g)).toHaveLength(3)
    expect(html).toContain('限流 30 秒')
    expect(html).toContain('data-status="queued" data-over=""')
    expect(html).toContain('1 个限流 · 超过背压')
    // a 排在 b 后面，所以有「提到最前」。
    expect(html).toContain('提到最前')
    expect(html).toContain('aria-label="回补 600xxx，backfill，排队，第 2 位"')
  })
})
