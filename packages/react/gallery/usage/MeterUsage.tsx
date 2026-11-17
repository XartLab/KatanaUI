// SPDX-License-Identifier: MIT
import { Meter } from '../../src/blocks'

export function MeterUsage() {
  return (
    <>
      <div className="gal-stack" data-testid="meter-bars">
        <Meter label="LOAD · 敞口" value={72} tone="ok" />
        <Meter label="LOAD · 受锁（超过 60% 上限）" value={38} tone="warn" mark={60} markLabel="上限" />
        <Meter label="回测进度" value={61} />
        <Meter label="OFF" value={0} tone="off" />
      </div>

      <div className="gal-stack" data-testid="meter-gauges">
        <Meter label="RS-20 · 电子" value={94} display="gauge" />
        <Meter label="RS-20 · 军工（弱势）" value={27} display="gauge" tone="danger" />
      </div>

      <div className="gal-stack" data-testid="meter-sync">
        <Meter label="PAPER · 第 21 / 30 天" value={70} display="sync" mark={100} markLabel="评估点" />
        <Meter label="容量使用" value={52} display="sync" tone="ok" mark={80} markLabel="容量上限" />
      </div>
    </>
  )
}
