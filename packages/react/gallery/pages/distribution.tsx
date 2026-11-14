// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { UptimeBars, uptimeShare, type UptimeCell, type UptimeStatus } from '../../src/index'
import { Row } from './parts'

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

const NOTE = '演示数据：固定种子生成，不是真实连接状态。'

const STATUS_TEXT: Record<UptimeStatus, string> = { up: '正常', down: '中断', degraded: '降级', none: '无数据' }

/** 逐日 30 格：最早 2 格没有数据，第 6、20 天中断，第 11、12、25 天降级；逐小时 48 格：第 8 小时中断，第 16、17 小时降级。写死的位置，e2e 的几何断言才稳。 */
const days = (hourly = false): UptimeCell[] => {
  const count = hourly ? 48 : 30
  const downAt = hourly ? [7] : [5, 19]
  const degradedAt = hourly ? [15, 16] : [10, 11, 24]
  return Array.from({ length: count }, (_, i) => {
    const status: UptimeStatus =
      i < 2 ? 'none' : downAt.includes(i) ? 'down' : degradedAt.includes(i) ? 'degraded' : 'up'
    const when = hourly ? `${String(i % 24).padStart(2, '0')}:00` : `第 ${i + 1} 天`
    const cuts = status === 'down' ? ` · 断流 ${1 + (i % 4)} 次` : ''
    return { id: String(i), status, label: `${when} · ${STATUS_TEXT[status]}${cuts}` }
  })
}

export function UptimeBarsDemo() {
  const daily = days()
  const hourly = days(true)
  const [picked, setPicked] = useState('')
  const share = (cells: UptimeCell[]) => `近 ${cells.length} 格可用率 ${((uptimeShare(cells) ?? 0) * 100).toFixed(1)}%`
  return (
    <>
      <p className="gal-note">{NOTE}</p>
      <Row name="逐日（30 天）">
        <div className="gal-wide" data-gallery-uptime="daily">
          <UptimeBars cells={daily} label="示例行情源 近 30 天" idle={share(daily)} />
        </div>
      </Row>
      <Row name="逐小时（48 小时），可点">
        <div className="gal-wide" data-gallery-uptime="hourly">
          <UptimeBars
            cells={hourly}
            label="示例连接 近 48 小时"
            idle={share(hourly)}
            onSelect={(cell) => setPicked(cell.label)}
          />
          <p data-gallery-uptime-picked>{picked}</p>
        </div>
      </Row>
    </>
  )
}
