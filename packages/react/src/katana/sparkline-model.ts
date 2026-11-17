// SPDX-License-Identifier: MIT
// 迷你图的几何（纯函数，Sparkline 只管把它们画出来）：断点分段、纵横刻度、设备像素对齐、单调曲线、基准切分、最高最低、标签放左放右、悬停取点。
// 为什么单拎出来：画的是真实像素（不再拉伸），线宽、点位、柱宽都要按设备像素对齐，这些数要能单测，不能埋在组件里。
import type { LinePoint } from '../lib/live-line.ts'
import { quoteTone, type QuoteTone } from './quote-tone.ts'

/** 线宽（CSS 像素）。样式里 .k-spark-line 的 stroke-width 与它同值：吸附要按这个宽度算奇偶。 */
export const SPARK_LINE_W = 1.5
/** 上下各留的像素：放得下末端点的圆加外圈（2.5）与半根线宽。 */
export const SPARK_PAD_Y = 3
/** 成交量柱占的高度比例。 */
export const SPARK_VOLUME_SHARE = 0.25

export type SparkValue = number | null | undefined
export type SparkCurve = 'linear' | 'monotone'
/** 以基准为界：基准之上、之下、正好在基准上。 */
export type SparkSide = 'up' | 'down' | 'flat'

/** 是有限数才算一个点；null、undefined、NaN、Infinity 都是断点。 */
export const isSparkValue = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** 把含断点的一列规整成「断点为 NaN」的数列（延伸过场与比较用）。 */
export const sparkNumbers = (values: readonly SparkValue[]): number[] =>
  values.map((value) => (isSparkValue(value) ? value : Number.NaN))

/** 有效点的个数。 */
export const sparkCount = (values: readonly SparkValue[]): number => values.filter(isSparkValue).length

/** 最后一个有效点的下标；没有返回 -1。 */
export function lastValid(values: readonly SparkValue[]): number {
  for (let i = values.length - 1; i >= 0; i--) if (isSparkValue(values[i])) return i
  return -1
}

/** 第一个有效点的下标；没有返回 -1。 */
export function firstValid(values: readonly SparkValue[]): number {
  return values.findIndex(isSparkValue)
}

/** 按断点切成连续的段，每段是下标数组；单点的段保留（线画不出，只能画点）。 */
export function splitRuns(values: readonly SparkValue[]): number[][] {
  const runs: number[][] = []
  let current: number[] = []
  values.forEach((value, i) => {
    if (isSparkValue(value)) current.push(i)
    else if (current.length) {
      runs.push(current)
      current = []
    }
  })
  if (current.length) runs.push(current)
  return runs
}

// ———— 设备像素对齐 ————

/**
 * 一根线的中心线应落在哪：线宽换算成设备像素是奇数时中心压在半像素上，偶数时压在整像素上，这样线的两条边正好贴设备像素，不糊成两条半透明的。
 * v 与返回值都是 CSS 像素；dpr 是设备像素比。
 */
export function snapLine(v: number, widthCss: number, dpr: number): number {
  const device = Math.max(1, Math.round(widthCss * dpr))
  const scaled = v * dpr
  return (device % 2 === 1 ? Math.floor(scaled) + 0.5 : Math.round(scaled)) / dpr
}

/** 一块矩形的 [起点, 长度] 都吸到设备像素上；长度至少一个设备像素。 */
export function snapSpan(start: number, size: number, dpr: number): readonly [number, number] {
  const a = Math.round(start * dpr)
  const b = Math.max(a + 1, Math.round((start + size) * dpr))
  return [a / dpr, (b - a) / dpr]
}

// ———— 刻度 ————

export type SparkLayout = {
  width: number
  height: number
  /** 绘图区左右边（x）。 */
  left: number
  right: number
  /** 绘图区上下边（y）；底边之下还有成交量与留白。 */
  top: number
  bottom: number
  /** 值域；值全相等时已经撑开 1，一条平线落在正中。 */
  lo: number
  hi: number
  /** 点位数（含断点）。 */
  count: number
  /** true：每个值占一格、点在格子中央（柱与胜负格）；false：首尾贴两端（线）。 */
  slots: boolean
}

