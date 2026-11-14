// SPDX-License-Identifier: MIT
import { EmptyState, PanelFrame } from '../../src/blocks'

const FRAME_LABELS = { settings: 'Settings', maximize: 'Maximize', restore: 'Restore', close: 'Close' }

// 三种状态并排：普通、聚焦（橙色角括号）、空态（未连接）。内容是写死的示例，不是行情。

export function PanelFrameUsage() {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, width: '100%', height: 250 }}
    >
      <PanelFrame
        index="01"
        title="Watchlist"
        object="Core"
        linkGroup="A"
        linkLabel="Link group A"
        meta="1S"
        source="SOURCE · SIM FEED"
        labels={FRAME_LABELS}
        onMaximize={() => {}}
        onClose={() => {}}
      >
        <p style={{ margin: 12, color: 'var(--ink-300)', font: 'var(--text-data) var(--font-sans)' }}>Normal panel.</p>
      </PanelFrame>
      <PanelFrame
        index="02"
        title="Chart"
        object="AAPL"
        linkGroup="B"
        linkLabel="Link group B"
        meta="LIVE"
        source="SOURCE · SIM FEED"
        focused
        labels={FRAME_LABELS}
        onMaximize={() => {}}
        onClose={() => {}}
      >
        <p style={{ margin: 12, color: 'var(--ink-300)', font: 'var(--text-data) var(--font-sans)' }}>
          Focused panel: brighter title and orange corner brackets.
        </p>
      </PanelFrame>
      <PanelFrame
        index="03"
        title="Order book"
        linkLabel="Link group"
        meta="OFFLINE"
        source="SOURCE · NONE"
        labels={FRAME_LABELS}
        onSettings={() => {}}
        onClose={() => {}}
      >
        <EmptyState tag="NOT CONNECTED" title="No data source">
          <p>Connect a source to see the book.</p>
        </EmptyState>
      </PanelFrame>
    </div>
  )
}
