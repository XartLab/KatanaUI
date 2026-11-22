// SPDX-License-Identifier: MIT
import { Avatar, AvatarGroup } from '../../src/index'

export function AvatarUsage() {
  return (
    <AvatarGroup label="Strategy reviewers" max={3} size="md" overflowLabel={(count) => `${count} more`}>
      <Avatar alt="Alice Chen" fallback="AC" status="online" statusLabel="Online" />
      <Avatar alt="Bo Wang" fallback="BW" />
      <Avatar alt="Cai Li" fallback="CL" status="away" statusLabel="Away" />
      <Avatar alt="Dan Zhao" fallback="DZ" />
    </AvatarGroup>
  )
}
