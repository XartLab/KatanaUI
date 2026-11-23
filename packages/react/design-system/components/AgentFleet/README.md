# AgentFleet

几个主 Agent 同时跑（盘后研究、风控巡检、回补数据），左边一列主卡：状态环（子 Agent 做完的占比）、一句说明（调用方由合计写）、任务、整个分支的花费与耗时。点主卡在右边打开它的子 Agent 树，再点收起（open 受控或 defaultOpen，缺省打开第一个）；窄于 640px 树落到那张卡下面、把下面的卡往下推。头一行合计整个 Agent 群（读屏会播）。打开的树就是 AgentTree 的树：卡、键盘、要你与失败的小窗都一样。件不取时间；回答只回调人的决定。主卡本身是展开钮，钮里不再放「回答」快捷钮，回答在树里。功能参照 affectUI 的 Agent Fleet（affectui.com/components/agent-fleet，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentFleet

主 Agent 与子 Agent 用 AgentTree 同一个 RunAgent 类型；ring 收到子孙的合计。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `agents` * | `readonly RunAgent[]` | — | Main agents, each with its sub-agents. |
| `open` | `string \| null` | — | Id of the main agent whose tree is open, or null; controlled. |
| `defaultOpen` | `string \| null` | — | Open main agent at first, uncontrolled; defaults to the first agent. |
| `onOpenChange` | `(id: string \| null) => void` | — | Called with the main agent id that opens, or null when its tree folds. |
| `onSelect` | `(agent: RunAgent) => void` | — | Called when a sub-agent card is clicked or gets Enter. |
| `onResolve` | `(agent: RunAgent, action: AgentResolution) => void` | — | Called with the person's answer to a sub-agent that needs you or failed. |
| `now` | `number` | — | Clock in milliseconds for running times; the component does not tick on its own. |
| `title` * | `ReactNode` | — | Heading. |
| `formatCost` * | `(cost: number) => string` | — | How a cost is written. |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `labels` * | `AgentFleetLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AgentFleet, type AgentResolution, type AgentRunStatus, type RunAgent } from '@katana-ui/react/blocks'
import { formatCnAmount } from '@katana-ui/react/cn'

// 示例数据：同时跑的三个主 Agent（盘后研究、风控巡检、回补数据）与它们的子 Agent。花费是人民币元、时间是毫秒，都是手写的演示值；时钟固定在 NOW。
const NOW = 600_000
const AGENTS: readonly RunAgent[] = [
  {
    id: 'research',
    name: '盘后研究',
    model: 'model-a',
    task: '找今天放量的板块',
    status: 'running',
    cost: 0.06,
    started: 0,
    tools: ['研报库', '龙虎榜'],
    children: [
      {
        id: 'sector',
        name: '板块扫描',
        task: '算 31 个行业的量比',
        status: 'done',
        cost: 0.02,
        started: 5_000,
        ended: 62_000,
      },
      {
        id: 'reader',
        name: '读研报',
        task: '读 4 篇券商晨报',
        status: 'running',
        cost: 0.11,
        started: 70_000,
        steps: [
          { title: '下载晨报', status: 'done', tool: '研报库', duration: 4_000 },
          { title: '摘出观点', status: 'running', tool: '摘要' },
        ],
      },
      {
        id: 'confirm',
        name: '确认标的',
        task: '要不要把 3 只票加进自选',
        status: 'waiting',
        ask: '把 600519、000858、300750 加进「盘后观察」自选吗？',
        started: 300_000,
      },
    ],
  },
  {
    id: 'risk',
    name: '风控巡检',
    model: 'model-b',
    task: '每 10 分钟查一次敞口',
    status: 'done',
    cost: 0.01,
    started: 0,
    ended: 45_000,
    children: [
      { id: 'expo', name: '算敞口', task: '组合 A、B', status: 'done', cost: 0.004, started: 2_000, ended: 40_000 },
    ],
  },
  {
    id: 'backfill',
    name: '回补数据',
    task: '补 2024 年的分钟线',
    status: 'failed',
    cost: 0.002,
    started: 120_000,
    ended: 190_000,
    children: [
      { id: 'b1', name: '一季度', task: '补 1–3 月', status: 'done', started: 120_000, ended: 160_000 },
      {
        id: 'b2',
        name: '二季度',
        task: '补 4–6 月',
        status: 'failed',
        error: '数据源返回空，可能停牌',
        ended: 190_000,
      },
      { id: 'b3', name: '三季度', task: '补 7–9 月', status: 'queued' },
    ],
  },
]

const NEXT: Record<AgentResolution, AgentRunStatus> = {
  approve: 'running',
  reject: 'stopped',
  retry: 'running',
  dismiss: 'stopped',
}
const patch = (node: RunAgent, id: string, status: AgentRunStatus): RunAgent =>
  node.id === id ? { ...node, status } : { ...node, children: node.children?.map((child) => patch(child, id, status)) }

const seconds = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} 秒` : `${Math.floor(ms / 60_000)} 分`)

export function AgentFleetUsage() {
  const [agents, setAgents] = useState(AGENTS)
  return (
    <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-agent-fleet="main">
      <AgentFleet
        agents={agents}
        now={NOW}
        title="Agent（示例）"
        onResolve={(agent, action) =>
          setAgents((current) => current.map((main) => patch(main, agent.id, NEXT[action])))
        }
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 3 })}`}
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
          hint: '方向键走，Enter 打开小窗',
          bar: {
            agents: (count) => `${count} 个 Agent`,
            running: (count) => `${count} 在跑`,
            waiting: (count) => `${count} 要你`,
            failed: (count) => `${count} 失败`,
          },
          fleet: '主 Agent',
          ring: (totals) =>
            totals.agents === 0
              ? '没有子 Agent'
              : totals.waiting > 0
                ? `${totals.waiting} 个要你 · ${totals.done} / ${totals.agents} 做完`
                : `${totals.done} / ${totals.agents} 个子 Agent 做完`,
          subAgentsOf: (name) => `${name}的子 Agent`,
          noSubAgents: '没有子 Agent',
        }}
      />
    </div>
  )
}
```

## States

- 打开：主卡焦点色边与选中底色，aria-expanded 为真，右边是它的树。
- 环：按主 Agent 的状态着色（在跑强调色、要你 warn、失败 danger、做完 ok），弧长是做完的占比。
- 排队、停了：主卡 55%。
- 没有子 Agent：打开后写 noSubAgents。
- 窄于 640px：一列，树在打开的那张卡下面。

## Don't

- 不要拿它看一次编排的整棵树：用 AgentTree。
- 不要拿它看时间上的先后：用 AgentLanes。
- 不要拿它分派任务：它只看，不派。

## Composition

```
AgentFleet
  头（标题 · 合计 status）
  group
    button 主卡（环 · 名字 · 模型 · 状态 · 说明 · 工具 · 任务 · 花费 · 耗时）
    region 打开的树（AgentTree 的树）
```

## Keyboard

- `Tab`：进主卡（一个停点），再到打开的树
- `↑ ↓`：上一个 / 下一个主 Agent
- `Home / End`：第一个 / 最后一个主 Agent
- `Enter / Space`：打开或收起这个主 Agent 的树
- `树里`：同 AgentTree
