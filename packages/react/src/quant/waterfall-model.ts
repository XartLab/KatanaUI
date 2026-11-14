// SPDX-License-Identifier: MIT
// 瀑布（盈亏桥）的累加（纯函数）：起点一根总计柱，中间每一步是一根浮动的增减柱，末尾一根总计柱。
// 增减柱从上一步的累计走到加上它之后；总计柱是从 0 到它自己的值，并把累计重置成这个值。
// 总计柱的值与前面累计起来的不相等时，差额（gap）原样给出、柱也照 value 画：不替调用方把桥抹平，没解释的部分（例：未实现盈亏）在读数里看得见。

export type WaterfallStep = {
  key: string
  label: string
  value: number
  /** delta：在上一步的累计上加 value（默认）；total：value 本身就是累计（期初、期末）。 */
  kind?: 'delta' | 'total'
}

export type WaterfallBar = {
  key: string
  label: string
  kind: 'delta' | 'total'
  /** 柱的两端（数值）：from 是起点、to 是终点；跌的柱 to 小于 from。 */
  from: number
  to: number
  /** 这一步的累计（柱画完之后）。 */
  end: number
  /** 增减柱是 value；总计柱是它与之前累计的差额（0 表示桥对得上；开头的总计柱前面没有累计，恒为 0）。 */
  gap: number
  direction: 'up' | 'down' | 'total' | 'flat'
}

export function waterfallBars(steps: readonly WaterfallStep[]): WaterfallBar[] {
  let running = 0
  return steps.map((step, index): WaterfallBar => {
    if (step.kind === 'total') {
      // 第一步没有「前面累计起来的」可对，开头的总计柱（期初）不算对不上。
      const gap = index === 0 ? 0 : step.value - running
      running = step.value
      return {
        key: step.key,
        label: step.label,
        kind: 'total',
        from: 0,
        to: step.value,
        end: running,
        gap,
        direction: 'total',
      }
    }
    const from = running
    running = from + step.value
    return {
      key: step.key,
      label: step.label,
      kind: 'delta',
      from,
      to: running,
      end: running,
      gap: step.value,
      direction: step.value > 0 ? 'up' : step.value < 0 ? 'down' : 'flat',
    }
  })
}

/** 默认画法下纵轴上下各留的余量占数据跨度的比例：0.1 是取个让柱顶数字与轴底有地方放的值（待定：没有出处，看过几组数据再调）。 */
export const WATERFALL_PAD = 0.1

/**
 * 画布要包住的数值范围。
 * 默认（zeroBaseline 为 false）：所有累计值（每一步的两端）的最低到最高，上下各加 WATERFALL_PAD 的余量，不强行包 0；
 * 总计柱画成从轴底起的截断柱。照常见的盈亏桥（Excel / Power BI 的瀑布图、财经媒体的 EBITDA 桥）：期初是个大数时，从 0 起会把增减压成看不见的细条。
 * zeroBaseline 为 true：包住 0，总计柱从 0 起。
 */
export function waterfallExtent(bars: readonly WaterfallBar[], zeroBaseline = false): readonly [number, number] {
  let lo = zeroBaseline ? 0 : Infinity
  let hi = zeroBaseline ? 0 : -Infinity
  for (const bar of bars) {
    // 总计柱的 from 是 0（只在 zeroBaseline 下才算它的起点）；不从 0 起时它只贡献 to。
    const ends = bar.kind === 'total' && !zeroBaseline ? [bar.to] : [bar.from, bar.to]
    for (const value of ends) {
      lo = Math.min(lo, value)
      hi = Math.max(hi, value)
    }
  }
  if (lo > hi) return [0, 1]
  if (zeroBaseline) return [lo, hi]
  const pad = (hi - lo) * WATERFALL_PAD
  return [lo - pad, hi + pad]
}
