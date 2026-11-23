// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, ChromaBlurTransition } from '../../src/index'

export function ChromaBlurTransitionUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <ChromaBlurTransition transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </ChromaBlurTransition>
    </>
  )
}
