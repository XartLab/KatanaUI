// SPDX-License-Identifier: MIT
// 数字缩写（#90）：照 TradingView 选股器（#90 记录的 2026-11-18 实测：市值 4.53 T、成交量 835.49 K，两位小数，缩写字母与数字之间空一格，单位另写小字）。
// 缩写的字由 locale 决定，用平台的 Intl.NumberFormat 的 compact 记数法：en-US 是 K / M / B / T，ja 是 万 / 億。
// 组件不带语言：locale 由调用方给（列的 format.locale 或 DataGrid 的 locale），省略是 en-US。
// 中文（zh*）不另带一套万 / 亿：用 cnAmount 的写法 formatCnAmount（用户 2026-11-23 定，#158，取代 #92 的「8,800 万」「5 亿」）——
// ≥1 亿「5.20亿」，1 万–1 亿「4.6万」「8,800万」，单位字紧跟着数；en 的 K/M/B/T 照旧两位小数、空一格（对齐 TradingView）。
import { formatCnAmount } from './cn-amount.ts'

export type CompactFormat = {
  /**
   * BCP 47 locale that picks the abbreviations (en-US: K/M/B/T, zh-CN: CJK myriad units); defaults to en-US.
   * 缩写字跟它走：en-US 是 K/M/B/T，zh-CN 是 万/亿。
   */
  locale?: string
  /**
   * Decimal places of an abbreviated number; defaults to 2. Numbers below the first step keep at most this many places without trailing zeros.
   * zh 下传给 formatCnAmount；不给时用它的默认（亿两位、万不到 100 一位、其余取整）。
   */
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

const isZh = (locale: string | undefined) => locale?.toLowerCase().startsWith('zh') ?? false

/** 把数缩写成数字与缩写字两段（纯函数）；不是有限数时 number 是「—」。zh 下两段拆自 formatCnAmount。 */
export function compactNumber(value: number, { locale = 'en-US', digits }: CompactFormat = {}): CompactNumber {
  if (!Number.isFinite(value)) return { number: '—', suffix: '' }
  if (isZh(locale)) {
    const text = formatCnAmount(value, { digits })
    const suffix = text.endsWith('亿') || text.endsWith('万') ? text.slice(-1) : ''
    return { number: suffix ? text.slice(0, -1) : text, suffix }
  }
  const places = digits ?? 2
  const parts = formatter(locale, {
    notation: 'compact',
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).formatToParts(value)
  const suffix = parts
    .filter((part) => part.type === 'compact')
    .map((part) => part.value)
    .join('')
  if (suffix === '') {
    // 不到第一档（en 的 1,000）照写：最多 digits 位小数、不补零，带千分位。
    return { number: formatter(locale, { maximumFractionDigits: places }).format(value), suffix: '' }
  }
  const number = parts
    .filter((part) => part.type !== 'compact' && part.type !== 'literal')
    .map((part) => part.value)
    .join('')
  return { number, suffix }
}

/** 缩写成一串字：K/M/B/T 与数字之间空一格（4.53 T）；zh 就是 formatCnAmount 的字（1.23亿）。 */
export function formatCompactNumber(value: number, format?: CompactFormat): string {
  if (isZh(format?.locale)) return Number.isFinite(value) ? formatCnAmount(value, { digits: format?.digits }) : '—'
  const { number, suffix } = compactNumber(value, format)
  return suffix ? `${number} ${suffix}` : number
}
