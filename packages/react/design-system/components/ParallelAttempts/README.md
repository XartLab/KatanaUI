# ParallelAttempts

一次参数扫描的几组同时跑：每组一行写名字、参数说明、进度条、状态（运行中写当前步，跑完写分数、小注与耗时，失败写原因），跑完且分最好的标「最优」。每个跑完的行有一个「用这组」单选，默认选中最优，点别的就改选。分数方向可配（lowerIsBetter），不写花费。进度条只是装饰，信息都在字里。功能参照 affectUI 的 Parallel Attempts（affectui.com/components/parallel-attempts，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### ParallelAttempts

picked 不给时跟着最优走，用户点过就以用户的为准。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attempts` * | `readonly Attempt[]` | — | Attempts in display order. |
| `title` * | `ReactNode` | — | Heading. |
| `task` | `ReactNode` | — | The shared task, such as the strategy and sample period. |
| `label` * | `string` | — | Accessible name of the attempt group. |
| `picked` | `string \| null` | — | Controlled pick; omit to pick the best finished attempt until the user picks another one. |
| `onPick` | `(attempt: Attempt) => void` | — | Called with the attempt the user picks. |
| `lowerIsBetter` | `boolean` | `false` | Smaller scores win. |
| `formatScore` | `(score: number) => string` | `String` | How a score is written; defaults to String. |
| `formatTook` | `(ms: number) => string` | — | How a wall time in milliseconds is written; omit to hide times. |
| `labels` * | `ParallelAttemptsLabels` | — | Texts. |
| `source` | `string` | — | Source line under the list. |
| `className` | `string` | — | Extra class name on the root. |

### attemptFill

纯函数：进度条长度，跑完满格、排队空、失败停在 progress。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `progress` | `number` | — | Progress 0..1 while running (or where a failed attempt stopped). |
| `status` | `AttemptStatus` | — | Queued, running, done or failed; defaults to queued. |

### bestAttempt

纯函数：跑完且有分的里分最好的，并列取靠前的。

### countAttempts

纯函数：各状态的个数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ParallelAttempts, type Attempt } from '@katana-ui/react/quant'

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
```

## States

- 排队：空条，写「排队」。
- 运行中：中性墨色条到当前进度，右边写当前步。
- 跑完：ok 色满条，写分数；最优的名字后标「最优」。
- 失败：danger 色条停在失败处，写失败与原因。
- 选中：左边一道强调线，按钮写「已选」。
- 没有尝试：写 empty。

## Don't

- 不要拿它看一组参数的细节：用 ExperimentCard 或策略报告。
- 不要把失败的组当成 0 分：它不参与最优。

## Composition

```
ParallelAttempts
  头（标题 · 任务 · 计数）
  radiogroup（每组一行：名字与最优 · 参数 · 进度条 · 状态 · 小注 · 用这组）
```

## Keyboard

- `Tab`：依次聚焦跑完的组的「用这组」
- `Space / Enter`：用这组
