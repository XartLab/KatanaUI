// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import {
  compactNumber,
  formatPercentChange,
  formatPrice,
  formatQuantity,
  toneOf,
  type PriceFallback,
  type QuantityUnits,
  type SizeFormat,
} from '../../lib/chart/format/index.ts'
import { pad, signed as signedText } from '../../lib/num.ts'
import type { Severity } from '../../lib/severity.ts'
import type { Tone } from '../../lib/tone.ts'
import { ratingZone } from '../../quotes/rating-gauge-model.ts'
import type { RatingLevel } from '../../quotes/rating-text.tsx'
import { compareDecimal } from './model.ts'

// 列类型（#1869）：列声明一个类型，格式化、对齐、着色、排序由类型给，不每列手写。
// 参照：AG Grid 的 column types（columnTypes 里挂一组默认的列属性，列用 `type` 引用，2026-11-14 读文档，只取这个概念，没有抄代码）、
// FINOS Perspective 的按列类型选格式。商业产品只读不抄。

export type ColumnType =
  | 'text'
  | 'number'
  | 'price'
  | 'quantity'
  | 'pnl'
  | 'change'
  | 'side'
  | 'time'
  | 'symbol'
  | 'percent'
  | 'compact'
  | 'rating'
  | 'bar'
  | 'spark'
  | 'tag'
  | 'range'
  | 'date'
  | 'custom'

/** 字的颜色：涨 / 跌（跟 data-updown，红涨绿跌时互换）、次要灰。 */
export type GridTone = 'up' | 'down' | 'muted'

/** 买卖方向。 */
export type GridSide = 'buy' | 'sell'

/** 品种：代码、场所，可选名称与徽标（icon 有就在代码前画 SymbolMark，icon.src 是图片地址，没有 src 画字母圆标）。 */
export type SymbolValue = string | { code: string; venue?: string; name?: string; icon?: { src?: string } }

/**
 * 品种格画哪几段（#90）：logo 是 SymbolMark 圆标（没给 icon 画字母圆标），code 是纯文字代码，chip 是代码芯片（12px w600、面底、圆角 6、高 24，照 TradingView 选股器），
 * name 是全称，venue 是场所小字。省略时是旧写法：有 icon 才画 logo，再 code 与 venue。
 */
export type SymbolPart = 'logo' | 'code' | 'chip' | 'name' | 'venue'

/** range 列的原始值：区间两端与现值（52 周区间、当日区间）。 */
export type RangeValue = { low: number; high: number; value: number }

/** tag 列的原始值：字，或字加语气（Severity）。 */
export type TagValue = string | { text: string; tone?: Severity }

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
  /** pnl：写在数字后面的单位（USDT）；同 unit，留着向后兼容。 */
  suffix?: string
  /**
   * 数字后面的单位（USD、USDT、倍）：单独渲染成小一号的次要色字（10px w500，照 TradingView 选股器），复制与导出时跟数字之间空一格。
   * number、price、quantity、pnl、compact、bar 读它。
   */
  unit?: string
  /** compact、date：缩写与日期用哪种语言（en-US 是 K/M/B/T，zh-CN 是 万/亿）；省略时用 DataGrid 的 locale，再没有是 en-US。 */
  locale?: string
  /** rating：五档的名字（文案由调用方传）；默认 Strong sell / Sell / Neutral / Buy / Strong buy。 */
  ratingLabels?: Readonly<Record<RatingLevel, string>>
  /** bar：横条满格对应的值（相对成交量写 3 就是 3 倍满格）；默认 1。 */
  max?: number
  /** spark、range、bar：读屏名（「ALFA 30 日走势」）；省略时用格子的字。 */
  label?: string
  /** tag：没在值里写语气时用的语气；默认 neutral。 */
  tagTone?: Severity
  /** symbol：画哪几段，见 SymbolPart。 */
  symbolParts?: readonly SymbolPart[]
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
   * percent / compact / bar 同数字；time、date 是毫秒时间戳；side 是 'buy' | 'sell'；symbol 是 SymbolValue；text 是字符串；
   * rating 是 RatingLevel 或 −1…1 的分数；spark 是从旧到新的数组；tag 是 TagValue；range 是 RangeValue；custom 不读（内容全由 `cell` 画，要排序、复制就给 `text` 与 `sort`）。
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
  /**
   * custom 列的内容：这一格画什么都行（多行的字、使用度条、按钮）。按钮之类要点的东西放在里面，表不把它当整行的点击。
   * 复制、导出与排序用 `text` 与 `sort`，没给就是空字。
   */
  cell?: (row: Row) => ReactNode
  /** 代替文字的内容（状态灯、置灰的入口）；复制与导出仍用屏幕上的字。 */
  render?: (row: Row) => ReactNode
  /** 导出 CSV 用的格与表头（原始数值、带单位的表头）；省略时导出屏幕上的字与列名。复制仍是屏幕上的字。 */
  csv?: (row: Row) => string
  csvHeader?: () => string
  /** 这一列是行的标题（指标表的第一列）：这一格读作 rowheader，屏幕阅读器念「指标名：值」。 */
  rowHeader?: boolean
}

