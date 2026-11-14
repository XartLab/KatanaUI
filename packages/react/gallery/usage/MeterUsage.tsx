// SPDX-License-Identifier: MIT
import { Meter } from '../../src/quant'

export function MeterUsage() {
  const state = { ok: '正常', warn: '接近', breach: '越限' }
  const ticks = { soft: '软限 80', hard: '硬限 100' }
  const pctText = (v: number) => `${v}%`
  return (
    <>
      <div className="gal-wide" data-gallery-meter="bar" style={{ maxWidth: 360, display: 'grid', gap: 10 }}>
        <Meter label="LOAD · 敞口" value={72} tone="ok" valueText="敞口 72%" formatValue={pctText} />
        <Meter label="LOAD · 受锁" value={38} tone="warn" valueText="受锁 38%" formatValue={pctText} />
        <Meter label="回测进度" value={61} tone="accent" valueText="回测进度 61%" formatValue={pctText} />
        <Meter label="OFF" value={0} tone="off" valueText="停用 0%" formatValue={pctText} />
      </div>
      <div className="gal-wide" data-gallery-meter="limits" style={{ maxWidth: 420, display: 'grid', gap: 14 }}>
        <Meter
          label="总敞口"
          value={40}
          max={120}
          soft={80}
          hard={100}
          tone="ok"
          valueText="已用 40，软限 80，硬限 100，满刻度 120"
          formatValue={pctText}
          stateLabels={state}
          tickLabels={ticks}
        />
        <Meter
          label="单日亏损"
          value={85}
          max={120}
          soft={80}
          hard={100}
          tone="ok"
          valueText="已用 85，软限 80，硬限 100，满刻度 120"
          formatValue={pctText}
          stateLabels={state}
          tickLabels={ticks}
        />
        <Meter
          label="连亏笔数"
          value={130}
          max={120}
          soft={80}
          hard={100}
          tone="ok"
          valueText="已用 130，超过满刻度 120，硬限 100"
          formatValue={pctText}
          stateLabels={state}
          tickLabels={ticks}
        />
      </div>

      <div className="gal-wide" data-gallery-meter="gauge" style={{ maxWidth: 360, display: 'grid', gap: 10 }}>
        <Meter
          display="gauge"
          label="RS-20 · 电子"
          value={94}
          weakBelow={30}
          valueText="RS-20 电子 94"
          formatValue={String}
        />
        <Meter
          display="gauge"
          label="RS-20 · 军工"
          value={27}
          weakBelow={30}
          valueText="RS-20 军工 27"
          formatValue={String}
        />
        <Meter display="gauge" label="RS-20 · 受锁" value={60} locked valueText="RS-20 受锁 60" formatValue={String} />
      </div>

      <div className="gal-wide" data-gallery-meter="sync" style={{ maxWidth: 360 }}>
        <Meter
          display="sync"
          label="PAPER 进度"
          value={64}
          mark={80}
          valueText="paper 进度 64%，评估点 80%"
          formatValue={pctText}
        />
      </div>
    </>
  )
}

/** 演示用的一年每日盈亏：2025-11-15 到 2026-11-14，周末休市（open: false），工作日有数；十月前后撒几个演示事件。 */
