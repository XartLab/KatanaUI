# TaskList

点一行打勾：圆圈填上强调色、对勾一笔画出来、文字被一道线划掉，划完这一行沉到底部，其余行弹簧补位；再点取消，回到原位。学自 rare-ui。

## Provide

`*` marks a required prop.

### TaskList

每行是 role=checkbox 的按钮；屏外有 role=status 的区播报勾上与取消。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `readonly Task[]` | — | The tasks, each with id, label and optional done; controlled. |
| `defaultValue` | `readonly Task[]` | — | Initial tasks when uncontrolled. |
| `onValueChange` | `(tasks: Task[]) => void` | — | Called with the new task list after a row is checked or unchecked. |
| `tasks` | `readonly Task[]` | — | Old name of value, kept for one release. |
| `defaultTasks` | `readonly Task[]` | — | Old name of defaultValue, kept for one release. |
| `onTasksChange` | `(tasks: Task[]) => void` | — | Old name of onValueChange, kept for one release. |
| `labels` * | `TaskListLabels` | — | Announcement texts: completed(label) and reopened(label) (required). |
| `label` | `string` | — | Accessible name of the list. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TaskList, type Task } from '@katana-ui/react'

export function TaskListUsage() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'read', label: 'Read the last 20 daily bars' },
    { id: 'suggest', label: 'Suggest, with sources', done: true },
  ])
  return (
    <TaskList
      value={tasks}
      onValueChange={setTasks}
      label="Plan"
      labels={{ completed: (label) => `${label} done`, reopened: (label) => `${label} reopened` }}
    />
  )
}
```

## States

- 未勾：空圈。
- 已勾：圆圈填强调色、对勾画出、文字划掉，沉到底部。
- 再点取消，回到原位。

## Don't

- 任务文案与标签由调用方传。
- 不要拿它做多选筛选：勾上的行会沉底换位置，筛选用 ChipGroup 或 Checkbox。
- 任务的真实状态以数据为准：勾选只回调 onValueChange，写不写回由调用方定。

## Composition

```
TaskList
  li（layout 动画）
    button role=checkbox（圆圈 + 对勾 + 划线文字）
  li role=status（播报）
```

## Keyboard

- `Tab`：在各行之间移动
- `Space / Enter`：勾上或取消
