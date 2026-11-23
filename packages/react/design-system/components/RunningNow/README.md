# RunningNow

标题栏或状态栏上的一颗胶囊，写「3 个在跑 · 2 个要你」（有要你的前面的点是 warn 色）；点开是任务清单，每行写进度环、标题、当前步与「第几 / 共几步」，一个图标钮：在跑的暂停、暂停的继续、要你的打开；点行本身也打开。行的次序不跟着状态变、行固定 52px；底下可选「打开任务」。很窄时胶囊只写数字（读屏名仍是全文）。弹层是我们的 Popover。功能参照 affectUI 的 Running Now（affectui.com/components/running-now，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### RunningNow

弹层开合受控或不受控（open / defaultOpen）；暂停、继续、打开都是给了回调才出钮。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tasks` * | `readonly RunningTask[]` | — | Live tasks, in a stable order. |
| `onPause` | `(task: RunningTask) => void` | — | Pauses a running task. |
| `onResume` | `(task: RunningTask) => void` | — | Resumes a paused task. |
| `onOpen` | `(task: RunningTask) => void` | — | Opens a task (row click, or the button of a task that needs you). |
| `onOpenAll` | `() => void` | — | Shows the footer link. |
| `defaultOpen` | `boolean` | `false` | Whether the list starts open when uncontrolled. |
| `open` | `boolean` | — | Controlled open state. |
| `onOpenChange` | `(open: boolean) => void` | — | Called when the list opens or closes. |
| `align` | `'start' \| 'end'` | `'end'` | Which edge of the pill the list lines up with. |
| `labels` * | `RunningNowLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### runningCounts

纯函数：各状态的个数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RunningNow, type RunningTask } from '@katana-ui/react'

// 示例数据：标题栏上的后台任务，条目是手写的演示值。点暂停 / 继续会改这一行的状态。
const TASKS: readonly RunningTask[] = [
  { id: 'r1', title: '日 K 回补', step: '深市 000xxx 第 3 段', done: 3, total: 8, state: 'running' },
  { id: 'r2', title: '调仓建议', step: '等你批准', done: 2, total: 4, state: 'needs' },
  { id: 'r3', title: '因子重算', step: '换手因子', done: 5, total: 9, state: 'paused' },
  { id: 'r4', title: '周报草稿', step: '写下周计划', done: 6, total: 7, state: 'running' },
  { id: 'r5', title: '盘前快照', done: 4, total: 4, state: 'done' },
]

export function RunningNowUsage() {
  const [tasks, setTasks] = useState(TASKS)
  const set = (id: string, state: RunningTask['state']) =>
    setTasks((all) => all.map((task) => (task.id === id ? { ...task, state } : task)))
  return (
    <div className="gal-wide" style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 560 }}>
      <RunningNow
        tasks={tasks}
        onPause={(task) => set(task.id, 'paused')}
        onResume={(task) => set(task.id, 'running')}
        onOpen={() => {}}
        onOpenAll={() => {}}
        labels={{
          summary: (c) =>
            [`${c.running} 个在跑`, c.needs > 0 ? `${c.needs} 个要你` : '', c.paused > 0 ? `${c.paused} 个暂停` : '']
              .filter(Boolean)
              .join(' · '),
          short: (c) => `${c.running} · ${c.needs}`,
          list: '后台任务',
          state: { running: '在跑', paused: '已暂停', needs: '要你', done: '完成' },
          steps: (done, total) => `${done} / ${total}`,
          pause: (title) => `暂停 ${title}`,
          resume: (title) => `继续 ${title}`,
          open: (title) => `打开 ${title}`,
          openAll: '打开任务',
          live: (c) => (c.needs > 0 ? `${c.needs} 个任务要你` : ''),
        }}
      />
    </div>
  )
}
```

## States

- 有要你的：胶囊前的点 warn 色，那一行进度环 warn 色、右上一个小点。
- 没有任务：点是灰的，写 summary 给的空闲文字。
- 完成：进度环 ok 色、满圈，没有钮。
- 很窄（容器窄于 360px）：胶囊只写 short。

## Don't

- 不要把它当任务管理页：清单只是一眼看；全部任务给 onOpenAll。
- 不要拿它看几个 Agent 的分工：用 AgentLanes。

## Composition

```
RunningNow
  button 胶囊（点 · 全文 · 数字版）
  Popover（ul：每行 button（进度环 · 标题与当前步 · 步数）· 图标 Button）· 底栏 Button
  播报
```

## Keyboard

- `Enter / Space / ↓`：在胶囊上：打开清单并聚焦第一行
- `↑ ↓`：行与行之间
- `Home / End`：第一行 / 最后一行
- `Tab`：这一行的钮，再到下一行
- `Esc`：关上，焦点回胶囊
