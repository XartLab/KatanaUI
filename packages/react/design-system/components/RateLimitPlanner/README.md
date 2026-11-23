# RateLimitPlanner

一个数据源一天里的抓取任务（仓库回补、新闻轮询……）摆在时间轴上，叠起来的负载曲线跟它的限额比：头一行状态（在限额内 / 接近上限 / 超过限额）与峰值时刻；负载面积上一道限额实线、一道预警虚线（限额 × buffer），超过限额的部分涂 danger。每个任务一行，条可以拖（15 分对齐），聚焦后方向键挪 15 分、Shift 或 PageUp / PageDown 挪一小时、Home / End 到最早 / 最晚、Delete 删掉；已开始的任务（早于 now）不能挪。「错开」按负载大小一个个重摆压低峰值；每次挪动底栏播报结果。负载是矩形（匀速打请求），不是爬升再衰减；没有设置对话框与加任务。功能参照 affectUI 的 Rate Limit Planner（affectui.com/components/rate-limit-planner，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry），键位也照它。演示数据是示例，不是任何数据源的真实限额。

## Provide

`*` marks a required prop.

### RateLimitPlanner

时间是从窗口开始算的分钟，钟点写法由 formatTime 给；受控且不给 onRunsChange 时只读。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `runs` | `readonly PlannedRun[]` | — | Controlled jobs. |
| `defaultRuns` | `readonly PlannedRun[]` | `[]` | Jobs when uncontrolled. |
| `onRunsChange` | `(runs: readonly PlannedRun[]) => void` | — | Called with the new jobs after every drag, key move, spread or removal; controlled jobs without it are read-only. |
| `limit` * | `number` | — | The source's limit, in its unit per minute. |
| `buffer` * | `number` | — | Share of the limit to stay under, 0..1; above it the status is near. |
| `span` | `number` | `DAY_MINUTES` | Window length in minutes; defaults to a day. |
| `now` | `number` | — | Current time in minutes from the window start; jobs that started before it cannot move. |
| `formatTime` * | `(minutes: number) => string` | — | How minutes from the window start are written (「15:05」). |
| `formatRate` * | `(rate: number) => string` | — | How a load per minute is written, such as 1,200 / min. |
| `title` * | `ReactNode` | — | Heading. |
| `labels` * | `RateLimitPlannerLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### clampStart

纯函数：开始时间夹进窗口。

### keyMove

纯函数：键盘挪一个任务。

### loadCurve

纯函数：5 分一格的负载曲线。

### peakOf

纯函数：峰值与所在格。

### planStatus

纯函数：ok / near / over。

### spreadRuns

纯函数：贪心错开，峰值不升，已开始的不动。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RateLimitPlanner, type PlannedRun } from '@katana-ui/react/blocks'

// 示例数据：一个数据源一天的抓取任务（窗口从 00:00 开始），限额与速率是演示值，不是任何数据源的真实限额。
// 回补与新闻轮询都挤在收盘后（15:00 起），峰值超过限额；按「错开」或拖动条看峰值降下来。
const RUNS: readonly PlannedRun[] = [
  { id: 'backfill', name: '日 K 回补', start: 900, duration: 90, rate: 600 },
  { id: 'news', name: '新闻轮询', start: 915, duration: 60, rate: 300 },
  { id: 'factor', name: '因子重算取数', start: 930, duration: 45, rate: 250 },
  { id: 'night', name: '夜间全量校验', start: 1320, duration: 60, rate: 400 },
  { id: 'open', name: '开盘前快照', start: 540, duration: 15, rate: 200 },
]

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export function RateLimitPlannerUsage() {
  const [runs, setRuns] = useState<readonly PlannedRun[]>(RUNS)
  return (
    <div className="gal-wide" style={{ maxWidth: 880 }} data-gallery-rlp="main">
      <RateLimitPlanner
        title="数据源排程（示例）"
        runs={runs}
        onRunsChange={setRuns}
        limit={1000}
        buffer={0.8}
        now={600}
        formatTime={clock}
        formatRate={(rate) => `${Math.round(rate).toLocaleString('en-US')} / 分`}
        labels={{
          status: { ok: '在限额内', near: '接近上限', over: '超过限额' },
          peak: (peak, at) => `峰值 ${peak} · ${at}`,
          limit: '限额',
          buffer: '预警线',
          runs: '抓取任务',
          run: (run, start, end, rate) => `${start} → ${end} · ${rate}`,
          locked: '已开始',
          remove: '删除',
          spread: '错开',
          moved: (run, start, peak) => `${run.name} 挪到 ${start}，峰值 ${peak}`,
          empty: '没有抓取任务',
        }}
      />
    </div>
  )
}
```

## States

- 在限额内：ok 色状态牌。
- 接近上限：峰值超过 限额 × buffer，warn 色。
- 超过限额：danger 色，面积超出限额的部分涂 danger。
- 已开始：条是斜纹灰，aria-disabled，没有删除钮，不能拖。
- 只读：受控且不给 onRunsChange，没有删除钮与「错开」。
- 没有任务：写 empty。

## Don't

- 不要拿它盯实时请求：它是排程，不是监控。
- 不要一张图放几个限额：一个限额一张。
- 不要在件里写死限额：各数据源的限额由调用方从适配器读。

## Composition

```
RateLimitPlanner
  头（标题 · 状态 · 峰值）
  负载图（svg 面积 · 超限 · 预警线 · 限额线 · now）· 图例 · 横轴
  ul（每个任务：名字 · 轨道与 slider 条 · 起止与速率 · 删除）
  底栏（Button 错开 · 播报）
```

## Keyboard

- `Tab`：依次聚焦每个任务的条、删除钮、错开
- `← → / ↓ ↑`：早 / 晚 15 分
- `Shift + 方向 / PageDown PageUp`：早 / 晚一小时
- `Home / End`：最早（now 或窗口开始）/ 最晚
- `Delete`：删掉这个任务，焦点到下一个