export type SparkLayoutOptions = {
  width: number
  height: number
  /** 左右留白；右边要放末端点与右端文字时调用方把它们的宽度算进去。 */
  padLeft?: number
  padRight?: number
  padY?: number
  /** 底部要让出的高度（成交量柱）。 */
  bottomReserve?: number
  /** 基准：在显示范围里，基准线才落得进图。 */
  baseline?: number
  /** 给了就按它的 [最低, 最高] 排，不按这列自己的。 */
  extent?: readonly [number, number]
  slots?: boolean
}

/** 由数据与尺寸算刻度。没有有效点时值域按 0 到 1 排。 */
export function sparkLayout(values: readonly SparkValue[], o: SparkLayoutOptions): SparkLayout {
  const padY = o.padY ?? SPARK_PAD_Y
  const finite = values.filter(isSparkValue)
  if (o.baseline !== undefined && isSparkValue(o.baseline)) finite.push(o.baseline)
  let lo = o.extent ? o.extent[0] : finite.length ? Math.min(...finite) : 0
  let hi = o.extent ? o.extent[1] : finite.length ? Math.max(...finite) : 1
  if (hi === lo) {
    lo -= 0.5
    hi += 0.5
  }
  return {
    width: o.width,
    height: o.height,
    left: o.padLeft ?? 2,
    right: Math.max((o.padLeft ?? 2) + 1, o.width - (o.padRight ?? 3)),
    top: padY,
    bottom: Math.max(padY + 1, o.height - (o.bottomReserve ?? 0) - padY),
    lo,
    hi,
    count: values.length,
    slots: o.slots ?? false,
  }
}

/** 第 i 个值的横坐标。 */
export function xAt(layout: SparkLayout, i: number): number {
  const span = layout.right - layout.left
  if (layout.slots) return layout.left + ((i + 0.5) / Math.max(1, layout.count)) * span
  return layout.left + (layout.count > 1 ? (i / (layout.count - 1)) * span : span / 2)
}

/** 一个值的纵坐标：最高在顶、最低在底。 */
export function yAt(layout: SparkLayout, value: number): number {
  return layout.bottom - ((value - layout.lo) / (layout.hi - layout.lo)) * (layout.bottom - layout.top)
}

/** 一列值的坐标：断点处 y 是 NaN；y 吸到设备像素（水平线才清晰）。 */
export function sparkLayoutPoints(values: readonly SparkValue[], layout: SparkLayout, dpr = 1): LinePoint[] {
  return values.map((value, i) => {
    const x = xAt(layout, i)
    return isSparkValue(value)
      ? ([x, snapLine(yAt(layout, value), SPARK_LINE_W, dpr)] as const)
      : ([x, Number.NaN] as const)
  })
}

// ———— 曲线 ————

const sign = (x: number) => (x < 0 ? -1 : 1)

/** 单调三次插值（Fritsch-Carlson，同 d3 的 curveMonotoneX）每个点处的斜率：不会冲出相邻两点之外。 */
export function monotoneTangents(xs: readonly number[], ys: readonly number[]): number[] {
  const n = xs.length
  if (n < 2) return n === 1 ? [0] : []
  const dx = (k: number) => xs[k + 1]! - xs[k]!
  const slope = (k: number) => (dx(k) ? (ys[k + 1]! - ys[k]!) / dx(k) : 0)
  const tangents: number[] = new Array<number>(n).fill(0)
  for (let k = 1; k < n - 1; k++) {
    const s0 = slope(k - 1)
    const s1 = slope(k)
    const h0 = dx(k - 1)
    const h1 = dx(k)
    const p = h0 + h1 ? (s0 * h1 + s1 * h0) / (h0 + h1) : 0
    tangents[k] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
  }
  const edge = (k: number, t: number) => (dx(k) ? (3 * slope(k) - t) / 2 : t)
  if (n === 2) {
    tangents[0] = slope(0)
    tangents[1] = slope(0)
  } else {
    tangents[0] = edge(0, tangents[1]!)
    tangents[n - 1] = (3 * slope(n - 2) - tangents[n - 2]!) / 2
  }
  return tangents
}

