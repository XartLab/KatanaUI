# PlanVsActual

Agent 动手前的计划与做的过程放在同一根时间轴上：头一行计划完成、推算完成与推移（晚了 warn 色）；每步一行写名字、状态（排队 / 进行中 / 超时 / 完成 / 超时完成）、轨道（计划是空心框，实际是实心条，超过计划时长的那一截 warn 色，没开始的步与进行中的步 now 之后的部分按推算位置画虚框）、计划对实际的时长；一道竖线是 now。推算：做完的用实际结束，正在做的按计划时长与 now 取晚的，没开始的接在上一步后面按计划时长排。时间单位与写法由调用方给。功能参照 affectUI 的 Plan vs Actual（affectui.com/components 目录页的说明，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创）。演示数据是示例。

## Provide

`*` marks a required prop.

### PlanVsActual

步按计划次序给；now 与各时间同一单位。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `steps` * | `readonly PlanStep[]` | — | Steps in plan order. |
| `now` * | `number` | — | Current time, in the same unit as the steps. |
| `title` * | `ReactNode` | — | Heading. |
| `formatTime` * | `(time: number) => string` | — | How a time is written. |
| `formatDuration` * | `(duration: number) => string` | — | How a duration is written. |
| `labels` * | `PlanVsActualLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### planDomain

纯函数：时间轴范围。

### planShift

纯函数：计划完成、推算完成与推移。

### projectPlan

纯函数：逐步推算状态、起止与超时。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PlanVsActual, type PlanStep } from '@katana-ui/react'

// 示例数据：Agent 生成一份周报的计划与实际（单位是分钟，从开始算），数是手写的演示值。取数超了 4 分钟，清洗正在做。
const STEPS: readonly PlanStep[] = [
  { id: 'fetch', name: '取本周成交与权益', plannedStart: 0, plannedEnd: 6, actualStart: 0, actualEnd: 10 },
  { id: 'clean', name: '对账与清洗', plannedStart: 6, plannedEnd: 14, actualStart: 10, actualEnd: null },
  { id: 'attr', name: '盈亏归因', plannedStart: 14, plannedEnd: 24 },
  { id: 'draft', name: '写周报草稿', plannedStart: 24, plannedEnd: 30 },
]

const minutes = (m: number) => `${Math.round(m)} 分`

export function PlanVsActualUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-pva="main">
      <PlanVsActual
        title="周报生成（示例）"
        steps={STEPS}
        now={16}
        formatTime={(t) => `第 ${Math.round(t)} 分`}
        formatDuration={minutes}
        labels={{
          state: { pending: '排队', running: '进行中', late: '超时', done: '完成', overrun: '超时完成' },
          planned: '计划完成',
          projected: '推算完成',
          shift: (shift) => (shift > 0 ? `晚 ${minutes(shift)}` : shift < 0 ? `早 ${minutes(-shift)}` : '按时'),
          steps: '计划步骤',
          durations: (planned, actual) => (actual === null ? `计划 ${planned}` : `计划 ${planned} · 实际 ${actual}`),
          empty: '还没有计划',
        }}
      />
    </div>
  )
}
```

## States

- 排队：名字变淡，轨道上是推算位置的虚框。
- 进行中：实心条到 now，后面到推算结束是虚框。
- 超时：进行中且超过计划时长，超出的一截 warn 色，状态字 warn。
- 完成：实心亮条，状态字 ok。超时完成：超出的一截 warn 色。
- 推移：晚了 warn 色，早了 ok 色，按时正文色。
- 没有步：写 empty。

## Don't

- 不要拿它当待办清单：Agent 报进度用 AiTaskList。
- 不要拿它比多个 Agent 并行：它只有一条顺序计划。

## Composition

```
PlanVsActual
  头（标题 · dl 计划完成与推算完成 · 推移）
  ol（每步一行：名字 · 状态 · 轨道（计划框 · 实际条 · 超时段 · 推算框 · now）· 时长）
```
