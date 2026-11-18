// SPDX-License-Identifier: MIT
// 数字缩写（#90）：照 TradingView 选股器（#90 记录的 2026-11-18 实测：市值 4.53 T、成交量 835.49 K，两位小数，缩写字母与数字之间空一格，单位另写小字）。
// 缩写的字由 locale 决定，用平台的 Intl.NumberFormat 的 compact 记数法：en-US 是 K / M / B / T，zh-CN 是 万 / 亿 / 万亿，ja 是 万 / 億。
// 组件不带语言：locale 由调用方给（列的 format.locale 或 DataGrid 的 locale），省略是 en-US。
// 中文（zh*，#92 用户定）：≥ 1 亿写「x.xx 亿」（万亿同理），1 万 – 1 亿写千分位整数「8,800 万」，去掉无意义的 .00（「5 亿」）；en 的 K/M/B/T 照旧两位小数（对齐 TradingView）。

export type CompactFormat = {
  /**
   * BCP 47 locale that picks the abbreviations (en-US: K/M/B/T, zh-CN: CJK myriad units); defaults to en-US.
   * 缩写字跟它走：en-US 是 K/M/B/T，zh-CN 是 万/亿。
   */
  locale?: string
  /** Decimal places of an abbreviated number; defaults to 2. Numbers below the first step keep at most this many places without trailing zeros. */
  digits?: number
}

/** 缩写好的两段：数字（带符号）与缩写字（K、亿；不到第一档是空字）。 */
export type CompactNumber = { number: string; suffix: string }

const cache = new Map<string, Intl.NumberFormat>()
function formatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let found = cache.get(key)
  if (!found) {
    found = new Intl.NumberFormat(locale, options)
    cache.set(key, found)
  }
  return found
}

/** 把数缩写成数字与缩写字两段（纯函数）；不是有限数时 number 是「—」。 */
export function compactNumber(value: number, { locale = 'en-US', digits = 2 }: CompactFormat = {}): CompactNumber {
  if (!Number.isFinite(value)) return { number: '—', suffix: '' }
  const zh = locale.toLowerCase().startsWith('zh')
  // 万 档取整后到了 10,000 万的（99,999,999）进到亿档写。
  const wan = Math.round(value / 1e4)
  if (zh && Math.abs(value) >= 1e4 && Math.abs(wan) < 1e4) {
    return { number: formatter(locale, { maximumFractionDigits: 0 }).format(wan), suffix: '万' }
  }
  const parts = formatter(locale, {
    notation: 'compact',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).formatToParts(value)
  const suffix = parts
    .filter((part) => part.type === 'compact')
    .map((part) => part.value)
    .join('')
  if (suffix === '') {
    // 不到第一档（en 的 1,000、zh 的 1 万）照写：最多 digits 位小数、不补零，带千分位。
    return { number: formatter(locale, { maximumFractionDigits: digits }).format(value), suffix: '' }
  }
  const number = parts
    .filter((part) => part.type !== 'compact' && part.type !== 'literal')
    .map((part) => part.value)
    .join('')
  // 中文的亿 / 万亿档：小数全是 0 时不写（「5 亿」，不写「5.00 亿」）。
  return { number: zh ? number.replace(/\.0+$/, '') : number, suffix }
}

/** 缩写成一串字：数字与缩写字之间空一格（4.53 T、1.23 亿）。 */
export function formatCompactNumber(value: number, format?: CompactFormat): string {
  const { number, suffix } = compactNumber(value, format)
  return suffix ? `${number} ${suffix}` : number
}
