# AiTaskList

Agent 要走完的一份计划，只读：每一步是 排队 / 进行中 / 完成 / 失败，可带一层子步骤与小注。表头计数从任务派生；完成的行安静下来，进行中的行有流光下划线。与 TaskList（人来勾的清单）是两回事。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiTaskList

label 与 statusLabels 必传；读者不能改状态，调用方推进 tasks。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tasks` * | `readonly AiTask[]` | — | The plan; sub-steps go in `children` of a task, one level deep. |
| `label` * | `string` | — | Heading of the plan, such as "Plan" (required). |
| `statusLabels` * | `Readonly<Record<AiTaskStatus, string>>` | — | Screen-reader words for each status (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiTaskList } from '@katana-ui/react'

export function AiTaskListUsage() {
  return (
    <AiTaskList
      label="计划"
      statusLabels={{ pending: '待办', running: '进行中', done: '已完成', failed: '失败' }}
      tasks={[
        { id: 'a', label: '读取近 20 日行情', status: 'done' },
        { id: 'b', label: '查新闻与资金流向', status: 'running' },
        { id: 'c', label: '生成减仓建议', status: 'pending' },
      ]}
    />
  )
}
```

## States

- pending：空框。
- running：流光下划线。
- done：绿框、对勾被画出来、行淡到 65%。
- failed：红框、叉被画出来。

## Don't

- 要让用户勾选用 TaskList。
- 计数别手传，它是派生的。

## Composition

```
AiTaskList
  div（标题 + n/m）
  ul > li（框 + 文字 + 小注，子步骤缩进一层）
```