const f = (v: number) => (Math.round(v * 100) / 100).toString()

/** 一段连续点的折线路径（M…L…），或单调三次（M…C…）。少于两个点返回空串。 */
export function runPath(run: readonly LinePoint[], curve: SparkCurve = 'linear'): string {
  if (run.length < 2) return ''
  const head = `M${f(run[0]![0])} ${f(run[0]![1])}`
  if (curve === 'linear' || run.length === 2) {
    return (
      head +
      run
        .slice(1)
        .map(([x, y]) => `L${f(x)} ${f(y)}`)
        .join('')
    )
  }
  const t = monotoneTangents(
    run.map((p) => p[0]),
    run.map((p) => p[1]),
  )
  let d = head
  for (let k = 0; k < run.length - 1; k++) {
    const [x0, y0] = run[k]!
    const [x1, y1] = run[k + 1]!
    const h = (x1 - x0) / 3
    d += `C${f(x0 + h)} ${f(y0 + t[k]! * h)} ${f(x1 - h)} ${f(y1 - t[k + 1]! * h)} ${f(x1)} ${f(y1)}`
  }
  return d
}

/** 把含断点（y 为 NaN）的点切成连续的段。 */
export function pointRuns(points: readonly LinePoint[]): LinePoint[][] {
  const runs: LinePoint[][] = []
  let current: LinePoint[] = []
  for (const p of points) {
    if (Number.isFinite(p[1]) && Number.isFinite(p[0])) current.push(p)
    else if (current.length) {
      runs.push(current)
      current = []
    }
  }
  if (current.length) runs.push(current)
  return runs
}

/** 整条线的路径：每段一个 M，断点处断开；没有够两点的段返回空串。 */
export function linePath(points: readonly LinePoint[], curve: SparkCurve = 'linear'): string {
  return pointRuns(points)
    .map((run) => runPath(run, curve))
    .join('')
}

/** 线下面积的路径：每段先走线、再落到 floorY、回到段首封口；断点处各自封口。 */
export function areaPath(points: readonly LinePoint[], floorY: number, curve: SparkCurve = 'linear'): string {
  return pointRuns(points)
    .filter((run) => run.length > 1)
    .map((run) => {
      const first = run[0]!
      const last = run[run.length - 1]!
      return `${runPath(run, curve)}L${f(last[0])} ${f(floorY)}L${f(first[0])} ${f(floorY)}Z`
    })
    .join('')
}

// ———— 基准 ————

/** 一个值相对基准的位置。 */
export function sparkSide(value: number, baseline: number): SparkSide {
  return value > baseline ? 'up' : value < baseline ? 'down' : 'flat'
}

/** 涨跌色：给了 tone 就用；没给时有基准按「最后值 vs 基准」，没基准按头尾比（保持原有 sparkTone 的行为）。 */
export function resolveSparkTone(
  values: readonly SparkValue[],
  tone: QuoteTone | undefined,
  baseline: number | undefined,
): QuoteTone {
  if (tone) return tone
  const finite = values.filter(isSparkValue)
  if (!finite.length) return 'flat'
  const last = finite[finite.length - 1]!
  if (baseline !== undefined && isSparkValue(baseline)) return quoteTone(last - baseline)
  return finite.length > 1 ? quoteTone(last - finite[0]!) : 'flat'
}

export type SparkClip = { x: number; y: number; width: number; height: number }

/**
 * 按基准的 y 把整幅图切成上下两块（baseline 样式：上面涨色、下面跌色）：两块首尾相接，不留缝也不重叠；上下各多放出 margin 免得切掉线宽与圆点。
 * 基准在图外时一块是空的（高度 0）。
 */
