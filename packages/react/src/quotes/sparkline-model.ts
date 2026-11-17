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
  /** 给了就按它定每个值的横坐标（按时间排：值不等距，被裁掉的是 NaN）；不给按序号等分。 */
  xs?: readonly number[]
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
  if (layout.xs) return layout.xs[i] ?? Number.NaN
  const span = layout.right - layout.left
  if (layout.slots) return layout.left + ((i + 0.5) / Math.max(1, layout.count)) * span
  return layout.left + (layout.count > 1 ? (i / (layout.count - 1)) * span : span / 2)
}

/** 一个值的纵坐标：最高在顶、最低在底。 */
export function yAt(layout: SparkLayout, value: number): number {
  return layout.bottom - ((value - layout.lo) / (layout.hi - layout.lo)) * (layout.bottom - layout.top)
}

/** 一列值的坐标：断点处 y 是 NaN；y 吸到设备像素（水平线才清晰）。 */
export function sparkLayoutPoints(
  values: readonly SparkValue[],
  layout: SparkLayout,
  dpr = 1,
  lineWidth = SPARK_LINE_W,
): LinePoint[] {
  return values.map((value, i) => {
    const x = xAt(layout, i)
    return isSparkValue(value) && Number.isFinite(x)
      ? ([x, snapLine(yAt(layout, value), lineWidth, dpr)] as const)
      : ([x, Number.NaN] as const)
  })
}

/** 线宽（CSS 像素）：图高 80 以上用 2px，更矮的用 1.5px（大图线太细、小图线太粗都不好看）。 */
export const sparkLineWidth = (height: number): number => (height >= 80 ? 2 : SPARK_LINE_W)

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

/**
 * 把含断点（y 为 NaN）的点切成连续的段。
 * groups：每个点所在的交易时段号；相邻两个有效点时段号不同也要断开（午休两边的线不连）。
 */
export function pointRuns(points: readonly LinePoint[], groups?: readonly number[]): LinePoint[][] {
  const runs: LinePoint[][] = []
  let current: LinePoint[] = []
  let group: number | undefined
  points.forEach((p, i) => {
    if (!(Number.isFinite(p[1]) && Number.isFinite(p[0]))) {
      if (current.length) runs.push(current)
      current = []
      return
    }
    const g = groups?.[i]
    if (current.length && groups && g !== group) {
      runs.push(current)
      current = []
    }
    group = g
    current.push(p)
  })
  if (current.length) runs.push(current)
  return runs
}

/** 整条线的路径：每段一个 M，断点处断开；没有够两点的段返回空串。groups 见 pointRuns。 */
export function linePath(
  points: readonly LinePoint[],
  curve: SparkCurve = 'linear',
  groups?: readonly number[],
): string {
  return pointRuns(points, groups)
    .map((run) => runPath(run, curve))
    .join('')
}

