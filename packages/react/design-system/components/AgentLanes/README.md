# AgentLanes

几个 Agent 并行时，每个 Agent 一条泳道：左边头像缩写、名字、模型与标签（空闲 / 要你），右边最近 span 毫秒的时间轴上画它的任务块（完成中性、在跑斜纹、等人 warn、失败 danger），没结束的长到 now。一个 Agent 交给另一个时，从交出那一块的结束处画一道竖线到接手的泳道。点块或 Enter 打开：等人的块弹出问题与「批准」「拒绝」（焦点先到批准），别的块写做了什么、用了哪些工具、交给谁，给了 onOpen 有「打开」。头上写几个块等人（读屏会播）。件不走钟：now 由调用方给。批准与拒绝只回调人的决定；不给回调时件自己改块的状态（批准接着跑、拒绝算失败），只为文档站演示。功能参照 affectUI 的 Agent Lanes（affectui.com/components/agent-lanes，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentLanes

窗口默认 30 分钟；时间写法由 formatTime 给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `agents` * | `readonly LaneAgent[]` | — | Lanes, top to bottom. |
| `tasks` * | `readonly LaneTask[]` | — | Task blocks on all lanes. |
| `now` * | `number` | — | Clock in milliseconds; the component does not tick on its own. |
| `span` | `number` | `30 * 60_000` | Visible window in milliseconds, ending at now. |
| `onApprove` | `(task: LaneTask) => void` | — | Approves a waiting block; without it the block goes on running. |
| `onReject` | `(task: LaneTask) => void` | — | Rejects a waiting block; without it the block fails. |
| `onOpen` | `(task: LaneTask) => void` | — | Shows Open on non-waiting blocks. |
| `title` * | `ReactNode` | — | Heading. |
| `formatTime` * | `(time: number) => string` | — | How a time is written (axis and block names). |
| `labels` * | `AgentLanesLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### blockSpan

纯函数：块在窗口里的位置，窗口外是 null。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `agent` * | `string` | — | Lane (agent id). |
| `title` * | `string` | — | Task name. |
| `status` * | `LaneTaskStatus` | — | Done, running, waiting on a person, or failed. |
| `start` * | `number` | — | Start, in milliseconds. |
| `end` | `number` | — | End, in milliseconds; omit while it runs or waits. |
| `handoff` | `string` | — | Agent id that takes over when this task ends. |
| `ask` | `string` | — | Question for the person on a waiting task. |
| `summary` | `string` | — | What the task did, shown on open. |
| `tools` | `readonly string[]` | — | Tools it used. |

### agentTag

纯函数：泳道的标签（要你 / 在忙 / 空闲）。

### handoffLinks

纯函数：交接线的位置与起止泳道。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AgentLanes, type LaneAgent, type LaneTask } from '@katana-ui/react'

// 示例数据：三个 Agent 最近 30 分钟的工作（时间是毫秒，now = 30 分），条目是手写的演示值。研究员读完研报交给风控，风控在等你批准。
const MIN = 60_000
const AGENTS: readonly LaneAgent[] = [
  { id: 'research', name: '研究员', model: 'model-a', initials: '研' },
  { id: 'risk', name: '风控', model: 'model-b', initials: '风' },
  { id: 'writer', name: '撰稿', model: 'model-a', initials: '撰' },
]
const TASKS: readonly LaneTask[] = [
  {
    id: 't1',
    agent: 'research',
    title: '读研报',
    status: 'done',
    start: 2 * MIN,
    end: 12 * MIN,
    handoff: 'risk',
    summary: '读完 6 篇，摘出 3 条风险提示',
    tools: ['研报库', '摘要'],
  },
  {
    id: 't2',
    agent: 'risk',
    title: '算敞口',
    status: 'waiting',
    start: 12 * MIN,
    ask: '把组合 A 的仓位从 80% 降到 60%？',
  },
  { id: 't3', agent: 'research', title: '查资金流', status: 'running', start: 18 * MIN, tools: ['资金流'] },
  {
    id: 't4',
    agent: 'writer',
    title: '盘中简报',
    status: 'failed',
    start: 6 * MIN,
    end: 9 * MIN,
    summary: '模板缺字段，停了',
  },
]

export function AgentLanesUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 760 }} data-gallery-al="main">
      <AgentLanes
        title="Agent（示例）"
        agents={AGENTS}
        tasks={TASKS}
        now={30 * MIN}
        onOpen={() => {}}
        formatTime={(time) => `${Math.round(time / MIN)} 分`}
        labels={{
          status: { done: '完成', running: '在跑', waiting: '等你', failed: '失败' },
          tag: { needs: '要你', busy: '在忙', idle: '空闲' },
          attention: (count) => (count > 0 ? `${count} 个块等你` : ''),
          approve: '批准',
          reject: '拒绝',
          open: '打开',
          tools: '工具',
          handoff: (agent) => `交给 ${agent}`,
        }}
      />
    </div>
  )
}
```

## States

- 完成：中性实心块。在跑：斜纹块，长到 now。
- 等人：warn 色块，泳道标签写「要你」，头上计数。
- 失败：danger 色块。
- 空闲：这个 Agent 没有在跑也没有等人，泳道标签写 idle。
- 窄于 520px：名字列只留头像。

## Don't

- 不要拿它排将来的任务：它只看最近的窗口，排程用 ScheduledRuns。
- 不要拿它看一次运行的步骤：用 PlanVsActual 或 AiTaskList。
- 不要拿它看一个 Agent 分给很多 worker：用 FanOutGrid。

## Composition

```
AgentLanes
  头（标题 · 等人计数 status）
  轴（起 · 中 · now）
  每条泳道（头像 · 名字与模型 · 标签 · ul 块：Popover 触发按钮）
  交接线 svg
```

## Keyboard

- `Tab`：一条泳道一条泳道地走每个块
- `Enter / Space`：打开这个块；等人的块弹出批准 / 拒绝
- `Esc`：关上弹层，焦点回到块
