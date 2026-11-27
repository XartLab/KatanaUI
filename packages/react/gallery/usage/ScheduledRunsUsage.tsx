// SPDX-License-Identifier: MIT
import { ScheduledRuns, type ScheduledTask } from '../../src/blocks'

// 示例数据：一周前三天的数据任务，每个时段一份数据源配额（100%），数是手写的演示值。
// 回补 130% 一格放不下，自动模式拆成两块；夜间校验与开盘前快照是订好的；now 是周一 12:00，周一 07:00 已过。
const TASKS: readonly ScheduledTask[] = [
  { id: 'backfill', title: '日 K 回补', usage: 130, owner: '回补服务', detail: '沪深 5000 只，按交易所分段' },
  { id: 'news', title: '新闻轮询', usage: 40, owner: '新闻源', detail: '东财、新浪两个源轮流' },
  { id: 'factor', title: '因子重算', usage: 55, owner: '分析运行时' },
  { id: 'night', title: '夜间全量校验', usage: 50, owner: 'data-check', at: { day: 1, session: 2 } },
  { id: 'snap', title: '开盘前快照', usage: 20, owner: '行情', at: { day: 0, session: 0 } },
]

export function ScheduledRunsUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 880 }} data-gallery-sr="main">
      <ScheduledRuns
        title="本周（示例）"
        note="每格一份配额"
        tasks={TASKS}
        days={['周一', '周二', '周三']}
        sessions={['07:00', '12:00', '17:00']}
        now={{ day: 0, session: 1 }}
        formatUsage={(usage) => `${Math.round(usage)}%`}
        labels={{
          mode: '排法',
          auto: '自动',
          manual: '手动',
          stack: '待排',
          stackEmpty: '都排上了',
          week: '本周排程',
          hint: 'Enter 看详情，Space 拿起、方向键挪、Space 放下，Esc 放回',
          locked: '已过',
          piece: (index, count) => `${index}/${count}`,
          aimed: (task, cell, room) => `${task} 对准 ${cell}${room ? '，有空位' : '，没有空位'}`,
          dropped: (task, cell) => `${task} 放到 ${cell}`,
          noRoom: (task, cell) => `${cell} 放不下 ${task}`,
          cancelled: (task) => `${task} 放回原处`,
        }}
      />
    </div>
  )
}
