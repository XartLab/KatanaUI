# AgentQueue

抓取 / 回补任务的队列：四列从左到右是排队（高优先在前）、工位（并发槽，每槽一个在跑的任务，进度条，被限流时 warn 色倒计时）、完成、失败；头上四个数（排队超过 backpressure 变 warn 色），给了回调才有暂停 / 继续与并发步进（− N +）。下面是最近 window 毫秒的积压深度图（从任务记录推出来）与一道背压虚线，旁边写成字的摘要（现在、峰值、平均）。点一个任务或 Enter 钉住详情（排了多久、跑了多久、第几次、错误），里面有「提到最前」「取消」。件不走钟：now 由调用方给。功能参照 affectUI 的 Agent Queue（affectui.com/components/agent-queue，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）；没有任务在区之间滑动的动画，详情是内嵌区。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentQueue

钉住的任务受控或不受控（openId / defaultOpenId）；暂停、并发、提到最前、取消都是给了回调才出现。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `jobs` * | `readonly QueueJob[]` | — | Every job, in any order. |
| `workers` * | `number` | — | Concurrency: number of worker slots. |
| `now` * | `number` | — | Clock in milliseconds; the component does not tick on its own. |
| `title` * | `ReactNode` | — | Heading. |
| `name` | `string` | — | Muted queue name after the heading. |
| `backpressure` | `number` | — | Waiting count above which the queue is under backpressure. |
| `window` | `number` | `120_000` | Span of the depth chart in milliseconds. |
| `paused` | `boolean` | `false` | Whether the queue is paused. |
| `onPausedChange` | `(paused: boolean) => void` | — | Shows Pause / Resume; called with the new paused state. |
| `onConcurrencyChange` | `(workers: number) => void` | — | Shows the concurrency stepper; called with the new worker count. |
| `minConcurrency` | `number` | `1` | Fewest workers the stepper allows. |
| `maxConcurrency` | `number` | `8` | Most workers the stepper allows. |
| `openId` | `string \| null` | — | Controlled pinned job id; null when none. |
| `defaultOpenId` | `string \| null` | `null` | Pinned job when uncontrolled. |
| `onOpenChange` | `(id: string \| null) => void` | — | Called when the pinned job changes. |
| `onPromote` | `(job: QueueJob) => void` | — | Shows Move to front on queued jobs. |
| `onCancel` | `(job: QueueJob) => void` | — | Shows Cancel on queued and running jobs. |
| `finishedLimit` | `number` | `5` | Finished and failed jobs shown per column, newest first. |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `labels` * | `AgentQueueLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### queueOrder

纯函数：排队的次序，高优先在前，同级按入队早晚。

### workerSlots

纯函数：在跑的按开始早晚占槽，空槽是 null。

### queueDepth

纯函数：一段时间里每一刻在排队的个数。

### depthSummary

纯函数：现在、峰值、平均。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AgentQueue, type QueueJob } from '@katana-ui/react/blocks'

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
```

## States

- 排队：写排了多久；高优先的标小字。
- 在跑：中性色进度条；被限流时条与字 warn 色，写倒计时。
- 空槽：虚线框写 idle。
- 失败：写错误，danger 色。
- 背压：排队数超过 backpressure 时 warn 色，深度图上有虚线。
- 暂停：按钮 aria-pressed 为真，写 resume。

## Don't

- 不要拿它看几个 Agent 随时间的分工：用 AgentLanes。
- 不要拿它分析一次请求的耗时：用 TraceWaterfall。
- 不要让件自己走钟：now 由调用方按自己的节奏给。

## Composition

```
AgentQueue
  头（标题 · 队列名 · dl 四个数 · Button 暂停 · 步进 group）
  四列（排队 ol · 工位 ol · 完成 ul · 失败 ul；每个任务一个按钮）
  region（详情 dl · Button × 2）
  figure（深度图 svg · 摘要）
  播报
```

## Keyboard

- `Tab`：进任务列表（一个停点），再到详情里的按钮
- `↑ ↓ / ← →`：在跑的、排队的、失败的、完成的依次走
- `Home / End`：第一个 / 最后一个
- `Enter / Space`：钉住或放开这个任务的详情
- `Esc`：收起详情，焦点回到任务
