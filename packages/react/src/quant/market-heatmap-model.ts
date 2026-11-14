// SPDX-License-Identifier: MIT
// 市场热力图的纯函数（#15）：色阶的区段、图例的值边界、格子的键盘邻居。排布与着色档用包里矩形树图的 layoutTreemap、colorStep，不另写。
// 区段的做法照 TradingView 帮助中心「Range calculation and color logic of the Heatmaps」（2026-11-15 读）：载入或改参数时取所选指标的最小最大值，
// 切成若干区段各一色，格子取所在区段的颜色；那页没写固定区间、段数与中性色，所以下面的段数与取整是我们自己定的（见 HEAT_STEPS 的注释）。
import { colorStep } from '../katana/treemap-model.ts'

/**
 * 区段数：7 段，档号 −3…+3，档 0 是以零为中心的中性段。
 * 待定（#15 实现决定 2）：没实测，开测量票；7 是照包里矩形树图现成的色例（TradingView 热图底部也是 7 个色块），不是推出来的。
 */
export const HEAT_STEPS = [-3, -2, -1, 0, 1, 2, 3] as const

export type HeatStep = (typeof HEAT_STEPS)[number]

/** 取整用的「好数」尾数：1、1.5、2、2.5、3、4、5、6、8、10 乘 10 的幂。 */
const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

/**
 * 一档有多宽（指标的单位）：取这批值的最大绝对值除以 3（最外一档的中心落在最大值上），再向上取到好数。
 * 没有有限值就是 1。区段边界在 (k ± 0.5) × 档宽，所以档 0 是 ±档宽/2 的中性段。
 */
export function niceUnit(values: readonly (number | null | undefined)[]): number {
  let max = 0
  for (const value of values)
    if (typeof value === 'number' && Number.isFinite(value)) max = Math.max(max, Math.abs(value))
  if (max === 0) return 1
  const raw = max / 3
  const power = 10 ** Math.floor(Math.log10(raw))
  const mantissa = raw / power
  const pick = NICE.find((m) => m >= mantissa - 1e-9) ?? 10
  return Number((pick * power).toPrecision(6))
}

/** 值落在哪一档；不是有限数是 null（画成「没有数」的灰）。 */
export function stepOf(value: number | null | undefined, unit: number): HeatStep | null {
  const step = colorStep(value, unit * 3)
  return step === null ? null : ((step || 0) as HeatStep)
}

/** 一档的值边界：最外两档一头开口（from 或 to 是 null）。 */
export function stepRange(step: HeatStep, unit: number): { from: number | null; to: number | null } {
  const round = (n: number) => Number(n.toPrecision(8))
  return {
    from: step === -3 ? null : round((step - 0.5) * unit),
    to: step === 3 ? null : round((step + 0.5) * unit),
  }
}

/** 一档的中心值（图例上写的数）。 */
export const stepCenter = (step: HeatStep, unit: number): number => Number((step * unit).toPrecision(8))

export type MetricFormat = { unit?: string; digits?: number; format?: (value: number) => string }

/** 指标值写成字符串：默认带正负号、两位小数加单位（+10.00%）；没有数写「—」。 */
export function formatMetric(value: number | null | undefined, metric: MetricFormat, signed = true): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  if (metric.format) return metric.format(value)
  const text = value.toFixed(metric.digits ?? 2)
  return `${signed && value > 0 && Number(text) !== 0 ? '+' : ''}${text}${metric.unit ?? ''}`
}

/** 图例上的短写法：去掉多余的零（+2.5%、−3%），0 不带符号。 */
export function formatLegend(value: number, metric: MetricFormat): string {
  const text = String(Number(value.toFixed(4)))
  return `${value > 0 ? '+' : ''}${text}${metric.unit ?? ''}`
}

/** 一档的值边界写成文字：「-2.5% ~ -1.5%」，最外两档「< -2.5%」「≥ +2.5%」。 */
export function formatRange(step: HeatStep, unit: number, metric: MetricFormat): string {
  const { from, to } = stepRange(step, unit)
  if (from === null) return `< ${formatLegend(to!, metric)}`
  if (to === null) return `≥ ${formatLegend(from, metric)}`
  return `${formatLegend(from, metric)} ~ ${formatLegend(to, metric)}`
}

export type Box = { code: string; x0: number; y0: number; x1: number; y1: number }
export type Direction = 'left' | 'right' | 'up' | 'down'

/** 方向键走到哪一格：取那个方向上离得最近的格子，横向偏得多的罚分（主方向距离加 2 倍偏离）；那个方向没有格子返回 null。 */
export function neighbour(boxes: readonly Box[], from: string, direction: Direction): string | null {
  const here = boxes.find((box) => box.code === from)
  if (!here) return null
  const cx = (here.x0 + here.x1) / 2
  const cy = (here.y0 + here.y1) / 2
  let best: { code: string; score: number } | null = null
  for (const box of boxes) {
    if (box.code === from) continue
    const dx = (box.x0 + box.x1) / 2 - cx
    const dy = (box.y0 + box.y1) / 2 - cy
    const [along, across] =
      direction === 'right' ? [dx, dy] : direction === 'left' ? [-dx, dy] : direction === 'down' ? [dy, dx] : [-dy, dx]
    if (along <= 0) continue
    const score = along + 2 * Math.abs(across)
    if (!best || score < best.score) best = { code: box.code, score }
  }
  return best?.code ?? null
}
