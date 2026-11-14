// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { StatusBar, type StatusItem } from '../../src/blocks'
import { Button } from '../../src/index'

const STATUS_ITEMS: readonly StatusItem[] = [
  { id: 'quote', label: 'QUOTE', value: '42 ms', led: 'ok', ledLabel: 'OK', priority: 3, onClick: () => {} },
  { id: 'exec', label: 'EXEC', value: '118 ms', led: 'warn', ledLabel: 'Slow', priority: 3, onClick: () => {} },
  { id: 'live', label: 'LIVE', value: 'IBKR U123', live: true, led: 'on', ledLabel: 'Live account' },
  { id: 'link', label: 'LINK', value: 'A · BTCUSDT', priority: 1, onClick: () => {} },
  { id: 'mode', label: 'MODE', value: 'QUIET', priority: 0 },
  { id: 'clock', value: '09:30:12', priority: 4 },
]

export function StatusBarUsage() {
  const [width, setWidth] = useState(720)
  const items = STATUS_ITEMS
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 760 }}>
      <div style={{ width }} data-testid="status-demo">
        <StatusBar
          label="Status bar"
          moreLabel="More status items"
          left={items.slice(0, 3)}
          center={items.slice(3, 5)}
          right={items.slice(5)}
        />
      </div>
      <Button onClick={() => setWidth(720)}>720</Button>
      <Button onClick={() => setWidth(420)}>420</Button>
      <Button onClick={() => setWidth(260)}>260</Button>
    </div>
  )
}
