// SPDX-License-Identifier: MIT
// 选股结果卡片网格（MiniKCardGrid，#110）的纯函数：小 K 线的几何、方向、涨跌幅。价格都是数，取不到的蜡烛丢掉不画。

export type Candle = {
  /** Opening price. */
  open: number
  /** Highest price. */
  high: number
  /** Lowest price. */
  low: number
  /** Closing price. */
  close: number
  /** Date or time of the candle, for readers only. */
  time?: string
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** 丢掉有取不到的数、或最高价低于最低价的蜡烛。 */
export function validCandles(candles: readonly Candle[] | null | undefined): Candle[] {
  return (candles ?? []).filter(
    (c) => finite(c.open) && finite(c.high) && finite(c.low) && finite(c.close) && c.high >= c.low,
  )
}

/** 一根蜡烛的方向：收盘高于开盘涨、低于跌、相等 flat。 */
export const candleTone = (candle: Pick<Candle, 'open' | 'close'>): 'up' | 'down' | 'flat' =>
  candle.close > candle.open ? 'up' : candle.close < candle.open ? 'down' : 'flat'

/** 价格区间：全部蜡烛的最低到最高，上下各留 6%；一根不画返回 null；全平时给一个很窄的区间。 */
export function candleDomain(candles: readonly Candle[]): [number, number] | null {
  if (candles.length === 0) return null
  const lo = Math.min(...candles.map((c) => c.low))
  const hi = Math.max(...candles.map((c) => c.high))
  const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.01 || 0.5
  return [lo - pad, hi + pad]
}

export type CandleShape = {
  tone: 'up' | 'down' | 'flat'
  /** 影线的横坐标与上下端（y 向下）。 */
  wickX: number
  wickTop: number
  wickBottom: number
  /** 实体的左边、宽、上边、高（高至少 1，平盘也看得见）。 */
  bodyX: number
  bodyWidth: number
  bodyTop: number
  bodyHeight: number
}

/**
 * 蜡烛排进 width × height 的框：等宽等距，实体宽占一格的 (1 − gap)，价格落到纵轴。
 * 蜡烛太多时每格不到 1 个单位也照排（实体最窄 0.5）。
 */
export function candleShapes(
  candles: readonly Candle[],
  width: number,
  height: number,
  gap = 0.3,
): { domain: [number, number]; shapes: CandleShape[] } | null {
  const domain = candleDomain(candles)
  if (domain === null) return null
  const slot = width / candles.length
  const bodyWidth = Math.max(0.5, slot * (1 - gap))
  const span = domain[1] - domain[0] || 1
  const y = (price: number) => height - ((price - domain[0]) / span) * height
  const shapes = candles.map((candle, index) => {
    const center = slot * (index + 0.5)
    const top = y(Math.max(candle.open, candle.close))
    const bottom = y(Math.min(candle.open, candle.close))
    const bodyHeight = Math.max(1, bottom - top)
    return {
      tone: candleTone(candle),
      wickX: center,
      wickTop: y(candle.high),
      wickBottom: y(candle.low),
      bodyX: center - bodyWidth / 2,
      bodyWidth,
      bodyTop: Math.min(top, height - bodyHeight),
      bodyHeight,
    }
  })
  return { domain, shapes }
}

/** 最后一根相对前一根收盘的涨跌幅（百分数）；不够两根或前收为 0 返回 null。 */
export function lastChange(candles: readonly Candle[]): number | null {
  if (candles.length < 2) return null
  const prev = candles[candles.length - 2]!.close
  const last = candles[candles.length - 1]!.close
  return prev === 0 ? null : ((last - prev) / prev) * 100
}

/** 一行放几只：只认 2、3、4，别的取最近的合法值。 */
export function gridColumns(columns: number | undefined): 2 | 3 | 4 {
  if (columns === undefined || !Number.isFinite(columns)) return 3
  return Math.min(4, Math.max(2, Math.round(columns))) as 2 | 3 | 4
}

/** 涨跌幅文字：+3.21% / -1.05% / 0.00%；取不到写「—」。 */
export function changeText(change: number | null | undefined): string {
  if (change === null || change === undefined || !Number.isFinite(change)) return '—'
  const fixed = change.toFixed(2)
  return change > 0 && Number(fixed) > 0 ? `+${fixed}%` : `${Number(fixed) === 0 ? '0.00' : fixed}%`
}