export function baselineClips(
  baselineY: number,
  width: number,
  height: number,
  margin = 2,
): { above: SparkClip; below: SparkClip } {
  const by = Math.min(Math.max(baselineY, -margin), height + margin)
  return {
    above: { x: -margin, y: -margin, width: width + margin * 2, height: by + margin },
    below: { x: -margin, y: by, width: width + margin * 2, height: height + margin - by },
  }
}

// ———— 最高最低 ————

/** 最高与最低的下标（并列取最先出现的）；值全相等或有效点不够返回 null。 */
export function sparkExtremes(values: readonly SparkValue[]): { max: number; min: number } | null {
  let max = -1
  let min = -1
  values.forEach((value, i) => {
    if (!isSparkValue(value)) return
    if (max < 0 || value > (values[max] as number)) max = i
    if (min < 0 || value < (values[min] as number)) min = i
  })
  if (max < 0 || min < 0 || values[max] === values[min]) return null
  return { max, min }
}

/**
 * 点旁的字放左还是放右：优先放右；右边放不下（越过 boxWidth）改放左；左边也放不下就取空间大的一边并夹在框内。
 * 返回字的起点 x 与 SVG 的 text-anchor：放右是 start、放左是 end。
 */
export function labelPlacement(
  x: number,
  textWidth: number,
  boxWidth: number,
  gap = 4,
): { side: 'right' | 'left'; x: number; anchor: 'start' | 'end' } {
  const rightRoom = boxWidth - (x + gap)
  const leftRoom = x - gap
  if (textWidth <= rightRoom) return { side: 'right', x: x + gap, anchor: 'start' }
  if (textWidth <= leftRoom) return { side: 'left', x: x - gap, anchor: 'end' }
  // 两边都放不下：取空间大的一边，把字夹在框内。
  if (leftRoom > rightRoom)
    return { side: 'left', x: Math.min(boxWidth, Math.max(x - gap, Math.min(textWidth, boxWidth))), anchor: 'end' }
  return { side: 'right', x: Math.max(0, Math.min(x + gap, boxWidth - textWidth)), anchor: 'start' }
}

// ———— 悬停与键盘 ————

/** 离横坐标 x 最近的有效点的下标（吸附）；没有有效点返回 -1。 */
export function nearestIndex(values: readonly SparkValue[], x: number, layout: SparkLayout): number {
  let best = -1
  let gap = Infinity
  values.forEach((value, i) => {
    if (!isSparkValue(value)) return
    const d = Math.abs(xAt(layout, i) - x)
    if (d < gap) {
      gap = d
      best = i
    }
  })
  return best
}

/** 键盘走点：从 from 起往 dir 方向找下一个有效点；越界停在原处；from 为 null 时从两端起。 */
export function stepIndex(
  values: readonly SparkValue[],
  from: number | null,
  move: 'prev' | 'next' | 'first' | 'last',
): number {
  if (move === 'first') return firstValid(values)
  if (move === 'last') return lastValid(values)
  if (from === null) return move === 'next' ? firstValid(values) : lastValid(values)
  const dir = move === 'next' ? 1 : -1
  for (let i = from + dir; i >= 0 && i < values.length; i += dir) if (isSparkValue(values[i])) return i
  return from
}

/** 读数小框的位置：在光标的右边，放不下翻到左边，再夹进框内；纵向放在点的另一半，不盖住点。 */
export function readoutPlacement(
  cursorX: number,
  pointY: number,
  tipWidth: number,
  tipHeight: number,
  box: { width: number; height: number },
  gap = 6,
): { x: number; y: number } {
  const right = cursorX + gap
  const x = right + tipWidth <= box.width ? right : cursorX - gap - tipWidth
  return {
    x: Math.max(0, Math.min(x, box.width - tipWidth)),
    y: pointY < box.height / 2 ? Math.max(0, box.height - tipHeight) : 0,
  }
}

// ———— 柱、胜负格、成交量 ————

