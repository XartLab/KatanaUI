# FanOutGrid

一个 Agent 把一件大活（给 300 只票补资金流、给 240 篇研报打标签）拆给很多 worker，每个子任务一格，按状态着色：排队灰、在跑强调色、重试 warn、成功 ok、失败 danger。头一行写任务、进度、剩余时间（没跑完的 × 跑完的平均耗时 ÷ 并行数）与花费合计；悬停或聚焦一格，下面写它的 worker、耗时、第几次、结果与错误，Enter 钉住。底下一排状态计数是开关钮（一次亮一种，其余格变淡），有失败的出「重试失败的」。进度每过一成播报一次。功能参照 affectUI 的 Fan-out Grid（affectui.com/components/fan-out-grid，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）；花费写法由调用方给，在跑的格不做流光动画。演示数据是示例。

## Provide

`*` marks a required prop.

### FanOutGrid

格子按 tasks 的次序摆；onSelect 收到钉住的任务或 null。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tasks` * | `readonly FanTask[]` | — | Sub-tasks in the order to show them. |
| `title` * | `ReactNode` | — | Heading. |
| `job` | `string` | — | What the whole job is, such as the number of symbols to fill. |
| `workers` | `number` | — | Concurrent workers, for the time-left estimate. |
| `onRetry` | `(ids: readonly string[]) => void` | — | Called with the failed ids by Retry failed. |
| `onSelect` | `(task: FanTask \| null) => void` | — | Called when a cell is pinned, or with null when released. |
| `formatCost` * | `(cost: number) => string` | — | How a cost is written. |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `labels` * | `FanOutGridLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### fanCounts

纯函数：各状态的个数。

### fanProgress

纯函数：跑完（含失败）的占比。

### fanEta

纯函数：剩余时间，估不出来是 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FanOutGrid, type FanTask } from '@katana-ui/react'
import { formatCnAmount } from '@katana-ui/react/cn'

// 示例数据：给 48 只票补资金流，状态按固定规则生成（不是随机），耗时与花费是演示值。
const STATUS: readonly FanTask['status'][] = ['done', 'done', 'done', 'running', 'done', 'failed', 'done', 'queued']
const TASKS: readonly FanTask[] = Array.from({ length: 48 }, (_, n) => {
  const status = n < 30 ? STATUS[n % STATUS.length]! : n < 34 ? 'running' : n === 34 ? 'retrying' : 'queued'
  const finished = status === 'done' || status === 'failed'
  return {
    id: `t${n}`,
    label: `${600000 + n * 7}`,
    status,
    worker: `w${(n % 4) + 1}`,
    start: finished || status === 'running' ? n * 400 : undefined,
    end: finished ? n * 400 + 2000 + (n % 5) * 300 : undefined,
    cost: finished ? 0.004 : undefined,
    attempts: status === 'failed' ? 3 : 1,
    result: status === 'done' ? '240 行' : undefined,
    error: status === 'failed' ? '没有这只票的数据' : undefined,
  }
})

export function FanOutGridUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 640 }} data-gallery-fan="main">
      <FanOutGrid
        title="分发（示例）"
        job="给 48 只票补资金流"
        tasks={TASKS}
        workers={4}
        onRetry={() => {}}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 3 })}`}
        formatDuration={(ms) => `${Math.round(ms / 1000)} 秒`}
        labels={{
          status: { queued: '排队', running: '在跑', retrying: '重试', done: '成功', failed: '失败' },
          grid: '子任务',
          progress: (finished, total) => `${finished} / ${total}`,
          live: (percent) => `完成 ${percent}%`,
          eta: (text) => (text === null ? '剩余 估算中' : `剩余约 ${text}`),
          cost: (text) => `花费 ${text}`,
          worker: 'worker',
          took: '耗时',
          attempts: '第几次',
          result: '结果',
          error: '错误',
          filter: '按状态看',
          retry: (count) => `重试失败的 ${count} 个`,
          hint: '悬停或聚焦一格看详情；Enter 钉住',
        }}
      />
    </div>
  )
}
```

## States

- 排队：轨道色。在跑：强调色。重试：warn。成功：ok。失败：danger。
- 钉住：格子一圈焦点色，aria-pressed 为真。
- 只看一种：那个计数钮按下，其余格降到 25%。
- 有失败：底栏出「重试失败的」（给了 onRetry）。

## Don't

- 不要拿它看几个 Agent 各干什么：用 AgentLanes。
- 不要拿它看一个队列的积压：用 AgentQueue。
- 不要只靠格子颜色：详情与计数都写成字。

## Composition

```
FanOutGrid
  头（标题 · 任务 · 进度 · 剩余 · 花费）· 进度细条
  ul（每格一个按钮）
  详情一行（aria-describedby）
  底栏（计数开关 group · Button 重试）
  播报
```

## Keyboard

- `Tab`：进格子（一个停点），再到计数开关与重试
- `← →`：前一格 / 后一格
- `↑ ↓`：上一行 / 下一行
- `Home / End`：第一格 / 最后一格
- `Enter / Space`：钉住或放开这一格的详情
- `Esc`：放开钉住的格
