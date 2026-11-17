// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, SdfBlobTransition } from '../../src/index'

export function SdfBlobTransitionUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <SdfBlobTransition variant="merge" transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </SdfBlobTransition>
    </>
  )
}
