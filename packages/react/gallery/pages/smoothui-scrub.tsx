// SPDX-License-Identifier: MIT
// Scrubber 的演示：回测时间轴擦洗、下单数量拖动。数据是演示用的闭式曲线，不是真实回测或行情。
import { useState } from 'react'
import { RollingText, Scrubber } from '../../src/index.ts'
import { Row } from './parts.tsx'

const BARS = 120
/** 演示权益曲线：闭式公式，第 i 根 K 线的权益。 */
const equityAt = (i: number) =>
  Math.round((100000 + i * 130 + Math.sin(i / 7) * 1800 - Math.max(0, i - 80) * 90) * 100) / 100
const dayLabel = (i: number) => {
  const d = new Date(Date.UTC(2026, 0, 2 + i))
  return d.toISOString().slice(0, 10)
}
const money = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function ScrubberDemo() {
  const [bar, setBar] = useState(BARS - 1)
  const [qty, setQty] = useState(200)
  const equity = equityAt(bar)
  const notional = qty * 187.42
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 520 }}>
      <Row name="回测回看">
        <Scrubber
          label="回看到"
          min={0}
          max={BARS - 1}
          step={1}
          ticks={9}
          value={bar}
          onValueChange={setBar}
          format={dayLabel}
        />
      </Row>
      <Row name="权益">
        <output data-gallery-scrub-equity>
          <RollingText text={money(equity)} value={equity} animate />
        </output>
      </Row>
      <Row name="下单数量">
        <Scrubber
          label="数量"
          min={0}
          max={1000}
          step={10}
          ticks={9}
          value={qty}
          onValueChange={setQty}
          format={(v) => `${v} 股`}
        />
      </Row>
      <Row name="名义金额">
        <output data-gallery-scrub-notional>
          <RollingText text={money(notional)} value={notional} animate />
        </output>
      </Row>
      <p className="gal-note">
        在条上按下并左右拖动，或聚焦后按 ← → 走一步、Shift 或 PageUp / PageDown 走十步、Home / End 到两端。
      </p>
    </div>
  )
}
