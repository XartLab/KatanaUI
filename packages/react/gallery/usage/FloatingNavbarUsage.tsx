// SPDX-License-Identifier: MIT
import { FloatingNavbar } from '../../src/index'

export function FloatingNavbarUsage() {
  return (
    <div style={{ position: 'relative', height: 80 }}>
      <FloatingNavbar
        label="Report sections"
        items={[
          { id: 'summary', label: 'Summary' },
          { id: 'risk', label: 'Risk' },
          { id: 'trades', label: 'Trades' },
        ]}
      />
    </div>
  )
}
