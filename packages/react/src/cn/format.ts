// SPDX-License-Identifier: MIT
// 第 0 层（#110）：中国市场的金额写法。纯函数，不带 React、不带 DOM、不带文案语言以外的东西。

/** 跟 `formatQuantity` 的 SizeFormat 同一套接口：abbreviate 为 false 就不缩成万 / 亿；digits 盖掉默认小数位。 */
export type CnAmountSize = { abbreviate?: boolean; digits?: number; signed?: boolean }

/** 万、亿的单位字（由调用方换，比如繁体）；默认「万」「亿」。这两个字是中国市场的计数单位，不算文案。 */
export type CnAmountUnits = { wan: string; yi: string }

const DEFAULT_UNITS: CnAmountUnits = { wan: '万', yi: '亿' }
const WAN = 1e4
const YI = 1e8

const withCommas = (text: string) => {
  const [int, frac] = text.split('.')
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return frac === undefined ? grouped : `${grouped}.${frac}`
}

/** 去掉小数末尾多余的 0（1.50 → 1.5，2.00 → 2）。 */
const trimZeros = (text: string) => (text.includes('.') ? text.replace(/\.?0+$/, '') : text)

/**
 * 金额写成万 / 亿：≥1 亿写「x.xx亿」（两位小数），≥1 万写「x万」（不到 100 万保留一位小数，去掉多余的 0；100 万以上取整），否则原样（千分位）。
 * 取不到（null、NaN）写「—」，不写 0。负数带 -，`signed` 给正数带 +。进位后到了下一档的写下一档（9999.6 万 → 1.00 亿）。
 */
export function formatCnAmount(
  value: number | null | undefined,
  { abbreviate = true, digits, signed = false }: CnAmountSize = {},
  units: CnAmountUnits = DEFAULT_UNITS,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const sign = value < 0 ? '-' : signed && value > 0 ? '+' : ''
  const size = Math.abs(value)
  if (!abbreviate || size < WAN) {
    const places = digits ?? (Number.isInteger(size) ? 0 : 2)
    return `${sign}${withCommas(size.toFixed(places))}`
  }
  const wan = size / WAN
  const places = digits ?? (wan < 100 ? 1 : 0)
  // 万的写法进位后到了 10000 万，就是 1 亿。
  if (size >= YI || Number(wan.toFixed(places)) >= 1e4) {
    return `${sign}${withCommas((size / YI).toFixed(digits ?? 2))}${units.yi}`
  }
  const text = withCommas(wan.toFixed(places))
  return `${sign}${digits === undefined ? trimZeros(text) : text}${units.wan}`
}
