// SPDX-License-Identifier: MIT
// 序列图共用的几何（纯函数，不碰 DOM）：比例尺、好看的刻度、折线与面积的路径。BrushChart、WaterfallChart、HorizonChart、SmallMultiples、SeriesExplorer 都用它，
// 比例尺不另加图表依赖（#1917：几十行自己写）。图画在 viewBox 里：横向宽度是抽象的 PLOT_W，竖向就是像素高度（元素高度固定、preserveAspectRatio="none"），
// 所以不需要量尺寸；文字与十字线是叠在上面的 HTML，按百分比定位。

/** 横向抽象宽度。 */
export const PLOT_W = 1000

export type Domain = readonly [number, number]

const niceNum = (range: number, round: boolean): number => {
  const exp = Math.floor(Math.log10(range))
  const frac = range / 10 ** exp
  const nice = round
    ? frac < 1.5
      ? 1
      : frac < 3
        ? 2
        : frac < 7
          ? 5
          : 10
    : frac <= 1
      ? 1
      : frac <= 2
        ? 2
        : frac <= 5
          ? 5
          : 10
  return nice * 10 ** exp
}

/** 把 [lo, hi] 扩成整齐步长的区间，并给出刻度（Heckbert 的 nice numbers）。lo === hi 时上下各留 1。 */
export function niceTicks(
  lo: number,
  hi: number,
  count = 4,
): { domain: Domain; ticks: readonly number[]; step: number } {
  if (!(hi > lo)) {
    lo = lo - 1
    hi = hi + 1
  }
  const step = niceNum(niceNum(hi - lo, false) / Math.max(1, count - 1), true)
  const from = Math.floor(lo / step) * step
  const to = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let value = from; value <= to + step / 2; value += step) ticks.push(+value.toFixed(10))
  return { domain: [ticks[0]!, ticks[ticks.length - 1]!], ticks, step }
}

/** 一列数的最低与最高（跳过非有限数），可选把 0 包进来；全空返回 [0, 1]。 */
export function extent(values: readonly number[], includeZero = false): Domain {
  let lo = includeZero ? 0 : Infinity
  let hi = includeZero ? 0 : -Infinity
  for (const value of values) {
    if (!Number.isFinite(value)) continue
    if (value < lo) lo = value
    if (value > hi) hi = value
  }
  return lo <= hi ? [lo, hi] : [0, 1]
}

export type PlotOptions = {
  height: number
  padTop?: number
  padBottom?: number
  /** 格是带（柱）还是点（折线）：带的 x 在带中心，点的 x 头尾贴边。 */
  band?: boolean
  tickCount?: number
  /** 不做 nice：直接用给的区间（小图、横带图要贴着数据）。 */
  exact?: boolean
}

export type Plot = {
  count: number
  domain: Domain
  xAt: (index: number) => number
  yAt: (value: number) => number
  /** 每格宽度（band 用）。 */
  step: number
  ticks: readonly { value: number; y: number }[]
}

export function makePlot(count: number, range: Domain, options: PlotOptions): Plot {
  const { height, padTop = 8, padBottom = 8, band = false, tickCount = 4, exact = false } = options
  const nice = exact ? { domain: range, ticks: [] as number[] } : niceTicks(range[0], range[1], tickCount)
  const [lo, hi] = nice.domain
  const top = padTop
  const bottom = height - padBottom
  const span = hi - lo || 1
  const yAt = (value: number) => bottom - ((value - lo) / span) * (bottom - top)
  const step = count > 0 ? PLOT_W / count : PLOT_W
  const xAt = (index: number) =>
    band ? (index + 0.5) * step : count <= 1 ? PLOT_W / 2 : (index / (count - 1)) * PLOT_W
  return { count, domain: nice.domain, xAt, yAt, step, ticks: nice.ticks.map((value) => ({ value, y: yAt(value) })) }
}

const fix = (n: number) => n.toFixed(2)

/** 折线路径：遇到非有限数断开（断成几段，不连过去）。 */
export function linePath(values: readonly number[], plot: Plot): string {
  let d = ''
  let pen = false
  values.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${fix(plot.xAt(index))},${fix(plot.yAt(value))}`
    pen = true
  })
  return d
}

/** 折线下面到 baseline 的面积（baseline 是数值，通常 0 或区间下沿）。跳过非有限数，把剩下的点连成一块；要断开的序列别用它。 */
export function areaPath(values: readonly number[], plot: Plot, baseline: number): string {
  const clean = values.map((value, index) => [index, value] as const).filter(([, value]) => Number.isFinite(value))
  if (clean.length < 2) return ''
  const y0 = fix(plot.yAt(baseline))
  const line = clean.map(([index, value], i) => `${i === 0 ? 'M' : 'L'}${fix(plot.xAt(index))},${fix(plot.yAt(value))}`)
  const first = fix(plot.xAt(clean[0]![0]))
  const last = fix(plot.xAt(clean[clean.length - 1]![0]))
  return `${line.join('')}L${last},${y0}L${first},${y0}Z`
}

/** 位置占整宽的百分比，给 HTML 叠层用。 */
export const pct = (x: number) => `${(x / PLOT_W) * 100}%`
