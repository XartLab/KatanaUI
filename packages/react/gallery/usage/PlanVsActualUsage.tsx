// SPDX-License-Identifier: MIT
import { PlanVsActual, type PlanStep } from '../../src/index'

// 示例数据：Agent 生成一份周报的计划与实际（单位是分钟，从开始算），数是手写的演示值。取数超了 4 分钟，清洗正在做。
const STEPS: readonly PlanStep[] = [
  { id: 'fetch', name: '取本周成交与权益', plannedStart: 0, plannedEnd: 6, actualStart: 0, actualEnd: 10 },
  { id: 'clean', name: '对账与清洗', plannedStart: 6, plannedEnd: 14, actualStart: 10, actualEnd: null },
  { id: 'attr', name: '盈亏归因', plannedStart: 14, plannedEnd: 24 },
  { id: 'draft', name: '写周报草稿', plannedStart: 24, plannedEnd: 30 },
]

const minutes = (m: number) => `${Math.round(m)} 分`

export function PlanVsActualUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 820 }} data-gallery-pva="main">
      <PlanVsActual
        title="周报生成（示例）"
        steps={STEPS}
        now={16}
        formatTime={(t) => `第 ${Math.round(t)} 分`}
        formatDuration={minutes}
        labels={{
          state: { pending: '排队', running: '进行中', late: '超时', done: '完成', overrun: '超时完成' },
          planned: '计划完成',
          projected: '推算完成',
          shift: (shift) => (shift > 0 ? `晚 ${minutes(shift)}` : shift < 0 ? `早 ${minutes(-shift)}` : '按时'),
          steps: '计划步骤',
          durations: (planned, actual) => (actual === null ? `计划 ${planned}` : `计划 ${planned} · 实际 ${actual}`),
          empty: '还没有计划',
        }}
      />
    </div>
  )
}
