// SPDX-License-Identifier: MIT
// IntradaySeries 演示数据（#260）：编出来的分钟线，闭式公式，不是行情。每次打开都一样。
import type { IntradayPoint } from '../../src/cn/index.ts'

const pad = (value: number) => String(value).padStart(2, '0')
const clock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** 一天的分钟时刻：上午 09:31–11:30，下午 13:01–15:00；auction 为真时前面加 09:15–09:25。 */
export function tradingClocks(auction = false): string[] {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => clock(from + i))
  return [
    ...(auction ? range(9 * 60 + 15, 9 * 60 + 25) : []),
    ...range(9 * 60 + 31, 11 * 60 + 30),
    ...range(13 * 60 + 1, 15 * 60),
  ]
}

/** 一条示例序列：底 + 趋势 + 两个正弦；seed 错开相位；missing 里的时刻留空（整分钟缺失，不是 null）。 */
export function minuteSeries(
  clocks: readonly string[],
  {
    base,
    drift,
    swing,
    seed,
    round = 0,
    missing = [],
  }: {
    base: number
    drift: number
    swing: number
    seed: number
    round?: number
    missing?: readonly string[]
  },
): IntradayPoint[] {
  const skip = new Set(missing)
  return clocks
    .map((time, i): IntradayPoint => {
      const wave = Math.sin(i / 17 + seed) * 0.6 + Math.sin(i / 5.3 + seed * 2.1) * 0.4
      const value = base + drift * (i / clocks.length) + swing * wave
      const scale = 10 ** round
      return { time, value: Math.round(value * scale) / scale }
    })
    .filter((point) => !skip.has(point.time))
}
