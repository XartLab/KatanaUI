// SPDX-License-Identifier: MIT
import { Bell } from 'lucide-react'
import { ToolButton, Toolbar, ToolbarGroup, ToolSlot } from '../../src/blocks'

export function ToolbarUsage() {
  return (
    <Toolbar label="Chart toolbar">
      <ToolbarGroup side="left">
        <ToolSlot tool="alerts">
          <ToolButton label="Alerts" onClick={() => {}}>
            <Bell />
          </ToolButton>
        </ToolSlot>
      </ToolbarGroup>
    </Toolbar>
  )
}
