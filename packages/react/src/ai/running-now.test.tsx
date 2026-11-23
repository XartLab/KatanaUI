// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { RunningNow, runningCounts, type RunningNowLabels, type RunningTask } from './running-now.tsx'

const TASKS: RunningTask[] = [
  { id: 'a', title: '日 K 回补', step: '600xxx 第 3 段', done: 3, total: 8, state: 'running' },
  { id: 'b', title: '调仓建议', done: 2, total: 4, state: 'needs' },
  { id: 'c', title: '因子重算', done: 5, total: 9, state: 'paused' },
]

const LABELS: RunningNowLabels = {
  summary: (c) => `${c.running} 个在跑 · ${c.needs} 个要你`,
  short: (c) => `${c.running} · ${c.needs}`,
  list: '后台任务',
  state: { running: '在跑', paused: '已暂停', needs: '要你', done: '完成' },
  steps: (d, t) => `${d}/${t}`,
  pause: (t) => `暂停 ${t}`,
  resume: (t) => `继续 ${t}`,
  open: (t) => `打开 ${t}`,
  openAll: '打开任务',
  live: (c) => (c.needs > 0 ? `${c.needs} 个任务要你` : ''),
}

describe('正在跑', () => {
  it('按状态计数', () => {
    expect(runningCounts(TASKS)).toEqual({ running: 1, paused: 1, needs: 1, done: 0 })
  })

  it('胶囊写全文摘要，有要你的带标记；关着时不渲染清单', () => {
    const html = renderToStaticMarkup(<RunningNow tasks={TASKS} labels={LABELS} />)
    expect(html).toContain('aria-label="1 个在跑 · 1 个要你"')
    expect(html).toContain('data-needs=""')
    expect(html).not.toContain('data-slot="running-row"')
    expect(html).toContain('1 个任务要你')
    const idle = renderToStaticMarkup(<RunningNow tasks={[]} labels={LABELS} />)
    expect(idle).toContain('data-idle=""')
  })
})