export type CellEnv = {
  /** time 列用的时区：'local'（默认，跟电脑一致）、'utc'，或 IANA 时区名。 */
  timeZone?: string
  /** compact、date 列的默认语言（列的 format.locale 优先）。 */
  locale?: string
}

/** 格子里除了字以外要画的件（#90 的新列类型），由 CellBody 画。 */
export type CellVisual =
  | { kind: 'rating'; level: RatingLevel }
  | { kind: 'bar'; share: number }
  | { kind: 'spark'; values: readonly number[]; label: string }
  | { kind: 'tag'; tone: Severity }
  | { kind: 'range'; low: number; high: number; value: number; label: string; digits: number }

export type ResolvedCell = {
  /** 屏幕上的字。 */
  text: string
  tone: GridTone | undefined
  /** 排序用的值。 */
  sort: string | number | undefined
  /** 类型决定的方向（pnl / change / side / rating），渲染时用 ToneText；没有方向是 undefined。 */
  direction: Tone | undefined
  /** symbol 列拆好的几段，parts 是要画哪几段。 */
  symbol:
    | {
        code: string
        venue: string | undefined
        name: string | undefined
        icon: { src?: string } | undefined
        parts: readonly SymbolPart[]
      }
    | undefined
  /** 屏幕上数字那一段（单位另写）；没有单位时等于 text。 */
  main: string
  /** 数字后面的小字单位；没有是 undefined。 */
  unit: string | undefined
  /** 字以外要画的件。 */
  visual: CellVisual | undefined
}

const NUMERIC: ReadonlySet<ColumnType> = new Set([
  'number',
  'price',
  'quantity',
  'pnl',
  'change',
  'percent',
  'compact',
  'bar',
])
/** 按数排序的类型：数字类，加上排序值是数的 time、date、rating（档位）、spark（头尾涨跌）、range（区间里的位置）。 */
const SORT_NUMERIC: ReadonlySet<ColumnType> = new Set([...NUMERIC, 'time', 'date', 'rating', 'spark', 'range'])

/** 数字类的列默认靠右（等宽数字对得齐小数点）。列布局里写了 align 就听它的。 */
export const defaultAlign = (type: ColumnType | undefined): 'start' | 'end' =>
  type !== undefined && NUMERIC.has(type) ? 'end' : 'start'

/** 评级五档，从卖到买（跟 rating-gauge-model 的 ratingZone 下标一一对应）。 */
export const RATING_LEVELS: readonly RatingLevel[] = ['strong-sell', 'sell', 'neutral', 'buy', 'strong-buy']
const RATING_LABELS: Readonly<Record<RatingLevel, string>> = {
  'strong-sell': 'Strong sell',
  sell: 'Sell',
  neutral: 'Neutral',
  buy: 'Buy',
  'strong-buy': 'Strong buy',
}
const RATING_TONE: Readonly<Record<RatingLevel, Tone>> = {
  'strong-sell': 'down',
  sell: 'down',
  neutral: 'flat',
  buy: 'up',
  'strong-buy': 'up',
}

/** rating 列的值：五档名，或 −1…1 的分数（按 technical-rating 的同一把尺子 ratingZone 分档）。 */
function ratingOf(raw: unknown): RatingLevel | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) ? RATING_LEVELS[ratingZone(raw)] : undefined
  return typeof raw === 'string' && (RATING_LEVELS as readonly string[]).includes(raw)
    ? (raw as RatingLevel)
    : undefined
}

