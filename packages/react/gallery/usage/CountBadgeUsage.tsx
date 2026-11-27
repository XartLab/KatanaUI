// SPDX-License-Identifier: MIT
import { Bell } from 'lucide-react'
import { CountBadge } from '../../src/index'

export function CountBadgeUsage() {
  return (
    <CountBadge variant="count" count={7} label="7 unread alerts">
      <Bell aria-hidden="true" />
    </CountBadge>
  )
}