export type SparkRect = { i: number; x: number; y: number; width: number; height: number; side: SparkSide }

/** 每格的柱宽：格宽的 60%，至少一个设备像素，最多 6px。 */
const slotWidth = (layout: SparkLayout, dpr: number) =>
  Math.min(6, Math.max(1 / dpr, ((layout.right - layout.left) / Math.max(1, layout.count)) * 0.6))

/** bars 样式：每个值一根柱，从基准画到值；基准之上涨色、之下跌色，正好在基准上画 1px 平线。 */
export function barRects(values: readonly SparkValue[], layout: SparkLayout, base: number, dpr = 1): SparkRect[] {
  const baseY = yAt(layout, base)
  const out: SparkRect[] = []
  const w = slotWidth(layout, dpr)
  values.forEach((value, i) => {
    if (!isSparkValue(value)) return
    const y = yAt(layout, value)
    const top = Math.min(y, baseY)
    const [sx, sw] = snapSpan(xAt(layout, i) - w / 2, w, dpr)
    const [sy, sh] = snapSpan(top, Math.max(Math.abs(y - baseY), 1), dpr)
    out.push({ i, x: sx, y: sy, width: sw, height: sh, side: sparkSide(value, base) })
  })
  return out
}

/**
 * winloss 样式（Tufte 胜负格）：每个值只表示正负，等高小方块；正的在中线之上、负的在之下、等于基准的是中线上一条 1px 平线。
 * 格高取中线到上下边各一半再留 1px 缝。
 */
export function winLossCells(values: readonly SparkValue[], layout: SparkLayout, base = 0, dpr = 1): SparkRect[] {
  const mid = (layout.top + layout.bottom) / 2
  const cell = Math.max(2, Math.floor((layout.bottom - layout.top) / 2 - 0.5))
  const w = slotWidth(layout, dpr)
  const out: SparkRect[] = []
  values.forEach((value, i) => {
    if (!isSparkValue(value)) return
    const side = sparkSide(value, base)
    const [sx, sw] = snapSpan(xAt(layout, i) - w / 2, w, dpr)
    const [sy, sh] =
      side === 'up'
        ? snapSpan(mid - 0.5 - cell, cell, dpr)
        : side === 'down'
          ? snapSpan(mid + 0.5, cell, dpr)
          : snapSpan(mid - 0.5, 1, dpr)
    out.push({ i, x: sx, y: sy, width: sw, height: sh, side })
  })
  return out
}

/**
 * 成交量柱：占底部 volumeHeight 高度，按最大值定比例；某个值缺失或不是正数的不画。
 * side 是这一根对应的价格涨跌（跟前一个有效价格比），volumeTone 为 updown 时拿来着色。
 */
export function volumeRects(
  volumes: readonly SparkValue[],
  prices: readonly SparkValue[],
  layout: SparkLayout,
  volumeHeight: number,
  dpr = 1,
): SparkRect[] {
  const finite = volumes.filter((v): v is number => isSparkValue(v) && v > 0)
  if (!finite.length || volumeHeight <= 0) return []
  const peak = Math.max(...finite)
  const w = Math.min(4, Math.max(1 / dpr, ((layout.right - layout.left) / Math.max(1, volumes.length)) * 0.6))
  const floor = layout.height
  let prev: number | null = null
  const out: SparkRect[] = []
  volumes.forEach((volume, i) => {
    const price = prices[i]
    const side: SparkSide = isSparkValue(price) && prev !== null ? sparkSide(price, prev) : 'flat'
    if (isSparkValue(price)) prev = price
    if (!isSparkValue(volume) || volume <= 0) return
    const h = Math.max(1, (volume / peak) * volumeHeight)
    const [sx, sw] = snapSpan(xAt(layout, i) - w / 2, w, dpr)
    const [sy, sh] = snapSpan(floor - h, h, dpr)
    out.push({ i, x: sx, y: sy, width: sw, height: sh, side })
  })
  return out
}
