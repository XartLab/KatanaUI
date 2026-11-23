// SPDX-License-Identifier: MIT
// CrossRates 的纯逻辑：把一串「基准 / 计价」报价摆成货币 × 货币的矩阵、汇率的默认写法、方向键在格子间怎么走。不碰 DOM。

export type CrossRateQuote = {
  /** Base currency code, the row (EUR in EUR/USD). */
  base: string
  /** Quote currency code, the column (USD in EUR/USD). */
  quote: string
  /** How many units of quote one unit of base buys. */
  rate: number
  /** Change of the rate as a percentage (0.2 means +0.2%). */
  changePct: number
}

export type CrossRateCell = {
  base: string
  quote: string
  /** 对角线（同一种货币）：不画数。 */
  diagonal: boolean
  /** 这一格的报价；没有就是 null（画「—」）。 */
  data: CrossRateQuote | null
}

/** 摆成矩阵：行是基准、列是计价，次序照 currencies；同一对给了几次取最后一次。 */
export function crossRateMatrix(currencies: readonly string[], quotes: readonly CrossRateQuote[]): CrossRateCell[][] {
  const byPair = new Map<string, CrossRateQuote>()
  for (const entry of quotes) byPair.set(`${entry.base}/${entry.quote}`, entry)
  return currencies.map((base) =>
    currencies.map((quote) => ({
      base,
      quote,
      diagonal: base === quote,
      data: base === quote ? null : (byPair.get(`${base}/${quote}`) ?? null),
    })),
  )
}

/** 汇率的默认写法：不小于 100 写两位小数（USD/JPY 155.20），否则四位（EUR/USD 1.0832）。外汇报价的常见位数；要别的位数由调用方给 formatRate。 */
export function plainRate(rate: number): string {
  if (!Number.isFinite(rate)) return '—'
  return rate.toFixed(Math.abs(rate) >= 100 ? 2 : 4)
}

export type GridPos = { row: number; col: number }

/**
 * 方向键在 size × size 的格子里走一步：←→↑↓ 一格（到边停住），Home / End 到本行头尾，Ctrl+Home / Ctrl+End 到整张的头尾（照 APG 的 grid 模式）。
 * 不归它管的键返回 null。纯函数。
 */
export function moveCell(pos: GridPos, size: number, key: string, ctrl = false): GridPos | null {
  if (size <= 0) return null
  const last = size - 1
  const clamp = (n: number) => Math.min(last, Math.max(0, n))
  switch (key) {
    case 'ArrowLeft':
      return { row: pos.row, col: clamp(pos.col - 1) }
    case 'ArrowRight':
      return { row: pos.row, col: clamp(pos.col + 1) }
    case 'ArrowUp':
      return { row: clamp(pos.row - 1), col: pos.col }
    case 'ArrowDown':
      return { row: clamp(pos.row + 1), col: pos.col }
    case 'Home':
      return ctrl ? { row: 0, col: 0 } : { row: pos.row, col: 0 }
    case 'End':
      return ctrl ? { row: last, col: last } : { row: pos.row, col: last }
    default:
      return null
  }
}
