// SPDX-License-Identifier: MIT
import { Button, RichPopover } from '../../src/index'

export function RichPopoverUsage() {
  return (
    <RichPopover
      trigger={<Button>NVDA</Button>}
      title="NVIDIA Corp"
      description="Data-centre revenue guides the sector; earnings are due after the close."
      meta="Earnings 16:05"
      actionLabel="Open chart"
    />
  )
}