const fixed = (value: number, digits: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** 数字或十进制字符串 → 数；空、不是数是 null。 */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value.replace('−', '-'))
    return Number.isFinite(number) ? number : null
  }
  return null
}

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
  let visual: CellVisual | undefined
  // 数字后的单位：unit 优先，pnl 的旧名 suffix 也认。
  let unit: string | undefined = format.unit ?? (type === 'pnl' ? format.suffix : undefined)
  const locale = format.locale ?? env.locale
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
      text = number === null ? DASH : signed(number, digits)
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
    case 'percent': {
      const number = toNumber(raw)
      text = number === null ? DASH : `${fixed(number, format.digits ?? 2)}%`
      sort = number ?? undefined
      break
    }
    case 'compact': {
      const number = toNumber(raw)
      if (number === null) text = DASH
      else {
        const parts = compactNumber(number, { locale, digits: format.digits })
        text = parts.suffix ? `${parts.number} ${parts.suffix}` : parts.number
      }
      sort = number ?? undefined
      break
    }
    case 'bar': {
      const number = toNumber(raw)
      text = number === null ? DASH : fixed(number, format.digits ?? 2)
      const max = format.max ?? 1
      if (number !== null && max > 0) visual = { kind: 'bar', share: Math.min(1, Math.max(0, number / max)) }
      sort = number ?? undefined
      break
    }
    case 'rating': {
      const level = ratingOf(raw)
      text = level ? (format.ratingLabels ?? RATING_LABELS)[level] : DASH
      if (level) {
        visual = { kind: 'rating', level }
        direction = RATING_TONE[level]
      }
      // 原始值是分数时按分数排（同一档里也分先后），是档名时按档位排。
      sort = typeof raw === 'number' && Number.isFinite(raw) ? raw : level ? RATING_LEVELS.indexOf(level) : undefined
      break
    }
    case 'spark': {
      const values = Array.isArray(raw)
        ? raw.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
        : []
      const first = values[0]
      const last = values.at(-1)
      text = last === undefined ? DASH : fixed(last, format.digits ?? 2)
      if (values.length >= 2) visual = { kind: 'spark', values, label: format.label ?? text }
      sort = first !== undefined && last !== undefined && first !== 0 ? (last - first) / Math.abs(first) : undefined
      break
    }
    case 'tag': {
      const value = raw as TagValue | null | undefined
      const label = typeof value === 'string' ? value : (value?.text ?? '')
      text = label
      if (label !== '')
        visual = {
          kind: 'tag',
          tone: (typeof value === 'object' ? value?.tone : undefined) ?? format.tagTone ?? 'neutral',
        }
      sort = label
      break
    }
    case 'range': {
      const value = raw as RangeValue | null | undefined
      const ok = value != null && [value.low, value.high, value.value].every(Number.isFinite)
      const digits = format.digits ?? 2
      text = ok ? `${fixed(value.low, digits)} – ${fixed(value.high, digits)}` : DASH
      if (ok) visual = { kind: 'range', ...value, label: format.label ?? text, digits }
      sort = ok && value.high > value.low ? (value.value - value.low) / (value.high - value.low) : undefined
      break
    }
    case 'date': {
      const time = typeof raw === 'number' && Number.isFinite(raw) ? raw : null
      text = time === null ? DASH : formatTimestamp(time, env.timeZone, 'date')
      sort = time ?? undefined
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
      const obj = typeof value === 'object' && value !== null ? value : undefined
      const parts = format.symbolParts ?? [...(obj?.icon ? (['logo'] as const) : []), 'code', 'venue']
      symbol = code === '' ? undefined : { code, venue, name: obj?.name, icon: obj?.icon, parts }
      text = code === '' ? DASH : venue ? `${code}.${venue}` : code
      sort = code === '' ? undefined : text
      break
    }
    default: {
      text = asText(raw)
      sort = text
    }
  }
  // 单位只跟在数后面；没有数（—）不写单位。
  if (text === DASH || !['number', 'price', 'quantity', 'pnl', 'compact', 'bar'].includes(type)) unit = undefined
  let main = text
  if (unit) text = `${main} ${unit}`
  if (column.text) {
    text = column.text(row)
    main = text
    unit = undefined
  }
  const typedTone = direction === 'up' ? 'up' : direction === 'down' ? 'down' : undefined
  const tone = column.tone ? column.tone(row) : typedTone
  return {
    text,
    tone,
    sort: column.sort ? column.sort(row) : column.value ? sort : text,
    direction,
    symbol,
    main,
    unit,
    visual,
  }
}

/** 带符号的数：正数带 +，负数带 -，舍入成零不带号；千分位 en-US。 */
function signed(value: number, digits: number): string {
  return signedText(Number(value.toFixed(digits)), (abs) =>
    abs.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  )
}

/** 一列的排序比较：数字类按数（十进制字符串按十进制），time 按毫秒，别的按字（numeric 的自然序，locale 由调用方给）。 */
export function sortComparator(type: ColumnType | undefined, locale: string | undefined) {
  const numeric = type !== undefined && SORT_NUMERIC.has(type)
  const collator = new Intl.Collator(locale, { numeric: true })
  return (a: unknown, b: unknown): number => {
    if (numeric) {
      if (typeof a === 'string' || typeof b === 'string') return compareDecimal(a, b)
      return Number(a) - Number(b)
    }
    return collator.compare(asText(a), asText(b))
  }
}
