// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import {
  formatPercentChange,
  formatPrice,
  formatQuantity,
  toneOf,
  type PriceFallback,
  type QuantityUnits,
  type SizeFormat,
} from '../../quant/format/index.ts'
import { compareDecimal } from './model.ts'

// 列类型（#1869）：列声明一个类型，格式化、对齐、着色、排序由类型给，不每列手写。
// 参照：AG Grid 的 column types（columnTypes 里挂一组默认的列属性，列用 `type` 引用，2026-11-14 读文档，只取这个概念，没有抄代码）、
// FINOS Perspective 的按列类型选格式。商业产品只读不抄。

export type ColumnType = 'text' | 'number' | 'price' | 'quantity' | 'pnl' | 'change' | 'side' | 'time' | 'symbol'

/** 字的颜色：涨 / 跌（跟 data-updown，红涨绿跌时互换）、次要灰。 */
export type GridTone = 'up' | 'down' | 'muted'

/** 买卖方向。 */
export type GridSide = 'buy' | 'sell'

/** 品种：代码加场所（BTCUSDT + BINANCE）；只有一段字时当代码。 */
export type SymbolValue = string | { code: string; venue?: string }

/** 各类型的格式选项；用不到的字段被忽略。 */
export type ColumnFormat = {
  /** price：小数位 / tick / 没有精度时的写法（同 `formatPrice`）。 */
  precision?: number | null
  tick?: number
  fallback?: PriceFallback
  /** quantity：单位与缩写写法（同 `formatQuantity`）。 */
  units?: QuantityUnits
  size?: SizeFormat
  /** number、pnl、change：小数位（number 不给就照原样写；pnl 默认 2，change 默认 2）。 */
  digits?: number
  /** pnl：写在数字后面的单位（USDT）。 */
  suffix?: string
  /** side：买卖两个字（文案由调用方传，包里不带语言）；默认 Buy / Sell。 */
  labels?: { buy: string; sell: string }
  /** time：写到哪一级。默认 datetime（YYYY-MM-DD HH:MM:SS）。 */
  timeStyle?: 'datetime' | 'time' | 'date'
}

export type GridColumn<Row> = {
  id: string
  /** 列类型；省略是 text。 */
  type?: ColumnType
  /**
   * 原始值，由类型决定怎么读：price / quantity / pnl / change / number 是数字或十进制字符串（空、不是数写 —）；
   * time 是毫秒时间戳；side 是 'buy' | 'sell'；symbol 是 SymbolValue；text 是字符串。
   */
  value?: (row: Row) => unknown
  /** 格式选项，可以随行变（价格精度是品种的）。 */
  format?: ColumnFormat | ((row: Row) => ColumnFormat)
  /** 屏幕上的字；给了它就盖掉类型的写法（复制与导出的也是它）。 */
  text?: (row: Row) => string
  /** 排序用的值：数字、十进制字符串或毫秒数；没有值给 undefined，排在最后。省略时用类型的原始值，再没有就用屏幕上的字。 */
  sort?: (row: Row) => string | number | undefined
  /** 字的颜色，盖掉类型的（pnl / change / side 默认按方向着色）。 */
  tone?: (row: Row) => GridTone | undefined
  /** 整格的底色（ATAS 的盈亏是整格绿底 / 红底）。 */
  fill?: (row: Row) => 'up' | 'down' | undefined
  title?: (row: Row) => string | undefined
  /** 代替文字的内容（状态灯、置灰的入口）；复制与导出仍用屏幕上的字。 */
  render?: (row: Row) => ReactNode
  /** 导出 CSV 用的格与表头（原始数值、带单位的表头）；省略时导出屏幕上的字与列名。复制仍是屏幕上的字。 */
  csv?: (row: Row) => string
  csvHeader?: () => string
}

export type CellEnv = {
  /** time 列用的时区：'local'（默认，跟电脑一致）、'utc'，或 IANA 时区名。 */
  timeZone?: string
}

export type ResolvedCell = {
  /** 屏幕上的字。 */
  text: string
  tone: GridTone | undefined
  /** 排序用的值。 */
  sort: string | number | undefined
  /** 类型决定的方向（pnl / change / side），渲染时用 ToneText；没有方向是 undefined。 */
  direction: 'up' | 'down' | 'flat' | undefined
  /** symbol 列拆好的两段。 */
  symbol: { code: string; venue: string | undefined } | undefined
}

const NUMERIC: ReadonlySet<ColumnType> = new Set(['number', 'price', 'quantity', 'pnl', 'change'])

/** 数字类的列默认靠右（等宽数字对得齐小数点）。列布局里写了 align 就听它的。 */
export const defaultAlign = (type: ColumnType | undefined): 'start' | 'end' =>
  type !== undefined && NUMERIC.has(type) ? 'end' : 'start'

/** 数字或十进制字符串 → 数；空、不是数是 null。 */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value.replace('−', '-'))
    return Number.isFinite(number) ? number : null
  }
  return null
}

const pad = (value: number, width = 2) => String(value).padStart(width, '0')