/** 线下面积的路径：每段先走线、再落到 floorY、回到段首封口；断点处各自封口。groups 见 pointRuns。 */
export function areaPath(
  points: readonly LinePoint[],
  floorY: number,
  curve: SparkCurve = 'linear',
  groups?: readonly number[],
): string {
  return pointRuns(points, groups)
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

// ———— 读数框 ————

/**
 * 读数框（HTML 三行那种）的位置：先放光标右边，放不下翻到左边，再夹进框内；纵向以点为中心夹进框内，框比图还高时放到图的上方。
 * 返回左上角；above 为 true 表示放在图外上方。纯函数。
 */
export function tipPlacement(
  cursorX: number,
  pointY: number,
  tipWidth: number,
  tipHeight: number,
  box: { width: number; height: number },
  gap = 10,
): { x: number; y: number; side: 'right' | 'left'; above: boolean } {
  const fitsRight = cursorX + gap + tipWidth <= box.width
  const side = fitsRight ? 'right' : 'left'
  const x = fitsRight ? cursorX + gap : cursorX - gap - tipWidth
  const above = tipHeight > box.height
  const y = above ? -tipHeight - 6 : Math.max(0, Math.min(pointY - tipHeight / 2, box.height - tipHeight))
  return { x: Math.max(0, Math.min(x, box.width - tipWidth)), y, side, above }
}

// ———— 时间轴 ————

/** 一段交易时段 [开始, 结束]（毫秒时间戳）。 */
export type SparkSpan = readonly [start: number, end: number]
export type SparkTimeAxis = {
  /** 横轴覆盖的整个时段（毫秒）。 */
  domain: readonly [start: number, end: number]
  /** 交易时段；时段之间的休市在横轴上压缩掉。不给整个 domain 是一段。 */
  sessions?: readonly SparkSpan[]
}
/** 两个交易时段之间在横轴上留的像素（压缩掉休市后留一道细缝，让人看得出这里断过）。 */
export const SPARK_SESSION_GAP = 4

/** 规整交易时段：夹进 domain、去掉空段、按开始排序、合并重叠；没有可用的段退回整个 domain。domain 不合法返回空数组。 */
export function timeSpans(axis: SparkTimeAxis): SparkSpan[] {
  const [d0, d1] = axis.domain
  if (!(Number.isFinite(d0) && Number.isFinite(d1) && d1 > d0)) return []
  const clipped = (axis.sessions ?? [[d0, d1] as const])
    .map(([a, b]) => [Math.max(a, d0), Math.min(b, d1)] as const)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((x, y) => x[0] - y[0])
  const merged: [number, number][] = []
  for (const [a, b] of clipped) {
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  return merged.length ? merged : [[d0, d1]]
}

/** 每个时间落在第几个交易时段；domain 之外、落在休市里、不是有限数的是 -1（要裁掉）。纯函数。 */
export function timeGroups(times: readonly number[], spans: readonly SparkSpan[]): number[] {
  return times.map((t) => (Number.isFinite(t) ? spans.findIndex(([a, b]) => t >= a && t <= b) : -1))
}

/** 时间 → 横坐标：[left, right] 里各时段按时长占宽，时段之间留 gap 像素；不在任何时段里返回 NaN。纯函数。 */
export function timeX(
  t: number,
  spans: readonly SparkSpan[],
  left: number,
  right: number,
  gap = SPARK_SESSION_GAP,
): number {
  const total = spans.reduce((sum, [a, b]) => sum + (b - a), 0)
  if (!(total > 0) || !Number.isFinite(t)) return Number.NaN
  const usable = Math.max(1, right - left - gap * (spans.length - 1))
  let before = 0
  for (let i = 0; i < spans.length; i++) {
    const [a, b] = spans[i]!
    if (t >= a && t <= b) return left + ((before + (t - a)) / total) * usable + gap * i
    before += b - a
  }
  return Number.NaN
}

/** 一列时间的横坐标（被裁掉的是 NaN）。 */
export function timeXs(
  times: readonly number[],
  spans: readonly SparkSpan[],
  left: number,
  right: number,
  gap = SPARK_SESSION_GAP,
): number[] {
  return times.map((t) => timeX(t, spans, left, right, gap))
}

/**
 * 时间刻度：每 minutes 分钟一个（按整分钟对齐到时间戳的整倍数，所以 30 分钟的刻度落在整点与半点），只取落在交易时段里的，时段两头也算。
 * 对齐按 UTC 时间戳，半小时时区（印度）也是整点半点；只有 45 分钟时区（尼泊尔）会错开一刻钟。
 */
export function timeTicks(spans: readonly SparkSpan[], minutes: number): number[] {
  const step = Math.max(1, minutes) * 60_000
  const out: number[] = []
  for (const [a, b] of spans) {
    for (let t = Math.ceil(a / step) * step; t <= b; t += step) if (!out.includes(t)) out.push(t)
  }
  return out
}

const NICE_MINUTES = [5, 10, 15, 30, 60, 120, 240, 360, 720, 1440, 10080] as const
/** 刻度间隔自动取：从小到大找第一个刻度数不超过 maxTicks 的间隔（分钟）。 */
export function autoTickMinutes(spans: readonly SparkSpan[], maxTicks: number): number {
  for (const m of NICE_MINUTES) if (timeTicks(spans, m).length <= Math.max(1, maxTicks)) return m
  return NICE_MINUTES[NICE_MINUTES.length - 1]
}

/**
 * 标签挨着放：从左到右留下不与前一个重叠的（间隔 gap），也不超出 [0, boxWidth]；每项是中心 x 与文字宽，返回留下的下标。纯函数。
 */
export function thinLabels(items: readonly { x: number; width: number }[], boxWidth: number, gap = 8): number[] {
  const kept: number[] = []
  let edge = -Infinity
  items.forEach(({ x, width }, i) => {
    if (!Number.isFinite(x)) return
    const start = Math.max(0, Math.min(x - width / 2, boxWidth - width))
    if (start < edge + gap) return
    kept.push(i)
    edge = start + width
  })
  return kept
}

// ———— 价格刻度 ————

/** 价格刻度：lo 到 hi 均分 count 档（含两端），从高到低排。count 小于 2 取 2。纯函数。 */
export function priceTicks(lo: number, hi: number, count = 4): number[] {
  const n = Math.max(2, Math.floor(count))
  return Array.from({ length: n }, (_, k) => hi - ((hi - lo) * k) / (n - 1))
}

// ———— 画风：仪器档案（instrument）与终端字形（ascii）的纯函数 ————

/** 一列有效值的标准差（总体）；少于两个返回 0。 */
function stdev(nums: readonly number[]): number {
  if (nums.length < 2) return 0
  const mean = nums.reduce((s, v) => s + v, 0) / nums.length
  return Math.sqrt(nums.reduce((s, v) => s + (v - mean) ** 2, 0) / nums.length)
}

/** 升序数组里按线性插值取分位数（q 在 0 到 1）。 */
function quantile(sorted: readonly number[], q: number): number {
  if (!sorted.length) return 0
  const at = q * (sorted.length - 1)
  const i = Math.floor(at)
  return sorted[i]! + (sorted[Math.min(sorted.length - 1, i + 1)]! - sorted[i]!) * (at - i)
}

/**
 * 核密度的带宽，Silverman 经验法则：0.9 × min(标准差, 四分位距 / 1.34) × n^(-1/5)。
 * 少于两个值、或这列几乎是常数（带宽为 0）时按 fallback（默认 1）给一个正数，免得除零。纯函数。
 */
export function silvermanBandwidth(values: readonly number[], fallback = 1): number {
  const nums = values.filter(Number.isFinite)
  if (nums.length < 2) return fallback
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  const sorted = nums.toSorted((a, b) => a - b)
  const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25)
  const sd = stdev(nums)
  const spread = iqr > 0 ? Math.min(sd, iqr / 1.34) : sd
  const h = 0.9 * spread * nums.length ** -0.2
  return h > 0 ? h : fallback
}

/** 直方图分箱：[lo, hi] 等分成 bins 个箱（第 0 箱是最低的），返回每箱的个数；hi 这个值落进最后一箱，区间外的丢掉。纯函数。 */
export function sparkHistogramBins(values: readonly SparkValue[], lo: number, hi: number, bins: number): number[] {
  const n = Math.max(1, Math.floor(bins))
  const out = new Array<number>(n).fill(0)
  const span = hi - lo
  if (!(span > 0)) return out
  for (const v of values) {
    if (!isSparkValue(v) || v < lo || v > hi) continue
    out[Math.min(n - 1, Math.floor(((v - lo) / span) * n))]! += 1
  }
  return out
}

/** 高斯核密度：在 [lo, hi] 里等距取 samples 个点（含两端，第 0 个在 lo），返回每点的密度（没归一化）。bandwidth 不给用 Silverman。纯函数。 */
export function kernelDensity(
  values: readonly SparkValue[],
  lo: number,
  hi: number,
  samples: number,
  bandwidth?: number,
): number[] {
  const nums = sparkNumbers(values)
  const n = Math.max(2, Math.floor(samples))
  const h = bandwidth && bandwidth > 0 ? bandwidth : silvermanBandwidth(nums, (hi - lo) / 20 || 1)
  const norm = 1 / (nums.length * h * Math.sqrt(2 * Math.PI))
  return Array.from({ length: n }, (_, k) => {
    const y = lo + ((hi - lo) * k) / (n - 1)
    let sum = 0
    for (const v of nums) sum += Math.exp(-0.5 * ((y - v) / h) ** 2)
    return sum * norm
  })
}

export type SparkProjectionMode = 'kde' | 'histogram'

/** 投影谱：把一列值在 [lo, hi] 上的分布排成 rows 档（第 0 档在 lo、即图的底部），按最大值归一到 0 到 1。mode 取核密度（默认）或直方图。纯函数。 */
export function projectionProfile(
  values: readonly SparkValue[],
  lo: number,
  hi: number,
  rows: number,
  mode: SparkProjectionMode = 'kde',
): number[] {
  const n = Math.max(2, Math.floor(rows))
  if (!sparkCount(values)) return new Array<number>(n).fill(0)
  const raw = mode === 'histogram' ? sparkHistogramBins(values, lo, hi, n) : kernelDensity(values, lo, hi, n)
  const peak = Math.max(...raw)
  return peak > 0 ? raw.map((v) => v / peak) : raw.map(() => 0)
}

/** 对位点阵（+ 号）的间距：图越大越疏，取 8 / 12 / 16 三档，按较短的一边定。纯函数。 */
export function graticuleStep(width: number, height: number): number {
  const short = Math.min(width, height)
  return short < 60 ? 8 : short < 140 ? 12 : 16
}

/** 极值批注的引线：从点（px, py）斜着引到标签；最高往上、最低往下，放不下就换一侧，字一直在框里。纯函数。 */
export function calloutPlacement(
  px: number,
  py: number,
  textWidth: number,
  box: { width: number; height: number },
  up: boolean,
  lead = 8,
  textHeight = 10,
): { x2: number; y2: number; tx: number; ty: number; anchor: 'start' | 'end' } {
  const right = px + lead + textWidth + 2 <= box.width
  const dy = up ? -lead : lead
  const y2 = Math.max(textHeight / 2, Math.min(py + dy, box.height - textHeight / 2))
  const x2 = right ? px + lead : px - lead
  return { x2, y2, tx: right ? x2 + 2 : x2 - 2, ty: y2, anchor: right ? 'start' : 'end' }
}

/** 带种子的小随机数（mulberry32）：同一个种子永远同一串，手绘圈每次渲染都一样。 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 手绘感的圈（SVG path 的 d）：绕圆心一圈多一点，半径与起点带轻微抖动，用二次曲线连成一笔。
 * 抖动由 seed 定（用下标播种），同一个种子永远同一个圈，不会每次渲染都变。纯函数。
 */
export function sketchCircle(cx: number, cy: number, r: number, seed: number, points = 10): string {
  const rand = seededRandom(seed * 7919 + 13)
  const start = rand() * Math.PI * 2
  const turn = Math.PI * 2 * 1.08
  const pts = Array.from({ length: points + 1 }, (_, k) => {
    const a = start + (turn * k) / points
    const rr = r * (1 + (rand() - 0.5) * 0.14 + (k / points) * 0.06)
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92] as const
  })
  const f = (v: number) => v.toFixed(2)
  let d = `M${f(pts[0]![0])},${f(pts[0]![1])}`
  for (let k = 1; k < pts.length; k++) {
    const mid = [(pts[k - 1]![0] + pts[k]![0]) / 2, (pts[k - 1]![1] + pts[k]![1]) / 2] as const
    d += ` Q${f(pts[k - 1]![0])},${f(pts[k - 1]![1])} ${f(mid[0])},${f(mid[1])}`
  }
  return `${d} L${f(pts[pts.length - 1]![0])},${f(pts[pts.length - 1]![1])}`
}

