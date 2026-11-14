// SPDX-License-Identifier: MIT
import { useMemo, useState } from 'react'
import { histogramBins, RangeHistogramSlider } from '../../src/index'

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

const CHANGES = gaussians(42, 2000, 0.3, 2.2)

export function RangeHistogramSliderUsage() {
  const [range, setRange] = useState<readonly [number, number]>([-2, 3])
  const counts = useMemo(() => histogramBins(CHANGES, -10, 10, 40), [])
  const inside = CHANGES.filter((value) => value >= range[0] && value <= range[1]).length
  return (
    <>
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
    </>
  )
}

/** 因子 5 分位层的示例日收益（%）：每层 400 个、标准差 1.8，均值从 −1.2 升到 +1.5。 */