/** 毫秒时间戳写成 YYYY-MM-DD HH:MM:SS（或只写时间、日期）；时区见 CellEnv。 */
export function formatTimestamp(
  time: number,
  timeZone: string | undefined,
  style: 'datetime' | 'time' | 'date' = 'datetime',
): string {
  const zone = timeZone === undefined || timeZone === 'local' ? undefined : timeZone === 'utc' ? 'UTC' : timeZone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(time)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  const date = `${pad(Number(get('year')), 4)}-${get('month')}-${get('day')}`
  const clock = `${get('hour')}:${get('minute')}:${get('second')}`
  return style === 'date' ? date : style === 'time' ? clock : `${date} ${clock}`
}

/** 原始值写成字：字符串、数、布尔照写，别的（对象、空）是空字。 */
const asText = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint'
      ? String(value)
      : ''

const DASH = '—'
const SIDE_LABELS = { buy: 'Buy', sell: 'Sell' } as const

/** 一格的字、颜色、排序值：由列类型与这一行的原始值算出来（纯函数，单测直接调）。 */
export function resolveCell<Row>(column: GridColumn<Row>, row: Row, env: CellEnv = {}): ResolvedCell {
  const type = column.type ?? 'text'
  const raw = column.value?.(row)
  const format = typeof column.format === 'function' ? column.format(row) : (column.format ?? {})
  let text = ''
  let sort: string | number | undefined
  let direction: ResolvedCell['direction']
  let symbol: ResolvedCell['symbol']
  switch (type) {
    case 'price': {
      const number = toNumber(raw)
      text = number === null ? DASH : formatPrice(number, format)
      sort = number ?? undefined
      break
    }
    case 'quantity': {
      const number = toNumber(raw)
      text = number === null ? DASH : formatQuantity(number, format.units ?? 'base', format.size)
      sort = number ?? undefined
      break
    }
    case 'pnl': {
      const number = toNumber(raw)
      const digits = format.digits ?? 2
      text = number === null ? DASH : `${signed(number, digits)}${format.suffix ? ` ${format.suffix}` : ''}`
      direction = number === null ? undefined : toneOf(number, digits)
      sort = number ?? undefined
      break
    }
    case 'change': {
      const number = toNumber(raw)
      const digits = format.digits ?? 2
      text = number === null ? DASH : formatPercentChange(number, digits)
      direction = number === null ? undefined : toneOf(number, digits)
      sort = number ?? undefined
      break
    }
    case 'number': {
      const number = toNumber(raw)
      text =
        number === null
          ? DASH
          : format.digits !== undefined
            ? number.toLocaleString('en-US', {
                minimumFractionDigits: format.digits,
                maximumFractionDigits: format.digits,
              })
            : typeof raw === 'string'
              ? raw
              : String(number)
      // 十进制字符串保持字符串排序（不转双精度）。
      sort = typeof raw === 'string' && number !== null ? raw : (number ?? undefined)
      break
    }
    case 'side': {
      const labels = format.labels ?? SIDE_LABELS
      text = raw === 'buy' ? labels.buy : raw === 'sell' ? labels.sell : DASH
      direction = raw === 'buy' ? 'up' : raw === 'sell' ? 'down' : undefined
      sort = raw === 'buy' ? 0 : raw === 'sell' ? 1 : undefined
      break
    }
    case 'time': {
      const time = typeof raw === 'number' && Number.isFinite(raw) ? raw : null
      text = time === null ? DASH : formatTimestamp(time, env.timeZone, format.timeStyle)
      sort = time ?? undefined
      break
    }
    case 'symbol': {
      const value = raw as SymbolValue | null | undefined
      const code = typeof value === 'string' ? value : (value?.code ?? '')
      const venue = typeof value === 'object' && value !== null ? value.venue : undefined
      symbol = code === '' ? undefined : { code, venue }
      text = code === '' ? DASH : venue ? `${code}.${venue}` : code
      sort = code === '' ? undefined : text
      break
    }
    default: {
      text = asText(raw)
      sort = text
    }
  }
  if (column.text) text = column.text(row)
  const typedTone = direction === 'up' ? 'up' : direction === 'down' ? 'down' : undefined
  const tone = column.tone ? column.tone(row) : typedTone
  return {
    text,
    tone,
    sort: column.sort ? column.sort(row) : column.value ? sort : text,
    direction,
    symbol,
  }
}

/** 带符号的数：正数带 +，负数带 -，舍入成零不带号；千分位 en-US。 */
function signed(value: number, digits: number): string {
  const at = Number(value.toFixed(digits))
  const body = Math.abs(at).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return at > 0 ? `+${body}` : at < 0 ? `-${body}` : body
}

/** 一列的排序比较：数字类按数（十进制字符串按十进制），time 按毫秒，别的按字（numeric 的自然序，locale 由调用方给）。 */
export function sortComparator(type: ColumnType | undefined, locale: string | undefined) {
  const numeric = type !== undefined && (NUMERIC.has(type) || type === 'time')
  const collator = new Intl.Collator(locale, { numeric: true })
  return (a: unknown, b: unknown): number => {
    if (numeric) {
      if (typeof a === 'string' || typeof b === 'string') return compareDecimal(a, b)
      return Number(a) - Number(b)
    }
    return collator.compare(asText(a), asText(b))
  }
}
