// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { UptimeBars, uptimeShare, type UptimeCell, type UptimeStatus } from '../../src/index'

const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

const view = (tableHead: string[], tableLabel: string) => ({
  actionLabels: ACTIONS,
  tableLabel,
  tableHead,
  onExport: () => {},
  onFullscreen: () => {},
  source: '来源 / 演示数据 · 固定种子合成 · 非行情',
})

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */

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

const STATUS_WORDS = { up: '正常', degraded: '降级', down: '断开', none: '无数据' } as const

export function UptimeBarsUsage() {
  const daily = days()
  const hourly = days(true)
  const [picked, setPicked] = useState('')
  // 对象写法：单位 % 用次一级墨色单独渲染（precision-instrument §2.2）。
  const pctValue = (cells: UptimeCell[]) => ({ value: ((uptimeShare(cells) ?? 0) * 100).toFixed(1), unit: '%' })
  const share = (cells: UptimeCell[]) => `近 ${cells.length} 格可用率 ${((uptimeShare(cells) ?? 0) * 100).toFixed(1)}%`
  return (
    <>
      <div className="gal-wide" data-gallery-uptime="daily">
        <UptimeBars
          {...view(['时间', '状态'], '逐格可用表')}
          cells={daily}
          label="示例行情源 QUOTE HUB · WS 近 30 天"
          statusLabels={STATUS_WORDS}
          availability={pctValue(daily)}
          range={['2026-10-16', '2026-11-14']}
          idle={share(daily)}
        />
      </div>

      <div className="gal-wide" data-gallery-uptime="hourly">
        <UptimeBars
          {...view(['时间', '状态'], '逐格可用表')}
          cells={hourly}
          label="示例连接 近 48 小时"
          statusLabels={STATUS_WORDS}
          availability={pctValue(hourly)}
          range={['2026-11-12 15:00', '2026-11-14 14:00']}
          idle={share(hourly)}
          onSelect={(cell) => setPicked(cell.label)}
        />
        <p data-gallery-uptime-picked>{picked}</p>
      </div>
    </>
  )
}

/** 2000 个示例涨跌幅（%，正态，均值 0.3、标准差 2.2）：只为画一条看得出形状的分布。 */