export const BLOCK_GLYPHS = '▁▂▃▄▅▆▇█'

/**
 * 块字符 sparkline：每列一个值，rows 行（每行 8 级，上满下填，最上一行在 rows[0]）。值落在 [lo, hi]，null 与非有限数那一列画空格。
 * 一行时就是经典的 ▁▂▃▄▅▆▇█（Zach Holman 的 spark）。纯函数。
 */
export function blockRows(columns: readonly SparkValue[], rows: number, lo: number, hi: number): string[] {
  const n = Math.max(1, Math.floor(rows))
  const levels = n * 8
  const span = hi - lo || 1
  const heights = columns.map((v) =>
    isSparkValue(v) ? Math.min(levels, Math.max(1, Math.round(((v - lo) / span) * (levels - 1)) + 1)) : 0,
  )
  return Array.from({ length: n }, (_, k) => {
    const row = n - 1 - k // 0 是最下面一行
    return heights
      .map((h) => {
        const fill = Math.min(8, Math.max(0, h - row * 8))
        return fill === 0 ? ' ' : BLOCK_GLYPHS[fill - 1]!
      })
      .join('')
  })
}

/** 盲文点的位掩码：[列 0..1][行 0..3]，Unicode 盲文 U+2800 起的 8 点编码（左列 1 2 3 7，右列 4 5 6 8）。 */
const BRAILLE_BIT = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
] as const

