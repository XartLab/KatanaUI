// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Splitter } from '../../src/index'

export function SplitterUsage() {
  const [ratio, setRatio] = useState(0.4)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <div
        data-testid="splitter-demo"
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0, ${ratio}fr) 8px minmax(0, ${1 - ratio}fr)`,
          height: 120,
        }}
      >
        <div style={{ background: 'var(--bg-200)', minWidth: 0 }}>
          <p className="gal-note" style={{ padding: 8 }}>
            {Math.round(ratio * 100)}%
          </p>
        </div>
        <Splitter
          axis="row"
          ratio={ratio}
          minFirst={80}
          minSecond={80}
          onPreview={() => {}}
          onChange={setRatio}
          label="Resize panes"
          valueText={(value) => `First pane ${Math.round(value * 100)}%`}
        />
        <div style={{ background: 'var(--bg-200)', minWidth: 0 }}>
          <p className="gal-note" style={{ padding: 8 }}>
            {100 - Math.round(ratio * 100)}%
          </p>
        </div>
      </div>
    </div>
  )
}
