// SPDX-License-Identifier: MIT
import { MessageCircle } from 'lucide-react'
import { GooeyPopover } from '../../src/index'

export function GooeyPopoverUsage() {
  return (
    <div style={{ paddingTop: 120 }}>
      <GooeyPopover trigger={<MessageCircle size={18} />} triggerLabel="Open chat">
        Questions about the strategy? Ask here.
      </GooeyPopover>
    </div>
  )
}
