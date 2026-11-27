# AgentTree

一次多 Agent 运行里，编排 Agent 派生子 Agent、子 Agent 再派生，画成一棵卡片树：每张卡写名字、模型、状态、任务（前面一排工具小方块，多于 4 个摆 3 个加 +N）、花费（有子的写整个分支的花费）与耗时；排队与停下的卡和通向它的线变淡。头一行合计几个 Agent、在跑、要你、失败与总花费（读屏会播）。宽于 560px 时第一层子 Agent 在根下面并排，再往下挂在各自的父下面；窄了每层往里缩。要你、失败与带步骤的卡 Enter 或点开小窗：步骤清单、问题或失败原因、「批准 / 拒绝」「重试 / 不管了」（给了 onResolve）。件不取时间（在跑的耗时量到调用方给的 now）；回答只回调人的决定，状态由调用方的数据改。树的键盘复用 TraceWaterfall 的 moveSpan。功能参照 affectUI 的 Agent Tree（affectui.com/components/agent-tree，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentTree

收起的分支 collapsed 受控或 defaultCollapsed 不受控；花费与时间写法由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `root` * | `RunAgent` | — | The orchestrator with its sub-agents; rebuild it as the run goes on. |
| `collapsed` | `readonly string[]` | — | Folded branch ids, controlled. |
| `defaultCollapsed` | `readonly string[]` | `[]` | Folded branch ids at first, uncontrolled. |
| `onCollapsedChange` | `(collapsed: readonly string[]) => void` | — | Called with the folded ids after a fold or unfold. |
| `onSelect` | `(agent: RunAgent) => void` | — | Called when a card is clicked or gets Enter. |
| `onResolve` | `(agent: RunAgent, action: AgentResolution) => void` | — | Called with the person's answer to an agent that needs you or failed; update its status in your data. |
| `now` | `number` | — | Clock in milliseconds for running times; the component does not tick on its own. |
| `title` * | `ReactNode` | — | Heading. |
| `formatCost` * | `(cost: number) => string` | — | How a cost is written. |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `labels` * | `AgentTreeLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### branchCost

纯函数：分支花费（自己加整棵子树，不是有限数字的不算）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Agent name. |
| `task` * | `string` | — | What it is doing, in one line. |
| `status` * | `AgentRunStatus` | — | Queued, running, waiting (needs you), done, failed or stopped. |
| `model` | `string` | — | Model name. |
| `tools` | `readonly string[]` | — | Tool names, shown as small tiles before the task. |
| `ask` | `string` | — | The decision it waits for. |
| `error` | `string` | — | Why it failed. |
| `cost` | `number` | — | Its own cost; branch cards add up the children. |
| `started` | `number` | — | Start in milliseconds. |
| `ended` | `number` | — | End in milliseconds. |
| `steps` | `readonly AgentRunStep[]` | — | Its steps, opened in a tasks window. |
| `children` | `readonly RunAgent[]` | — | Sub-agents it started. |

### agentElapsed

纯函数：耗时，没结束量到 now；开始在将来算 0。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ended` | `number` | — | End in milliseconds. |
| `started` | `number` | — | Start in milliseconds. |

### agentTotals

纯函数：几个 Agent、在跑、要你、失败、做完与花费。

### visibleAgents

纯函数：按收起的分支展开成可见行（读的次序）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AgentTree, type AgentResolution, type AgentRunStatus, type RunAgent } from '@katana-ui/react/blocks'
import { formatCnAmount } from '@katana-ui/react/cn'

