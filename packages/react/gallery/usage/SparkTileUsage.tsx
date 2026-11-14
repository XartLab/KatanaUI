// SPDX-License-Identifier: MIT
import { SparkTile } from '../../src/quant'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

export function walk(seed: number, count: number, start = 100, step = 2): number[] {
  const next = seeded(seed)
  const out = [start]
  for (let i = 1; i < count; i++) out.push(+(out[i - 1]! + (next() - 0.5) * 2 * step).toFixed(2))
  return out
}

const spark = (seed: number, base: number, drift: number, spread: number) =>
  walk(seed, 24, base, spread).map((v, i) => v + i * drift)

export function SparkTileUsage() {
  const days = Array.from({ length: 24 }, (_, i) => `D-${24 - i}`)
  const fmt = (v: number) => v.toFixed(2)
  return (
    <>
      <div
        className="gal-wide"
        data-gallery-spark
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}
      >
        <SparkTile
          label="NET ASSET"
          text="¥ 2.42M"
          value={2.42}
          series={spark(21, 100, 0.6, 2)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="净值走势（演示）"
          delta="+1.31% 今日"
          deltaTone="up"
        />
        <SparkTile
          label="DRAWDOWN"
          text="-3.1%"
          value={-3.1}
          series={spark(22, 10, -0.3, 1.5)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="回撤走势（演示）"
          trendTone="neutral"
          delta="峰值 -6.8% · 02-14"
        />
        <SparkTile
          label="SHARPE 60D"
          text="1.84"
          value={1.84}
          series={spark(23, 14, 0.1, 1.2)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="夏普走势（演示）"
          delta="区间 1.2–2.1"
        />
        <SparkTile
          label="TURNOVER"
          text="0.62"
          value={0.62}
          unit="/月"
          series={spark(24, 10, 0, 1.4)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="换手走势（演示）"
          delta="稳定"
        />
        <SparkTile
          label="EXPOSURE"
          text="131"
          value={131}
          unit="/ 150%"
          series={[110, 112, 111, 118, 117, 124, 122, 128, 131]}
          threshold={150}
          near
          formatPoint={fmt}
          seriesLabel="敞口走势（演示）"
          delta="接近上限"
        />
      </div>
    </>
  )
}

/** 演示用的 90 笔平仓：2026-10-08 起，间隔不等（有的隔几分钟、有的隔几小时），权益从 50,000 起，带一段回撤。 */
