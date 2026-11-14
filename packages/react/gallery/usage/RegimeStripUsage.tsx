// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RegimeBand, RegimeStrip, type RegimeSegment, type RegimeState } from '../../src/quant'

const regimeStates: readonly RegimeState[] = [
  { id: 'trend', name: '趋势上', color: 1, detail: '47%' },
  { id: 'range', name: '震荡', color: 2, detail: '38%' },
  { id: 'vol', name: '高波下行', color: 4, detail: '11%' },
  { id: 'crisis', name: '危机', color: 7, detail: '4%' },
]

const regimeSegments: readonly RegimeSegment[] = [
  { from: 0, to: 12, state: 'trend' },
  { from: 12, to: 20, state: 'range' },
  { from: 20, to: 26, state: 'vol' },
  { from: 26, to: 40, state: 'trend' },
  { from: 40, to: 50, state: 'range' },
  { from: 50, to: 54, state: 'crisis' },
  { from: 54, to: 66, state: 'range' },
  { from: 66, to: 71, state: 'vol' },
  { from: 71, to: 80, state: 'trend' },
  { from: 80, to: 88, state: 'range' },
  { from: 88, to: 100, state: 'trend', estimated: true },
]

export function RegimeStripUsage() {
  const [active, setActive] = useState<string | null>(null)
  return (
    <>
      <div style={{ width: 620 }} data-testid="regime-strip">
        <RegimeStrip
          title="RUN 3d07 · HMM 4 态 · 月频"
          segments={regimeSegments}
          states={regimeStates}
          label="市场状态带：2019 到 2026，四种状态"
          describe={(segment, state) =>
            `${state.name} · ${segment.from}–${segment.to}${segment.estimated ? '（估）' : ''}`
          }
          current="trend"
          currentText="当前"
          estimateText="估（尚未确认）"
          activeState={active}
          onPickState={setActive}
        />
      </div>

      <div style={{ width: 620 }}>
        <RegimeBand segments={regimeSegments} states={regimeStates} label="只有带" />
      </div>
    </>
  )
}
