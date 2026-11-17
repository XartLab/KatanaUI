// SPDX-License-Identifier: MIT
// 权益曲线的纯逻辑：时间轴 x、线性 / 对数纵轴、镜像回撤的纵轴、默认横轴刻度。
import { extent, niceTicks, PLOT_W, type Plot } from '../lib/chart/series-geometry.ts'

export type EquityScale = 'linear' | 'log'

/** time 在 [start, end] 里的横向位置（0..PLOT_W）；只有一个时刻时放中间。点按自己的时刻摆，间隔不同间距就不同（#725）。 */
export function timeX(time: number, start: number, end: number): number {
  return end === start ? PLOT_W / 2 : ((time - start) / (end - start)) * PLOT_W
}

/** 对数轴要所有值都大于 0。 */
export const canLog = (values: readonly number[]): boolean => values.length > 0 && values.every((v) => v > 0)

/**
 * 上区的纵轴：线性用 niceTicks；对数轴用 1、2、5 × 10ⁿ 取落在范围里的刻度，位置按 ln 摆。
 * 返回的 Plot 的 xAt 由调用方换成按时刻摆的版本。
 */
export function equityPlot(
  values: readonly number[],
  scale: EquityScale,
  height: number,
  pad: { top: number; bottom: number },
  xAt: (index: number) => number,
): Plot {
  const [lo, hi] = extent(values)
  const top = pad.top
  const bottom = height - pad.bottom
  if (scale === 'log' && canLog(values)) {
    const a = Math.log(lo)
    const b = Math.log(hi)
    const span = b - a || 1
    // 上下各留一成。
    const from = a - span * 0.1
    const to = b + span * 0.1
    const yAt = (value: number) => bottom - ((Math.log(value) - from) / (to - from)) * (bottom - top)
    const ticks: number[] = []
    const lowValue = Math.exp(from)
    const highValue = Math.exp(to)
    for (let power = Math.floor(Math.log10(lowValue)); power <= Math.ceil(Math.log10(highValue)); power++)
      for (const unit of [1, 2, 5]) {
        const value = unit * 10 ** power
        if (value >= lowValue && value <= highValue) ticks.push(value)
      }
    return {
      count: values.length,
      domain: [lowValue, highValue],
      xAt,
      yAt,
      step: PLOT_W,
      ticks: ticks.map((value) => ({ value, y: yAt(value) })),
    }
  }
  // 一条平线（还没有盈亏）：niceTicks 上下各留 1。
  const flat = niceTicks(lo, hi, 4)
  const [dl, dh] = flat.domain
  const span = dh - dl || 1
  const yAt = (value: number) => bottom - ((value - dl) / span) * (bottom - top)
  return {
    count: values.length,
    domain: flat.domain,
    xAt,
    yAt,
    step: PLOT_W,
    ticks: flat.ticks.map((value) => ({ value, y: yAt(value) })),
  }
}

/** 下区（镜像回撤）：0 在最上，最深的回撤在最下；全是 0 时没有面。 */
export function drawdownY(value: number, deepest: number, height: number, top: number): number {
  return deepest === 0 ? top : top + (value / deepest) * (height - top)
}

/** 默认横轴刻度：start..end 均分成 count 格，文字由调用方的 format 写（宿主要整点 / 整日刻度就自己给 xTicks）。 */
export function defaultTimeTicks(
  start: number,
  end: number,
  count: number,
  format: (time: number) => string,
): { time: number; label: string }[] {
  if (!(end > start)) return []
  const n = Math.max(2, count)
  return Array.from({ length: n }, (_, i) => {
    const time = start + ((end - start) * i) / (n - 1)
    return { time, label: format(time) }
  })
}
