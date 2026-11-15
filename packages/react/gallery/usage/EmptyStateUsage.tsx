// SPDX-License-Identifier: MIT
import { Button } from '../../src/index'
import { EmptyState } from '../../src/blocks'

export function EmptyStateUsage() {
  return (
    <EmptyState tag="NO DATA" title="Nothing selected" actions={<Button variant="primary">Pick a symbol</Button>}>
      <p>Connect a data source first.</p>
    </EmptyState>
  )
}
