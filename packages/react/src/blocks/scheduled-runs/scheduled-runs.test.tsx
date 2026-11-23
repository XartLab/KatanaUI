// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { buildSchedule, canDrop, moveSlot, type ScheduleInput, type ScheduledTask } from './schedule-model.ts'
import { ScheduledRuns, type ScheduledRunsLabels } from './scheduled-runs.tsx'

// 三天 × 三个时段，每格额度 100、最多两张卡；now 是第 0 天第 1 个时段（第 0 天第 0 个时段是过去）。
const TASKS: ScheduledTask[] = [
  { id: 'backfill', title: '日 K 回补', usage: 130 },
  { id: 'news', title: '新闻轮询', usage: 40 },
  { id: 'night', title: '夜间校验', usage: 50, at: { day: 1, session: 2 } },
]
const BASE: ScheduleInput = {
  tasks: TASKS,
  pins: [],
  moved: {},
  mode: 'auto',
  days: 3,
  sessions: 3,
  limit: 100,
  minPiece: 15,
  maxPerSession: 2,
  now: { day: 0, session: 1 },
}

const LABELS: ScheduledRunsLabels = {
  mode: '排法',
  auto: '自动',
  manual: '手动',
  stack: '待排',
  stackEmpty: '都排上了',
  week: '本周',
  hint: 'Enter 看详情，Space 拿起放下',
  locked: '已过',
  piece: (i, n) => `${i}/${n}`,
  aimed: (task, cell, room) => `${task} → ${cell}${room ? '' : '（满）'}`,
  dropped: (task, cell) => `${task} 放到 ${cell}`,
  noRoom: (task, cell) => `${cell} 放不下 ${task}`,
  cancelled: (task) => `${task} 放回`,
}

describe('定时运行的排法', () => {
  it('自动模式从当前时段往后填，放不下就拆，过去的格不放', () => {
    const pieces = buildSchedule(BASE)
    const backfill = pieces.filter((piece) => piece.taskId === 'backfill')
    // 130 拆成 100 + 30：第一块占满当前时段，剩下的放到下一格。
    expect(backfill.map((piece) => [piece.usage, piece.slot])).toEqual([
      [100, { day: 0, session: 1 }],
      [30, { day: 0, session: 2 }],
    ])
    expect(pieces.some((piece) => piece.slot?.day === 0 && piece.slot.session === 0)).toBe(false)
    expect(pieces.find((piece) => piece.taskId === 'news')!.slot).toEqual({ day: 0, session: 2 })
  })

  it('拆完剩下的不小于 minPiece：留够 minPiece 给后面', () => {
    const pieces = buildSchedule({ ...BASE, tasks: [{ id: 't', title: 't', usage: 105 }] })
    expect(pieces.map((piece) => piece.usage)).toEqual([90, 15])
  })

  it('手动模式栈里的不排，订好的照旧', () => {
    const pieces = buildSchedule({ ...BASE, mode: 'manual' })
    expect(pieces.filter((piece) => piece.kind === 'stack').map((piece) => piece.taskId)).toEqual(['backfill', 'news'])
    expect(pieces.find((piece) => piece.taskId === 'night')!.slot).toEqual({ day: 1, session: 2 })
  })

  it('挪过的块先占位，剩下的再自动填', () => {
    const pieces = buildSchedule({
      ...BASE,
      pins: [{ id: 'backfill:p0', taskId: 'backfill', usage: 100, slot: { day: 2, session: 0 } }],
    })
    const backfill = pieces.filter((piece) => piece.taskId === 'backfill')
    expect(backfill.map((piece) => [piece.kind, piece.usage])).toEqual([
      ['pinned', 100],
      ['auto', 30],
    ])
  })

  it('放不放得下：过去不收、额度与卡数都要够', () => {
    const pieces = buildSchedule(BASE)
    const news = pieces.find((piece) => piece.taskId === 'news')!
    expect(canDrop(pieces, news, { day: 0, session: 0 }, BASE)).toBe(false)
    expect(canDrop(pieces, news, { day: 0, session: 1 }, BASE)).toBe(false)
    expect(canDrop(pieces, news, { day: 1, session: 2 }, BASE)).toBe(true)
    expect(moveSlot({ day: 0, session: 0 }, 'ArrowLeft', 3, 3)).toEqual({ day: 0, session: 0 })
    expect(moveSlot({ day: 0, session: 0 }, 'ArrowDown', 3, 3)).toEqual({ day: 0, session: 1 })
  })
})

describe('定时运行的渲染', () => {
  it('卡按格摆，拆开的标块号，当前格与过去格各有标记', () => {
    const html = renderToStaticMarkup(
      <ScheduledRuns
        tasks={TASKS}
        days={['周一', '周二', '周三']}
        sessions={['07:00', '12:00', '17:00']}
        now={{ day: 0, session: 1 }}
        title="本周（示例）"
        formatUsage={(u) => `${u}%`}
        labels={LABELS}
      />,
    )
    expect(html.match(/data-slot="schedule-card"/g)).toHaveLength(4)
    expect(html).toContain('1/2')
    expect(html.match(/data-slot="schedule-cell"/g)).toHaveLength(9)
    expect(html).toContain('data-cell="0:1" data-now=""')
    expect(html).toContain('data-cell="0:0" data-past=""')
    expect(html).toContain('都排上了')
  })
})