/** 盲文点阵折线：每个字符 2 × 4 点，所以 cols 个字符宽 2·cols 个点、rows 行高 4·rows 个点；相邻两列的有效点用线连起来，断点处不连。纯函数（drawille 的做法）。 */
export function brailleRows(
  dotValues: readonly SparkValue[],
  cols: number,
  rows: number,
  lo: number,
  hi: number,
): string[] {
  const w = cols * 2
  const h = rows * 4
  const span = hi - lo || 1
  const grid = new Uint8Array(cols * rows)
  const plot = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    grid[Math.floor(y / 4) * cols + Math.floor(x / 2)]! |= BRAILLE_BIT[x % 2]![y % 4]!
  }
  const ys = dotValues.slice(0, w).map((v) => (isSparkValue(v) ? Math.round((1 - (v - lo) / span) * (h - 1)) : null))
  ys.forEach((y, x) => {
    if (y === null) return
    plot(x, y)
    const before = x > 0 ? ys[x - 1] : null
    if (before === null || before === undefined) return
    // 与前一列之间的竖向连线：两列的 y 之间补满，折线才连得上。
    const mid = Math.round((before + y) / 2)
    for (let yy = Math.min(before, mid); yy <= Math.max(before, mid); yy++) plot(x - 1, yy)
    for (let yy = Math.min(y, mid); yy <= Math.max(y, mid); yy++) plot(x, yy)
  })
  return Array.from({ length: rows }, (_, r) => {
    let line = ''
    for (let c = 0; c < cols; c++) {
      const mask = grid[r * cols + c]!
      // 空格子也用盲文的空白（U+2800）：同一个回退字体里宽度才跟有点的字符一样，列才对得齐。
      line += String.fromCharCode(0x2800 + mask)
    }
    return line
  })
}

