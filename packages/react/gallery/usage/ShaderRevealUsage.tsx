// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, ShaderReveal } from '../../src/index'

export function ShaderRevealUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <ShaderReveal variant="wipe" transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </ShaderReveal>
    </>
  )
}
