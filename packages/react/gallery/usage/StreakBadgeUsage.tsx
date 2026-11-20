// SPDX-License-Identifier: MIT
import { StreakBadge } from '../../src/cn'

export function StreakBadgeUsage() {
  return (
    <>
      <StreakBadge streak={1} />
      <StreakBadge streak={{ boards: 3, days: 5 }} />
      <StreakBadge streak={{ boards: 2, promotedFrom: 1 }} form="promotion" />
    </>
  )
}
