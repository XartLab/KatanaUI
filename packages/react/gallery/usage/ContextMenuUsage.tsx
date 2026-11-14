// SPDX-License-Identifier: MIT
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../src/index'

export function ContextMenuUsage() {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>Right-click here</div>
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="Panel menu">
        <ContextMenuItem>Clone panel</ContextMenuItem>
        <ContextMenuItem>Close panel</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
