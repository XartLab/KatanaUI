# CostWaterfall

一次 Agent 会话的钱和 token 花在哪：每一步（模型调用、工具调用、子 Agent）按调用次序一行，条从前面各步的累计处起、长度是这一步的花费或 token，最后一行的条尾就是合计；负的花费是抵扣，条往回走。子 Agent 可折叠，它的数是自己的加子步的（不用预先加）。头一行写会话状态与合计；花费 / token 切换；「最贵一步」一键跳过去（展开上级、打开详情、聚焦）。每行写名字、种类、模型、量、时长、输入输出 token；Enter 打开详情（提示与回答，或工具的输入与输出，错误）。不复用 AttributionBars：它按大小排序、折「其他」、零轴对称（组件卡明写不用瀑布），这里要守调用次序与累计基线；复用的是 TraceWaterfall 的树键盘 moveSpan、series 色与 niceTicks。功能参照 affectUI 的 Cost Waterfall（affectui.com/components/cost-waterfall，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### CostWaterfall

模式、折叠、打开的详情都可受控；金额、token、时长的写法由调用方给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `steps` * | `readonly CostStep[]` | — | Top-level steps in call order. |
| `title` * | `ReactNode` | — | Heading. |
| `task` | `string` | — | Muted task text after the heading. |
| `label` * | `string` | — | Accessible name of the step tree. |
| `status` | `'live' \| 'done' \| 'failed'` | — | Run status; defaults to live while any step runs. |
| `mode` | `CostMode` | — | Controlled mode. |
| `defaultMode` | `CostMode` | `'cost'` | Mode when uncontrolled. |
| `onModeChange` | `(mode: CostMode) => void` | — | Called when the mode switch changes. |
| `collapsed` | `readonly string[]` | — | Controlled folded sub-agent ids. |
| `defaultCollapsed` | `readonly string[]` | `[]` | Folded sub-agent ids when uncontrolled. |
| `onCollapsedChange` | `(collapsed: readonly string[]) => void` | — | Called with the folded ids after a fold or unfold. |
| `openId` | `string \| null` | — | Controlled step id whose details are open; null when closed. |
| `defaultOpenId` | `string \| null` | `null` | Step open first when uncontrolled. |
| `onOpenChange` | `(id: string \| null) => void` | — | Called when the open step changes. |
| `maxHeight` | `number` | — | Height cap of the step list in pixels; it scrolls past it. |
| `formatCost` * | `(cost: number) => string` | — | How a cost is written (「¥0.42」). |
| `formatTokens` * | `(tokens: number) => string` | — | How a token count is written (「12.3k」). |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `labels` * | `CostWaterfallLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### costRows

纯函数：按折叠展开成可见行，每行带累计轴上的起止。

### priciestStep

纯函数：叶子里最贵的一步与它的上级。

### stepTotals

纯函数：一步连同子步的花费、token 与时长。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Step name. |
| `kind` * | `CostStepKind` | — | Sub-agent, model call or tool call. |
| `status` | `CostStepStatus` | — | Running, done or failed; defaults to done. |
| `model` | `string` | — | Model name of a model call, or any muted text. |
| `cost` | `number` | — | Cost of the step itself; sub-agents add their children on top. |
| `tokensIn` | `number` | — | Prompt (input) tokens. |
| `tokensOut` | `number` | — | Completion (output) tokens. |
| `duration` | `number` | — | Duration in milliseconds; a sub-agent without one sums its children. |
| `input` | `string` | — | Prompt, task or tool input shown in the details. |
| `output` | `string` | — | Response, result or tool output shown in the details. |
| `error` | `string` | — | Error text of a failed step. |
| `children` | `readonly CostStep[]` | — | Steps of a sub-agent. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CostWaterfall, type CostStep } from '@katana-ui/react/blocks'
import { formatCnAmount } from '@katana-ui/react/cn'

// 示例数据：一次「写周报」会话的每一步（花费是人民币元，token 与毫秒是手写的演示值）。取数子 Agent 的数不用预先加，件自己加。
const STEPS: readonly CostStep[] = [
  {
    id: 'plan',
    name: '拆解任务',
    kind: 'llm',
    model: 'model-a',
    cost: 0.12,
    tokensIn: 3200,
    tokensOut: 600,
    duration: 2400,
  },
  {
    id: 'fetch',
    name: '取数',
    kind: 'agent',
    cost: 0.02,
    input: '取本周成交、权益与持仓',
    output: '312 笔成交，5 个账户',
    children: [
      { id: 'q1', name: '查成交', kind: 'tool', cost: 0.01, duration: 380, input: 'trades(week=47)', output: '312 行' },
      { id: 'q2', name: '查权益', kind: 'tool', cost: 0.01, duration: 240, input: 'equity(week=47)', output: '5 行' },
      {
        id: 'sum',
        name: '对账汇总',
        kind: 'llm',
        model: 'model-b',
        cost: 0.36,
        tokensIn: 18600,
        tokensOut: 1400,
        duration: 5200,
      },
    ],
  },
  {
    id: 'draft',
    name: '写周报草稿',
    kind: 'llm',
    model: 'model-a',
    cost: 0.84,
    tokensIn: 22400,
    tokensOut: 5200,
    duration: 14800,
    input: '按归因写三段：收益、回撤、下周计划',
    output: '本周净值 +1.8%……',
  },
  { id: 'cache', name: '提示缓存抵扣', kind: 'tool', cost: -0.18 },
]

export function CostWaterfallUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-cw="main">
      <CostWaterfall
        title="会话花费（示例）"
        task="写第 47 周周报"
        label="会话步骤"
        steps={STEPS}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 2 })}`}
        formatTokens={(tokens) => formatCnAmount(tokens)}
        formatDuration={(ms) => `${(ms / 1000).toFixed(1)} 秒`}
        labels={{
          mode: '看什么',
          cost: '花费',
          tokens: 'token',
          kind: { agent: '子 Agent', llm: '模型', tool: '工具' },
          status: { running: '进行中', done: '完成', failed: '失败' },
          run: { live: '进行中', done: '完成', failed: '失败' },
          priciest: '最贵一步',
          name: '步骤',
          time: '时长',
          tokensIn: '输入',
          tokensOut: '输出',
          io: { agent: ['任务', '结果'], llm: ['提示', '回答'], tool: ['输入', '输出'] },
          details: '这一步的详情',
          error: '错误',
        }}
      />
    </div>
  )
}
```

## States

- 完成：条是种类色；子 Agent 的条淡一些（盖住它的子步）。
- 进行中：条带斜纹；头里写进行中（warn 色）。
- 失败：条 danger 色，详情里写错误。
- 抵扣：负花费，条是 ok 色虚线框、往回走。
- 最贵一步：条外一圈 warn 描边。
- 窄于 720px 藏输入输出两列；窄于 520px 条换到第二行。

## Don't

- 不要拿它看耗时：用 TraceWaterfall。
- 不要拿它看几天、几周的用量与预算：用 Meter 或 AiContextMeter。
- 不要预先把子步的数加到子 Agent 上：件会再加一次。

## Composition

```
CostWaterfall
  头（标题 · 任务 · 状态与合计）
  ToggleGroup（花费 / token）· Button 最贵一步
  列头（步骤 · 累计轴刻度 · 量 · 时长 · 输入 · 输出）
  tree（每行 treeitem：折叠箭头 · 种类 · 名字 · 模型 · 条 · 数）
  region（详情：pre 提示 / 回答 · 错误）
```

## Keyboard

- `Tab`：切换、最贵一步、步骤树（一个停点）、详情里的长文本框
- `↑ ↓`：上一行 / 下一行
- `→`：收着的子 Agent 先展开，展开的到第一个子
- `←`：展开的先收起，否则回上级
- `Home / End`：第一行 / 最后一行
- `Enter / Space`：打开或收起这一步的详情
- `Esc`：收起详情，焦点回到这一行