/** 把一列值排进 cols 个字符列（按序号，不带时间）：值多于列数取每列的均值，少于列数线性插值（两端都有效才插，否则按最近的）；整列无有效值的是 null。纯函数。 */
export function columnValues(values: readonly SparkValue[], cols: number): SparkValue[] {
  const n = values.length
  const out: SparkValue[] = new Array<SparkValue>(cols).fill(null)
  if (!n || cols < 1) return out
  if (n >= cols) {
    for (let c = 0; c < cols; c++) {
      const from = Math.floor((c * n) / cols)
      const to = Math.max(from + 1, Math.floor(((c + 1) * n) / cols))
      const bucket = sparkNumbers(values.slice(from, to))
      out[c] = bucket.length ? bucket.reduce((s, v) => s + v, 0) / bucket.length : null
    }
    return out
  }
  for (let c = 0; c < cols; c++) {
    const at = cols === 1 ? 0 : (c / (cols - 1)) * (n - 1)
    const a = values[Math.floor(at)]
    const b = values[Math.ceil(at)]
    out[c] = isSparkValue(a) && isSparkValue(b) ? a + (b - a) * (at - Math.floor(at)) : null
  }
  return out
}

/**
 * 时段横轴按字符列排：休市压成一列（gaps 里的列画 ┊），其余列按各时段时长分；每个时间落在哪一列（时段之外是 -1）。纯函数。
 * scale 是每个字符横向有几格（盲文是 2 个点列），colOf 按格数给；gaps 始终是字符列号。
 * 列数不够放（少于时段数加缝）时不压缩，返回 null，调用方退回按序号排。
 */
