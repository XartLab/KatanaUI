# ScheduledRuns

一周的定时任务（回补、新闻、因子重算）按「天 × 时段」排，每个时段一份额度（数据源配额、Agent 会话用量），一格最多 maxPerSession 张卡、格子等高。左边是待排栈，右边是周格子；自动模式按栈的次序从当前时段往后填，放不下就拆成几块（每块不小于 minPiece），手动模式栈里的不排、订好的与挪过的不动。卡能拖；键盘 Space 拿起、方向键瞄准（←→ 前后一天，↑↓ 上下一个时段）、Space 放下、Esc 放回，Enter 开合详情，每一步底栏播报有没有空位。过去的时段变淡、不收卡、里面的卡不能挪；当前时段顶上一道红线。功能参照 affectUI 的 Scheduled Runs（affectui.com/components/scheduled-runs，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）；没有 Agent 头像筛选与循环演示。演示数据是示例。

## Provide

`*` marks a required prop.

### ScheduledRuns

件里记着用户挪过的块；onMove 把每次挪动交给调用方保存。模式受控或不受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tasks` * | `readonly ScheduledTask[]` | — | Tasks in stack order; booked ones carry `at`. |
| `days` * | `readonly string[]` | — | Day column names, left to right. |
| `sessions` * | `readonly string[]` | — | Session row names, top to bottom (start times). |
| `now` | `Slot` | — | Current session; earlier ones are past. |
| `limit` | `number` | `100` | Quota per session, in the unit of task usage. |
| `minPiece` | `number` | `15` | Smallest piece when auto mode splits a task. |
| `maxPerSession` | `number` | `2` | Most cards in one session. |
| `mode` | `'auto' \| 'manual'` | — | Controlled mode. |
| `defaultMode` | `'auto' \| 'manual'` | `'auto'` | Mode when uncontrolled. |
| `onModeChange` | `(mode: 'auto' \| 'manual') => void` | — | Called when the mode switch changes. |
| `onMove` | `(move: ScheduleMove) => void` | — | Called after a card is dropped somewhere new; use it to save. |
| `title` * | `string` | — | Heading. |
| `note` | `string` | — | Quiet note after the heading, such as the session length. |
| `formatUsage` * | `(usage: number) => string` | — | How a usage is written (「35%」). |
| `labels` * | `ScheduledRunsLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### buildSchedule

纯函数：订好的与挪过的先占位，栈里的按模式自动填（会拆）或留在栈里。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tasks` * | `readonly ScheduledTask[]` | — | Tasks in stack order. |
| `pins` * | `readonly SchedulePin[]` | — | Pieces moved by hand. |
| `moved` * | `Readonly<Record<string, Slot>>` | — | Booked tasks moved by hand: task id → new place. |
| `mode` * | `'auto' \| 'manual'` | — | Auto sorts the stack into the week; manual leaves it. |
| `days` * | `number` | — | Number of day columns. |
| `sessions` * | `number` | — | Number of session rows. |
| `limit` * | `number` | — | Quota per session. |
| `minPiece` * | `number` | — | Smallest piece when a task is split. |
| `maxPerSession` * | `number` | — | Most cards in one session. |
| `now` | `Slot` | — | Current session; sessions before it are past. |

### canDrop

纯函数：不是过去、卡数没满、额度够。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key of the card. |
| `taskId` * | `string` | — | Task it belongs to. |
| `usage` * | `number` | — | Quota the card uses. |
| `slot` * | `Slot \| null` | — | Where it sits; null while it waits in the stack. |
| `kind` * | `PieceKind` | — | Booked, moved by hand, sorted in by auto mode, or waiting in the stack. |
| `day` * | `number` | — | Day column, from 0. |
| `session` * | `number` | — | Session row, from 0. |
| `limit` * | `number` | — | Quota per session. |
| `maxPerSession` * | `number` | — | Most cards in one session. |
| `sessions` * | `number` | — | Number of session rows. |
| `now` | `Slot` | — | Current session; sessions before it are past. |

### moveSlot

纯函数：拿着卡时方向键对准的格。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `day` * | `number` | — | Day column, from 0. |
| `session` * | `number` | — | Session row, from 0. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ScheduledRuns, type ScheduledTask } from '@katana-ui/react/blocks'

// 示例数据：一周前三天的数据任务，每个时段一份数据源配额（100%），数是手写的演示值。
// 回补 130% 一格放不下，自动模式拆成两块；夜间校验与开盘前快照是订好的；now 是周一 12:00，周一 07:00 已过。
const TASKS: readonly ScheduledTask[] = [
  { id: 'backfill', title: '日 K 回补', usage: 130, owner: '回补服务', detail: '沪深 5000 只，按交易所分段' },
  { id: 'news', title: '新闻轮询', usage: 40, owner: '新闻源', detail: '东财、新浪两个源轮流' },
  { id: 'factor', title: '因子重算', usage: 55, owner: '分析运行时' },
  { id: 'night', title: '夜间全量校验', usage: 50, owner: 'data-check', at: { day: 1, session: 2 } },
  { id: 'snap', title: '开盘前快照', usage: 20, owner: '行情', at: { day: 0, session: 0 } },
]

export function ScheduledRunsUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 880 }} data-gallery-sr="main">
      <ScheduledRuns
        title="本周（示例）"
        note="每格一份配额"
        tasks={TASKS}
        days={['周一', '周二', '周三']}
        sessions={['07:00', '12:00', '17:00']}
        now={{ day: 0, session: 1 }}
        formatUsage={(usage) => `${Math.round(usage)}%`}
        labels={{
          mode: '排法',
          auto: '自动',
          manual: '手动',
          stack: '待排',
          stackEmpty: '都排上了',
          week: '本周排程',
          hint: 'Enter 看详情，Space 拿起、方向键挪、Space 放下，Esc 放回',
          locked: '已过',
          piece: (index, count) => `${index}/${count}`,
          aimed: (task, cell, room) => `${task} 对准 ${cell}${room ? '，有空位' : '，没有空位'}`,
          dropped: (task, cell) => `${task} 放到 ${cell}`,
          noRoom: (task, cell) => `${cell} 放不下 ${task}`,
          cancelled: (task) => `${task} 放回原处`,
        }}
      />
    </div>
  )
}
```

## States

- 订好的：实线卡。自动排进去的：虚线卡；拆开的写块号（1/2）。
- 拿着：卡描强调色边，对准的格有空位描强调色、没有空位描 danger 虚线。
- 过去的格：变淡，里面的卡写「已过」，不能拿起。
- 当前格：顶上一道 danger 色线。
- 每格底下一道细条是这格已用的额度。
- 栈空：写 stackEmpty。

## Don't

- 不要拿它看一天里请求的峰值：用 RateLimitPlanner。
- 不要拿它盯正在跑的任务：用 AgentQueue。
- 不要在件里写死额度：limit 由调用方从配置读。

## Composition

```
ScheduledRuns
  头（标题 · 小注 · ToggleGroup 自动 / 手动）
  栈（待排的卡）
  周格子（天头 · 时段头 · 每格 group：额度细条 · 卡）
  提示 · 播报
```

## Keyboard

- `Tab`：先栈里的卡，再一天一天走格子里的卡
- `Space`：拿起；拿着时放下
- `← →（拿着）`：前一天 / 后一天
- `↑ ↓（拿着）`：同一天的上一个 / 下一个时段
- `Esc`：放回原处；没拿着时收起详情
- `Enter`：开合这张卡的详情
