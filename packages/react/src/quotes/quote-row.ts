// SPDX-License-Identifier: MIT
// 行情行的统一模型（体检 §1、§4，2026-11-18 G4）：自选列表、分组页签行情表、同业卡、报价卡共用一份 { id, symbol, name, last, change, changePct }。
// 值一律是数，文字由调用方给的 formatPrice 写（品种的精度只有调用方知道）；涨跌方向由 change 定，不另传。
import { toneOf, type Tone } from '../quant/format/index.ts'

/** One symbol's quote as numbers: the shared row model of Watchlist, QuoteTable, PeerCards and QuoteCard. */
export type QuoteRow = {
  /** Stable row id (used for keys, reordering and enter marks). */
  id: string
  /** Symbol code (BTCUSDT, 600519). */
  symbol: string
  /** Display name; the symbol is shown when omitted. */
  name?: string
  /** Last price. */
  last: number
  /** Change amount, signed. */
  change: number
  /** Change as a percentage (1.5 means 1.5%). */
  changePct: number
}

/** Writes a price as text; the caller knows the symbol's precision. */
export type FormatPrice = (value: number) => string

/** Default price text when no formatPrice is given: two decimals, no grouping; not finite is an em dash. */
export const plainPrice: FormatPrice = (value) => (Number.isFinite(value) ? value.toFixed(2) : '—')

/** Direction of a row: from change, falling back to changePct when change is not finite. */
export function rowTone(row: Pick<QuoteRow, 'change' | 'changePct'>): Tone {
  return Number.isFinite(row.change) ? toneOf(row.change) : toneOf(row.changePct)
}

/** Reads a number out of formatted text (thousand separators, U+2212 minus); null when there is none. For deprecated string props. */
export function readNumber(text: string | number | undefined | null): number | null {
  if (typeof text === 'number') return Number.isFinite(text) ? text : null
  const found = text?.replace(/,/g, '').match(/[-+−]?\d+(?:\.\d+)?/)?.[0]
  const value = found === undefined ? Number.NaN : Number(found.replace('−', '-'))
  return Number.isFinite(value) ? value : null
}
