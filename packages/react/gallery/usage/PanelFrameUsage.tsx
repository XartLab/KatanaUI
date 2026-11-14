// SPDX-License-Identifier: MIT
import { Maximize2, X } from 'lucide-react'
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import { Button } from '../../src/index'

export function PanelFrameUsage() {
  const [focused, setFocused] = useState(true)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 270, height: 150 }} data-testid="frame-focus" onPointerDown={() => setFocused(!focused)}>
          <PanelFrame focused={focused} brackets={focused} aria-label="Chart panel">
            <PanelFrameHeader
              heading="Chart"
              object="· BTCUSDT · 1h"
              linkGroup="A"
              linkLabel="Link group A"
              actions={
                <>
                  <Button variant="icon" aria-label="Maximize">
                    <Maximize2 />
                  </Button>
                  <Button variant="icon" aria-label="Close">
                    <X />
                  </Button>
                </>
              }
            />
            <PanelFrameBody>
              <p className="gal-note" style={{ padding: 8 }}>
                Panel content decides its own density.
              </p>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Collapsible panel">
            <PanelFrameHeader
              heading="Watchlist"
              object="· Core · 24"
              linkGroup="B"
              linkLabel="Link group B, pinned"
              pinned
              collapsible
              collapseLabel="Collapse"
              expandLabel="Expand"
            />
            <PanelFrameBody>
              <p className="gal-note" style={{ padding: 8 }}>
                Collapse leaves only the title bar.
              </p>
            </PanelFrameBody>
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Orders panel">
            <PanelFrameHeader heading="Orders" linkGroup={null} linkLabel="No link group" />
            <PanelFrameBody
              state="disconnected"
              view={{ tag: 'OFFLINE', title: 'Not connected', description: 'Connect an account to see orders.' }}
            />
          </PanelFrame>
        </div>
        <div style={{ width: 270, height: 150 }}>
          <PanelFrame aria-label="Trades panel">
            <PanelFrameHeader heading="Trades" />
            <PanelFrameBody state="loading" loadingLabel="Loading" />
          </PanelFrame>
        </div>
      </div>
    </div>
  )
}
