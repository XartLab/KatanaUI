// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RunningNow, type RunningTask } from '../../src/index'

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
