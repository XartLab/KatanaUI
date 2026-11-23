// SPDX-License-Identifier: MIT
// 盘口三件（订单簿、深度图、成交明细）共用的十进制整数运算：价格与数量按调用方给的小数位乘成整数再加减比，
// 0.1 + 0.2 之类的浮点误差进不来。件不认交易所，小数位由调用方传（对应品种的最小变动价位与最小下单量）。
import { decimalsOfTick } from './chart/format/index.ts'

/** 一个数需要几位小数（0.25 → 2，1e-7 → 7，5 → 0）；非正数或非有限数写 0。 */
export const decimalsOf = (value: number): number => (Number.isFinite(value) && value > 0 ? decimalsOfTick(value) : 0)

/** 按小数位换成整数：0.1 在 2 位时是 10。先乘再四舍五入，吃掉 0.1 * 3 这类乘法误差。 */
export const toUnits = (value: number, decimals: number): number => Math.round(value * 10 ** decimals)

/** 整数换回数：1234 在 2 位时是 12.34（除法得到离十进制值最近的双精度数，写出来时再按位数格式化）。 */
export const fromUnits = (units: number, decimals: number): number => units / 10 ** decimals

/** 整数按小数位写成十进制字符串，不经 toFixed：-5 在 2 位时是 -0.05。grouping 为真时整数部分加千分位。 */
export function formatUnits(units: number, decimals: number, grouping = true): string {
  const negative = units < 0
  const digits = String(Math.abs(Math.round(units))).padStart(decimals + 1, '0')
  const whole = digits.slice(0, digits.length - decimals)
  const fraction = decimals > 0 ? `.${digits.slice(digits.length - decimals)}` : ''
  const body = (grouping ? whole.replace(/\B(?=(\d{3})+$)/g, ',') : whole) + fraction
  return negative && /[1-9]/.test(digits) ? `-${body}` : body
}

/** 数按小数位写成十进制字符串（经整数，位数恒定）。 */
export const formatDecimal = (value: number, decimals: number, grouping = true): string =>
  Number.isFinite(value) ? formatUnits(toUnits(value, decimals), decimals, grouping) : '—'
