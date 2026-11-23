// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, RulerSlider } from '../../src/index.ts'
import { Row } from './parts.tsx'

// RulerSlider（#157）的演示：可用余额是写死的示例数，不连账户、不发请求。

const AVAILABLE = 12_000 // 示例：可用 12,000 USDT

export function RulerSliderDemo() {
  const [share, setShare] = useState(25)
  const [leverage, setLeverage] = useState(5)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 520 }}>
      <RulerSlider
        label="数量占可用"
        min={0}
        max={100}
        majorEvery={25}
        value={share}
        onValueChange={setShare}
        format={(v) => `${v}%`}
      />
      <p className="gal-note" data-testid="ruler-amount">
        示例：可用 {AVAILABLE.toLocaleString('en-US')} USDT，下单 {((AVAILABLE * share) / 100).toLocaleString('en-US')}{' '}
        USDT
      </p>
      <Row>
        <Button onClick={() => setShare(50)}>半仓</Button>
        <Button onClick={() => setShare(100)}>全仓</Button>
        <Button onClick={() => setShare(0)}>清零</Button>
      </Row>
      <RulerSlider
        label="杠杆"
        min={1}
        max={20}
        majorEvery={5}
        value={leverage}
        onValueChange={setLeverage}
        format={(v) => `${v}×`}
      />
      <p className="gal-note">
        拖动刻度尺，或点一下刻度直接到那一格；聚焦后按 ← → 一格，Shift + ← → 或 PageUp / PageDown 一大格，Home / End
        到两端。
      </p>
    </div>
  )
}
