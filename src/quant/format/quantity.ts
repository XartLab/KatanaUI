// SPDX-License-Identifier: MIT
// 量化界面共用的数量写法（原 src/panels/kit/quantity-format.ts，#1862 搬进量化层），照 ATAS Smart Tape 的「数量缩写」与「数量小数位」（2026-10-07 读自 help.atas.net）。

/** 数量的单位：币（合约）或美元金额。 */
export type QuantityUnits = 'base' | 'usd'

/**
 * - abbreviate：大数写成 K / M（美元从 1,000 起，币从 10,000 起，小一点的币量照写）；
 * - digits：小数位，null 按大小自动（K 留 1 位、M 留 2 位，币量不到 1 留 3 位有效数字）。
 */
export type SizeFormat = { abbreviate: boolean; digits: number | null }
export const AUTO_SIZE: SizeFormat = { abbreviate: true, digits: null }

function scale(value: number, units: QuantityUnits): [number, string] {
  if (value >= 1e6) return [value / 1e6, 'M']
  if (value >= (units === 'usd' ? 1e3 : 1e4)) return [value / 1e3, 'K']
  return [value, '']
}

/** 自动的小数位；null 表示按 3 位有效数字写（不到 1 个币）。 */
function autoDigits(value: number, suffix: string, units: QuantityUnits): number | null {
  if (suffix === 'M') return 2
  if (suffix === 'K') return 1
  if (units === 'usd' || value >= 100) return 0
  return value >= 1 ? 2 : null
}

/** 整数部分加千分位。 */
const withCommas = (text: string) => text.replace(/^(\d+)/, (whole) => whole.replace(/\B(?=(\d{3})+$)/g, ','))

/** 数量：按写法缩写、留小数；美元带 $。负数（例：Delta）按绝对值写，前面加负号。 */
export function formatQuantity(
  value: number,
  units: QuantityUnits,
  { abbreviate, digits }: SizeFormat = AUTO_SIZE,
): string {
  const sign = value < 0 ? '-' : ''
  const [scaled, suffix] = abbreviate ? scale(Math.abs(value), units) : [Math.abs(value), '']
  const places = digits ?? autoDigits(scaled, suffix, units)
  const text = places === null ? (scaled === 0 ? '0' : scaled.toPrecision(3)) : withCommas(scaled.toFixed(places))
  return `${sign}${units === 'usd' ? '$' : ''}${text}${suffix}`
}

/** 个数（例：笔数）：整数加千分位；缩写时跟币量一样从 10,000 起写成 K / M。 */
export function formatCount(value: number, abbreviate: boolean): string {
  if (abbreviate && value >= 1e4) {
    const [scaled, suffix] = scale(value, 'base')
    return `${scaled.toFixed(suffix === 'M' ? 2 : 1)}${suffix}`
  }
  return withCommas(String(Math.round(value)))
}

/**
 * 统计面板的大字（照 OpenMarket 的 Volume Stats、Liquidity Stats：$13.2B、$865.1M）：一位小数，K / M / B，
 * 拆成数字与单位两段，单位写淡。美元带 $。
 */
export function compactParts(value: number, units: QuantityUnits = 'usd'): { number: string; suffix: string } {
  const sign = value < 0 ? '-' : ''
  const size = Math.abs(value)
  const [scaled, suffix] =
    size >= 1e9 ? [size / 1e9, 'B'] : size >= 1e6 ? [size / 1e6, 'M'] : size >= 1e3 ? [size / 1e3, 'K'] : [size, '']
  return { number: `${sign}${units === 'usd' ? '$' : ''}${scaled.toFixed(1)}`, suffix }
}

/** 统计面板的小读数（右上、比例条两头）：跟大字同一种写法，数字与单位连着写。 */
export function formatCompact(value: number, units: QuantityUnits = 'usd'): string {
  const { number, suffix } = compactParts(value, units)
  return number + suffix
}
