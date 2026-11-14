// SPDX-License-Identifier: MIT
import { useScrubber } from '../../src/index'
import { Row } from './parts'

// #1917：时间序列与盈亏的件的演示。下面所有数据都是演示用的合成数据（在这个展示页里按固定种子生成，不是行情、不是账户），每页也写明了；应用里没有样本数据。

export const DEMO_NOTE = '演示数据：固定种子合成，不是行情，也不是账户。'

/** 固定种子的伪随机（mulberry32）：每次渲染、每个主题数据都一样，e2e 才能断言具体数。 */
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

const DAY = 86_400_000
/** 演示用的日期轴：2026-01-01 起每天一格（UTC）。 */
export const DEMO_START = Date.UTC(2026, 0, 1)
export const dayAt = (index: number) => new Date(DEMO_START + index * DAY).toISOString().slice(0, 10)

export function UseScrubberDemo() {
  const bars = [4, 7, 5, 9, 12, 8, 6, 10, 14, 11, 7, 9]
  const scrub = useScrubber({ count: bars.length, mode: 'band' })
  return (
    <>
      <Row name="十二格">
        <div className="gal-scrub" data-gallery-scrubber role="group" aria-label="扫读演示：十二根柱" {...scrub.props}>
          {bars.map((value, i) => (
            <span
              key={i}
              className="gal-scrub-bar"
              data-active={scrub.index === i ? 'true' : undefined}
              style={{ height: value * 6 }}
            />
          ))}
        </div>
        <output className="gal-label" data-gallery-scrubber-readout>
          {scrub.index === null ? '未选中' : `第 ${scrub.index + 1} 格 · 值 ${bars[scrub.index]}`}
        </output>
      </Row>
      <p className="gal-note">{DEMO_NOTE}</p>
    </>
  )
}
