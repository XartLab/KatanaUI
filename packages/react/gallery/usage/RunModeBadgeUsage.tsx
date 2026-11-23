// SPDX-License-Identifier: MIT
import { RunModeBadge } from '../../src/index'

const LABELS = { paper: '模拟', replay: '回放', forward: '前向测试', live: '实盘' } as const

export function RunModeBadgeUsage() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <RunModeBadge mode="paper" labels={LABELS} />
      <RunModeBadge mode="replay" labels={LABELS} />
      <RunModeBadge mode="forward" labels={LABELS} />
      <RunModeBadge mode="live" labels={LABELS} />
    </div>
  )
}
