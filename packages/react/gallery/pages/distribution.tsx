// SPDX-License-Identifier: MIT
import { useMemo, useState } from 'react'
import { Ridgeline } from '../../src/quant'
import {
  histogramBins,
  RangeHistogramSlider,
  UptimeBars,
  uptimeShare,
  type UptimeCell,
  type UptimeStatus,
} from '../../src/index'
import { Row } from './parts'

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 正态分布样本（Box-Muller），均值与标准差自己给。 */
function gaussians(seed: number, count: number, mean: number, sd: number): number[] {
  const next = seeded(seed)
  const out: number[] = []
  while (out.length < count) {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    out.push(mean + sd * r * Math.cos(2 * Math.PI * v))
    if (out.length < count) out.push(mean + sd * r * Math.sin(2 * Math.PI * v))
  }
  return out
}

const NOTE = '演示数据：写死的状态位置，不是真实连接状态。'
const NOTE_DIST = '演示数据：固定种子生成的 2000 个示例涨跌幅，不是行情。'

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

/** 2000 个示例涨跌幅（%，正态，均值 0.3、标准差 2.2）：只为画一条看得出形状的分布。 */
const CHANGES = gaussians(42, 2000, 0.3, 2.2)

export function RangeHistogramSliderDemo() {
  const [range, setRange] = useState<readonly [number, number]>([-2, 3])
  const counts = useMemo(() => histogramBins(CHANGES, -10, 10, 40), [])
  const inside = CHANGES.filter((value) => value >= range[0] && value <= range[1]).length
  return (
    <>
      <p className="gal-note">{NOTE_DIST}</p>
      <Row name="涨跌幅筛选（受控）">
        <div className="gal-wide" data-gallery-range="controlled">
          <RangeHistogramSlider
            counts={counts}
            min={-10}
            max={10}
            step={0.5}
            value={range}
            onValueChange={setRange}
            label="涨跌幅区间"
            labels={{ low: '涨跌幅下限', high: '涨跌幅上限' }}
            formatValue={(value) => `${value.toFixed(1)}%`}
            describe={(r) => `${r[0].toFixed(1)}% 到 ${r[1].toFixed(1)}%，共 ${inside} 个示例`}
          />
        </div>
      </Row>
      <Row name="不受控，默认全选">
        <div className="gal-wide" data-gallery-range="free">
          <RangeHistogramSlider
            counts={counts}
            min={-10}
            max={10}
            step={0.5}
            label="涨跌幅区间（不受控）"
            labels={{ low: '下限', high: '上限' }}
            formatValue={(value) => `${value.toFixed(1)}%`}
          />
        </div>
      </Row>
    </>
  )
}

/** 因子 5 分位层的示例日收益（%）：每层 400 个、标准差 1.8，均值从 −1.2 升到 +1.5。 */
const LAYERS = [-1.2, -0.4, 0.1, 0.7, 1.5].map((mean, i) => ({
  id: `q${i + 1}`,
  label: `第 ${i + 1} 层`,
  values: gaussians(100 + i, 400, mean, 1.8),
}))

export function RidgelineDemo() {
  return (
    <>
      <p className="gal-note">演示数据：固定种子生成的 5 层各 400 个示例收益，不是回测结果。</p>
      <Row name="分层收益分布，0 为基准线">
        <div className="gal-wide" data-gallery-ridge="layers">
          <Ridgeline
            groups={LAYERS}
            label="示例：因子分层的日收益分布"
            baseline={0}
            formatValue={(value) => `${value}%`}
            describe={(group, stats) =>
              `${group.label}：中位数 ${stats.median.toFixed(2)}%，均值 ${stats.mean.toFixed(2)}%，${stats.n} 个`
            }
            idle="悬停或用上下键选一层"
          />
        </div>
      </Row>
      <Row name="没有基准线，窄一点">
        <div className="gal-wide" data-gallery-ridge="plain">
          <Ridgeline
            groups={LAYERS.slice(0, 3)}
            label="示例：前三层（无基准线）"
            rowHeight={28}
            overlap={1.5}
            describe={(group, stats) => `${group.label}：中位数 ${stats.median.toFixed(2)}%`}
          />
        </div>
      </Row>
    </>
  )
}