// 示例数据：一次「写周报」的运行，编排 Agent 派出研究员与风控，研究员又派出两个取数的子 Agent。花费是人民币元、时间是毫秒，都是手写的演示值；
// 时钟固定在 NOW，不走。回答之后状态由这里的数据改（件只回调人的决定）。
const NOW = 300_000
const ROOT: RunAgent = {
  id: 'lead',
  name: '编排',
  model: 'model-a',
  task: '写本周复盘',
  status: 'running',
  cost: 0.08,
  started: 0,
  tools: ['计划'],
  children: [
    {
      id: 'research',
      name: '研究员',
      model: 'model-a',
      task: '读龙虎榜与研报，挑三只票',
      status: 'running',
      cost: 0.21,
      started: 12_000,
      tools: ['研报库', '龙虎榜', 'SQL', '图表', '摘要'],
      children: [
        {
          id: 'fetch-day',
          name: '取日线',
          task: '拉 30 只票的日线',
          status: 'done',
          cost: 0.01,
          started: 15_000,
          ended: 48_000,
        },
        {
          id: 'fetch-news',
          name: '取公告',
          task: '拉近 5 天公告',
          status: 'failed',
          error: '公告源限流，第 3 次也没拿到',
          cost: 0.004,
          started: 15_000,
          ended: 91_000,
          steps: [
            { title: '请求公告列表', status: 'done', tool: 'HTTP', duration: 2_000 },
            { title: '翻第 2 页', status: 'failed', tool: 'HTTP', duration: 30_000 },
          ],
        },
      ],
    },
    {
      id: 'risk',
      name: '风控',
      model: 'model-b',
      task: '核对组合敞口',
      status: 'waiting',
      ask: '组合 A 的单票仓位到了 22%，超过 20% 的上限，继续写进复盘吗？',
      cost: 0.03,
      started: 140_000,
    },
    { id: 'writer', name: '撰稿', task: '等研究员与风控', status: 'queued' },
  ],
}

const NEXT: Record<AgentResolution, AgentRunStatus> = {
  approve: 'running',
  reject: 'stopped',
  retry: 'running',
  dismiss: 'stopped',
}
const patch = (node: RunAgent, id: string, status: AgentRunStatus): RunAgent =>
  node.id === id ? { ...node, status } : { ...node, children: node.children?.map((child) => patch(child, id, status)) }

const seconds = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} 秒` : `${Math.floor(ms / 60_000)} 分`)

export function AgentTreeUsage() {
  const [root, setRoot] = useState(ROOT)
  return (
    <div className="gal-wide" style={{ maxWidth: 760 }} data-gallery-agent-tree="main">
      <AgentTree
        root={root}
        now={NOW}
        title="周报运行（示例）"
        onResolve={(agent, action) => setRoot((current) => patch(current, agent.id, NEXT[action]))}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 2 })}`}
        formatDuration={seconds}
        labels={{
          status: { queued: '排队', running: '在跑', waiting: '要你', done: '做完', failed: '失败', stopped: '停了' },
          children: (count) => `${count} 个子 Agent`,
          branch: '分支',
          approve: '批准',
          reject: '拒绝',
          retry: '重试',
          dismiss: '不管了',
          answerOf: (name) => `回答${name}`,
          stepsOf: (name) => `${name}的步骤`,
          more: (count) => `+${count}`,
          hint: '方向键走，← → 收起展开，Enter 打开小窗',
          bar: {
            agents: (count) => `${count} 个 Agent`,
            running: (count) => `${count} 在跑`,
            waiting: (count) => `${count} 要你`,
            failed: (count) => `${count} 失败`,
          },
          tree: 'Agent 树',
        }}
      />
    </div>
  )
}
```

## States

- 在跑：状态字强调色。做完：ok。要你：warn 边与字。失败：danger 边与字。
- 排队、停了：卡 55%，通向它的线变虚。
- 收起：chevron 朝右，aria-expanded 为假，子卡不画。
- 小窗：步骤清单（每步一个状态点）、问题或失败原因、回答钮（给了 onResolve）。
- 窄于 560px：每层往里缩 20px，线在左边。

## Don't

- 不要拿它看几个 Agent 随时间的分工：用 AgentLanes。
- 不要拿它看几个并行的主 Agent：用 AgentFleet。
- 不要拿它看常驻的小组与上下文：用 AgentCrew。

## Composition

```
AgentTree
  头（标题 · 合计 status）
  ul tree
    li treeitem（卡：chevron · 名字 · 模型 · 状态 · 工具小方块 · 任务 · 花费 · 耗时；Popover 小窗）
      ul group（子 Agent）
  键位说明
```

## Keyboard

- `Tab`：进树（一个停点）
- `↑ ↓`：上一张 / 下一张卡
- `→`：收着的先展开，展开的到第一个子
- `←`：展开的先收起，否则回父
- `Home / End`：第一张 / 最后一张
- `Enter`：选中这张卡；要你、失败、带步骤的打开小窗
- `Space`：有子的收起或展开，没子的同 Enter
- `Esc`：关小窗，焦点回卡
