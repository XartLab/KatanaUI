// SPDX-License-Identifier: MIT
/**
 * Date and clock text helpers shared across components: UTC ISO day, day key in a time zone, HH:MM and M:SS.
 * G0（体检 §1：padStart 日期格式化散在各件）。只放字符串格式化；日期运算仍走各件（@internationalized/date 或 UTC 毫秒），G5 再统一。
 */
import { pad } from './num.ts'

/** UTC calendar day of a timestamp in milliseconds, as YYYY-MM-DD. */
export const isoDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

const dayFormats = new Map<string, Intl.DateTimeFormat>()

/** Calendar day of a timestamp in the given IANA time zone, as YYYY-MM-DD (formatter cached per zone). */
export function dayKeyIn(at: number, timeZone: string): string {
  let format = dayFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    dayFormats.set(timeZone, format)
  }
  return format.format(at)
}

/** Minutes since midnight as HH:MM (hours are not wrapped at 24). */
export const hhmm = (minutes: number): string => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** Whole seconds as M:SS, as on a countdown (`mss(75)` is `1:15`). */
export const mss = (seconds: number): string => `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`
