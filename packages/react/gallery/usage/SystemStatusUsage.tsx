// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, SystemStatus } from '../../src/index'

export function SystemStatusUsage() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <SystemStatus
      tone="warn"
      title="Delayed data"
      actions={<Button size="sm">Details</Button>}
      onDismiss={() => setOpen(false)}
      dismissLabel="Dismiss"
    >
      HK quotes are delayed by 15 minutes.
    </SystemStatus>
  )
}
