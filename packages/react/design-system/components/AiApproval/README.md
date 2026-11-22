# AiApproval

Agent 动手之前摆出来的一张卡：问题、事实表（标的、方向、数量、理由）、几个选项。选中不是勾单选钮：选中的一项展开铺满，其余收没。高风险动作（真的下单）的选项带 hold，画成 HoldToConfirm，按住填满才批。改自 SmoothUI，hold 是我们加的。

## Provide

`*` marks a required prop.

### AiApproval

options 里 hold 有值的项画成「按住确认」；其余是普通按钮。facts 的 tone 读 --pnl-up / --pnl-down。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `question` * | `string` | — | What the agent needs a human to settle. |
| `options` * | `readonly AiApprovalOption[]` | — | The options; the first is shown first. |
| `facts` | `readonly AiApprovalFact[]` | — | Key facts of the action, shown as a label / value table (symbol, side, quantity …). |
| `children` | `ReactNode` | — | Extra context under the question, such as the model's reason. |
| `onDecide` | `(option: AiApprovalOption) => void` | — | Called once with the chosen option. |
| `resolvedId` | `string` | — | Render already resolved, e.g. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiApproval } from '@katana-ui/react'

export function AiApprovalUsage() {
  return (
    <AiApproval
      question="AI 建议减仓 600519，是否下单？"
      facts={[
        { label: '标的', value: '贵州茅台 600519' },
        { label: '方向', value: '卖出', tone: 'down' },
        { label: '数量', value: '200 股' },
      ]}
      options={[
        { id: 'approve', label: '批准下单', hold: { hint: '按住约 2 秒批准下单' } },
        { id: 'reject', label: '拒绝', destructive: true },
      ]}
      onDecide={() => undefined}
    />
  )
}
```

## States

- 待决定：事实表加选项，逐个错开进场。
- 按住确认：底色从左填满，松手退回，填满才触发 onDecide。
- 已决定：选中项铺满，其余收没；resolvedId 可直接画成已决定。

## Don't

- 下单、撤单、停策略这类不可撤的动作必须给 hold，不要一次点击就批。
- 不要把被否的选项灰着留着。
- 一次只决定一次：决定后不能再改。

## Composition

```
AiApproval
  p（问题）
  dl（事实表）
  div（理由）
  div role=group
    HoldToConfirm / Button（选项）
    div role=status（已决定）
```

## Keyboard

- `Tab`：依次聚焦各选项
- `Enter / Space（按住）`：hold 项：按住到填满才触发；单击与松开都不触发
- `Enter / Space`：普通选项：触发
