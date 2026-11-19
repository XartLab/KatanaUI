// SPDX-License-Identifier: MIT
import { parseDate, parseTime, type CalendarDate, type Time } from '@internationalized/date'

// 日期时间输入（DateTimeInput）跟调用方之间的值：调用方一律用字符串（日期 YYYY-MM-DD、时刻 HH:mm 或 HH:mm:ss，空串是没填），
// 按哪个时区解读由调用方定（src/time 的约定，夏令时空档顺延）；react-aria 那边用 @internationalized/date 的 CalendarDate / Time。

/** YYYY-MM-DD → CalendarDate；空串或不合法是 null。 */
export function toCalendarDate(value: string): CalendarDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/** HH:mm 或 HH:mm:ss → Time；空串或不合法是 null。 */
export function toTime(value: string): Time | null {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null
  try {
    return parseTime(value)
  } catch {
    return null
  }
}

/** CalendarDate → YYYY-MM-DD；没填完（null）是空串。 */
export const fromCalendarDate = (value: CalendarDate | null): string => (value ? value.toString() : '')

/** Time → HH:mm（seconds 时 HH:mm:ss）；没填完是空串。 */
export const fromTime = (value: Time | null, seconds = false): string =>
  value ? value.toString().slice(0, seconds ? 8 : 5) : ''