export function sessionColumns(
  times: readonly number[],
  spans: readonly SparkSpan[],
  cols: number,
  scale = 1,
): { colOf: number[]; gaps: number[] } | null {
  const gapCount = spans.length - 1
  const usable = cols - gapCount
  if (!spans.length || usable < spans.length) return null
  const total = spans.reduce((s, [a, b]) => s + (b - a), 0)
  const widths = spans.map(([a, b]) => Math.max(1, Math.round(((b - a) / total) * usable)))
  // 四舍五入后总宽可能不等于 usable：差的补到最宽的段。
  const widest = widths.indexOf(Math.max(...widths))
  widths[widest]! += usable - widths.reduce((s, v) => s + v, 0)
  const starts: number[] = []
  const gaps: number[] = []
  let col = 0
  widths.forEach((w, i) => {
    starts.push(col)
    col += w
    if (i < spans.length - 1) gaps.push(col++)
  })
  const colOf = times.map((t) => {
    const i = spans.findIndex(([a, b]) => t >= a && t <= b)
    if (i < 0) return -1
    const [a, b] = spans[i]!
    const cells = widths[i]! * scale
    return starts[i]! * scale + Math.min(cells - 1, Math.floor(((t - a) / (b - a)) * cells))
  })
  return { colOf, gaps }
}

/** 已知每个值落在哪一列（-1 是裁掉的），算每列的值：同列取均值；两个有值的列之间的空列线性补上（中间没有断点、也没有 blocked 的休市列才补）。纯函数。 */
export function columnValuesAt(
  values: readonly SparkValue[],
  colOf: readonly number[],
  cols: number,
  blocked: readonly number[] = [],
): SparkValue[] {
  const sum = new Array<number>(cols).fill(0)
  const cnt = new Array<number>(cols).fill(0)
  const nulled = new Array<boolean>(cols).fill(false)
  for (const c of blocked) nulled[c] = true
  values.forEach((v, i) => {
    const c = colOf[i] ?? -1
    if (c < 0 || c >= cols) return
    if (isSparkValue(v)) {
      sum[c]! += v
      cnt[c]! += 1
    } else nulled[c] = true
  })
  const out: SparkValue[] = sum.map((s, c) => (cnt[c] ? s / cnt[c]! : null))
  // 补空列：只在前后两列都有值、且中间没有被断点占着的列时补。
  let prev = -1
  for (let c = 0; c < cols; c++) {
    if (out[c] === null) continue
    if (prev >= 0 && c - prev > 1) {
      const inner = Array.from({ length: c - prev - 1 }, (_, k) => prev + 1 + k)
      if (!inner.some((x) => nulled[x])) {
        for (const x of inner)
          out[x] = (out[prev] as number) + ((out[c] as number) - (out[prev] as number)) * ((x - prev) / (c - prev))
      }
    }
    prev = c
  }
  return out
}
