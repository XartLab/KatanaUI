// SPDX-License-Identifier: MIT
// 价格的写法：小数位由调用方传（品种的价格精度，或最小变动价位 tick），不在这里猜；千分位固定 en-US（逗号千分、点小数，跟应用里别处一致）。

/** 品种不知道价格精度时怎么写：最多几位小数，或几位有效数字。 */
export type PriceFallback = { maxFraction: number } | { significant: number }

export interface PriceFormat {
  /**
   * Decimal places (the symbol's price precision); null or omitted falls back to tick, then to fallback.
   * 小数位（品种的价格精度）。null 或不给：看 tick，tick 也没有就按 fallback。
   */
  precision?: number | null
  /**
   * Minimum price increment (0.01 for A-shares, 1e-8 for crypto); sets the decimals when precision is missing.
   * 最小变动价位（A 股 0.01、期货自定、加密 1e-8）：没给 precision 时由它定小数位。
   */
  tick?: number
  /** What to write when neither precision nor tick is given. */
  fallback?: PriceFallback
}

const MAX_PLACES = 18

/**
 * tick 需要几位小数：0.01 → 2，0.25 → 2，0.2 → 1，5 → 0，1e-8 → 8，2.5e-7 → 8。
 * 小的 tick 的 String() 是科学计数（"1e-8"），不能直接数小数点后的字符，所以拆开尾数与指数。
 */
export function decimalsOfTick(tick: number): number {
  if (!Number.isFinite(tick) || tick <= 0) throw new RangeError(`tick 要是正数：${tick}`)
  const [mantissa, exponent = '0'] = String(tick).split('e')
  const fraction = mantissa.split('.')[1]?.length ?? 0
  return Math.min(MAX_PLACES, Math.max(0, fraction - Number(exponent)))
}

/** 价格写成字符串：定了小数位就恒写这么多位（0.1 在 2 位时写 0.10），没定按 fallback。不是有限数写 —。 */
export function formatPrice(
  value: number,
  { precision, tick, fallback = { maxFraction: 10 } }: PriceFormat = {},
): string {
  if (!Number.isFinite(value)) return '—'
  const places = precision ?? (tick === undefined ? null : decimalsOfTick(tick))
  if (places !== null) {
    return value.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places })
  }
  return value.toLocaleString(
    'en-US',
    'significant' in fallback
      ? { maximumSignificantDigits: fallback.significant }
      : { maximumFractionDigits: fallback.maxFraction },
  )
}
