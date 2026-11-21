// SPDX-License-Identifier: MIT
import { LimitUpTimeline } from '../../src/cn'

export function LimitUpTimelineUsage() {
  return (
    <LimitUpTimeline
      items={[
        { code: '600001', name: 'Alpha', time: '09:36', streak: 2, themes: ['Robotics'], amount: 3.2e8 },
        { code: '300002', name: 'Beta', time: '14:49', streak: 1, themes: ['Chips'], amount: 5.6e7, board: 'gem' },
      ]}
      perRow={7}
    />
  )
}
