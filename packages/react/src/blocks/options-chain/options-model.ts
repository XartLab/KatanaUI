// SPDX-License-Identifier: MIT
/**
 * Pure model of OptionsChain: which strike is at the money, which side is in the money, column order of the two wings and default cell text.
 * 期权 T 型报价的纯函数：平值行权价、实值区、两翼的列次序、格子的默认写法。件不定价：买卖价、IV、Delta 都是调用方给的数。
 */

export type OptionSide = 'call' | 'put'
export type OptionField = 'bid' | 'ask' | 'last' | 'iv' | 'delta' | 'openInterest'

/** Quote of one side of one strike; a missing or null field shows a dash. */
export type OptionQuote = Partial<Record<OptionField, number | null>>

export type OptionRow = {
  strike: number
  call?: OptionQuote
  put?: OptionQuote
}

/** Default columns of each wing. */
export const DEFAULT_FIELDS: readonly OptionField[] = ['bid', 'ask', 'last', 'iv', 'delta', 'openInterest']

/**
 * The strike nearest to the underlying price; on a tie the lower strike wins. null with no strikes or a non-finite price.
 * 离标的价最近的行权价；一样近取低的；没有行权价或价格不是有限数是 null。
 */
export function atmStrike(strikes: readonly number[], underlying: number): number | null {
  if (!Number.isFinite(underlying)) return null
  let best: number | null = null
  for (const strike of strikes) {
    if (!Number.isFinite(strike)) continue
    if (best === null) best = strike
    else {
      const gap = Math.abs(strike - underlying)
      const bestGap = Math.abs(best - underlying)
      if (gap < bestGap || (gap === bestGap && strike < best)) best = strike
    }
  }
  return best
}

/** In the money: a call below the underlying price, a put above it; at the money is not in the money. */
export function isItm(side: OptionSide, strike: number, underlying: number): boolean {
  return side === 'call' ? strike < underlying : strike > underlying
}

/**
 * Columns of a wing from the strike outward. The call wing is mirrored, so the first configured field sits next to the strike on both sides:
 * with [bid, ask, last] the call wing reads last, ask, bid | strike | bid, ask, last.
 * 一翼的列次序：认购翼镜像排，所以配置里排第一的字段两翼都紧贴行权价（bid、ask、last 配出来是 last ask bid | 行权价 | bid ask last）。
 */
export function wingFields(side: OptionSide, fields: readonly OptionField[]): OptionField[] {
  return side === 'call' ? [...fields].reverse() : [...fields]
}

/** Rows sorted by strike, low to high; the input is not changed. */
export const sortedRows = (rows: readonly OptionRow[]): OptionRow[] => [...rows].toSorted((a, b) => a.strike - b.strike)

/** Default writing of a cell: prices two decimals, IV one decimal with a percent sign (IV is a percent already), delta two decimals, open interest grouped. */
export function formatOptionField(field: OptionField, value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  switch (field) {
    case 'iv':
      return `${value.toFixed(1)}%`
    case 'delta':
      return value.toFixed(2)
    case 'openInterest':
      return Math.round(value).toLocaleString('en-US')
    default:
      return value.toFixed(2)
  }
}
