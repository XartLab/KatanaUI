// SPDX-License-Identifier: MIT
import { HoverExpand } from '../../src/index'

export function HoverExpandUsage() {
  return (
    <div style={{ height: 140 }}>
      <HoverExpand
        label="Sectors"
        items={[
          { id: 'semi', title: 'Semiconductors', children: '+2.34%' },
          { id: 'bank', title: 'Banks', children: '-0.41%' },
          { id: 'ai', title: 'AI compute', children: '+3.10%' },
        ]}
      />
    </div>
  )
}
