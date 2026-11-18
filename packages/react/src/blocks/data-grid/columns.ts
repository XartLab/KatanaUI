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
import type { Tone } from '../../lib/tone.ts'
import { ratingZone } from '../../quotes/rating-gauge-model.ts'
import type { RatingLevel } from '../../quotes/rating-text.tsx'
import {
  LIMIT_STATUS_ORDER,
  limitStatusText,
  normalizeLimitStatus,
  normalizeStreak,
  streakSortKey,
  streakText,
  type LimitStatusValue,
  type StreakValue,
} from '../../cn/badge-model.ts'
import { cnLabelsZh, type LimitStatusLabels, type StreakLabels } from '../../cn/labels.ts'
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
  | 'bar'
  | 'pill'
  | 'progress'
  | 'streak'
  | 'limitStatus'
  | 'percent'
  | 'compact'
  | 'rating'
  | 'spark'
  | 'range'
  | 'date'
  | 'custom'

/** 字的颜色：涨 / 跌（跟 data-updown，红涨绿跌时互换）、次要灰。 */
export type GridTone = 'up' | 'down' | 'muted'

/** 语义色调：涨 / 跌 / 弱 / 强调（Graphite 里强调是中性亮，不是橙）。调用方只选名字，色值由包里的 token 给。 */
export type GridPillTone = 'up' | 'down' | 'muted' | 'accent'

/** pill 列的一枚标签：只写字，或字加色调（不写色调是 muted）。 */
export type PillValue = string | { label: string; tone?: GridPillTone }

/** progress 列的值：分子与分母。 */
export type ProgressValue = { done: number; total: number } | readonly [done: number, total: number]

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
  /** pnl、bar：写在数字后面的单位（USDT）；同 unit，留着向后兼容。 */
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
  /**
   * bar：给了就改画单边横条，满格对应这个值（相对成交量写 3 就是 3 倍满格），中性色、不分涨跌，给有大小没正负的量（#90）；
   * 不给是带正负的居中条，长度按本列绝对值最大者归一（#109）。
   */
  barMax?: number
  /** spark、range：读屏名（「ALFA 30 日走势」）；省略时用格子的字。 */
  label?: string
  /** symbol：画哪几段，见 SymbolPart。 */
  symbolParts?: readonly SymbolPart[]
  /** side：买卖两个字（文案由调用方传，包里不带语言）；默认 Buy / Sell。 */
  labels?: { buy: string; sell: string }
  /** time：写到哪一级。默认 datetime（YYYY-MM-DD HH:MM:SS）。 */
  timeStyle?: 'datetime' | 'time' | 'date'
  /** streak：写法（首板 / 2板 / 5天3板，或晋级口径「一进二」）与文案（默认简体中文，可整份换，#110）。 */
  streakForm?: 'boards' | 'promotion'
  streakLabels?: StreakLabels
  /** limitStatus：文案（默认简体中文，可整份换，#110）。 */
  limitStatusLabels?: LimitStatusLabels
  /** pill：最多画几枚，多出的收成「+n」；没给就只按格子宽度收。 */
  maxPills?: number
}

export type GridColumn<Row> = {
  id: string
  /** 列类型；省略是 text。 */
  type?: ColumnType
  /**
   * 原始值，由类型决定怎么读：price / quantity / pnl / change / number / bar 是数字或十进制字符串（空、不是数写 —）；
   * pill 是 PillValue 或 PillValue[]；progress 是 ProgressValue；streak 是板数或 StreakValue（A 股连板，#110）；limitStatus 是状态名或 { status, sealAmount, reason }；
   * time 是毫秒时间戳；side 是 'buy' | 'sell'；symbol 是 SymbolValue；text 是字符串；custom 不读（内容全由 `cell` 画，要排序、复制就给 `text` 与 `sort`）。
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
  /**
   * 强度底色：格子底色按这一格的数深浅（读 `value`）。domain 是 [最小, 最大]：跨 0 时正数用涨色、负数用跌色，各自以 0 到端点的距离定深浅；
   * 不跨 0 时全按涨色、从最小到最大。rank 给了就在格子右上角写一个名次小字（不占行高行宽）。颜色只由 token 给，调用方不传色值。
   */
  heat?: GridHeat<Row>
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
  /**
   * compact 分量（#117）下留这一列：compact 一行只剩名字和一个主数。整张表里有任何一列标了就只画标了的那几列；
   * 一列都没标就留前两个可见列。别的分量不看它。
   */
  compact?: boolean
  /**
   * 列优先级（#122）：standard 与 hero 分量下容器放不下全部可见列时，数大的先收起，表头右端出「+N 列」胶囊，点了切成横向滚动、显示全部。
   * 1 最高；没写的按声明顺序递增（第一列 1、第二列 2……），所以名称与主数默认最先保留。收起只影响显示：复制与导出仍是全部可见列。
   */
  priority?: number
  /** 这一列是行的标题（指标表的第一列）：这一格读作 rowheader，屏幕阅读器念「指标名：值」。 */
  rowHeader?: boolean
}

export type GridHeat<Row> = {
  domain: readonly [number, number]
  rank?: (row: Row) => string | number | undefined
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
  | { kind: 'spark'; values: readonly number[]; label: string }
  | { kind: 'range'; low: number; high: number; value: number; label: string; digits: number }

export type ResolvedCell = {
  /** 屏幕上的字。 */
  text: string
  tone: GridTone | undefined
  /** 排序用的值。 */
  sort: string | number | undefined
  /** 类型决定的方向（pnl / change / side / rating），渲染时用 ToneText；没有方向是 undefined。 */
  direction: Tone | undefined
  /** bar 列的带符号数值（条的长度按列的最大绝对值归一，由 DataGrid 在 barRatio 里算）；别的类型是 undefined。 */
  bar: number | undefined
  /** bar 列给了 format.barMax 时：值占满格的比例（0 到 1），画单边中性横条；没给是 undefined，走上面的居中条。 */
  barShare: number | undefined
  /** pill 列拆好的标签，没有标签是 undefined。 */
  pills: { label: string; tone: GridPillTone }[] | undefined
  /** progress 列的分子、分母与比例（分母不是正数时比例是 undefined）。 */
  progress: { done: number; total: number; ratio: number | undefined } | undefined
  /** streak 列：拆好的连板（取不到是 boards 为 null）、写法与文案，DataGrid 用 StreakBadge 画；别的类型是 undefined。 */
  streak: { value: StreakValue; form: 'boards' | 'promotion' | undefined; labels: StreakLabels } | undefined
  /** limitStatus 列：原样的值与文案，DataGrid 用 LimitStatus 画；别的类型是 undefined。 */
  limitStatus: { value: LimitStatusValue | undefined; labels: LimitStatusLabels } | undefined
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
  'bar',
  'progress',
  'percent',
  'compact',
])
/** 按数排序的类型：数字类，加上排序值是数的 time、date、streak、limitStatus、rating（档位）、spark（头尾涨跌）、range（区间里的位置）。 */
const SORT_NUMERIC: ReadonlySet<ColumnType> = new Set([
  ...NUMERIC,
  'time',
  'date',
  'streak',
  'limitStatus',
  'rating',
  'spark',
  'range',
])

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
  let bar: ResolvedCell['bar']
  let barShare: ResolvedCell['barShare']
  let pills: ResolvedCell['pills']
  let progress: ResolvedCell['progress']
  let streak: ResolvedCell['streak']
  let limitStatus: ResolvedCell['limitStatus']
  let visual: CellVisual | undefined
  // 数字后的单位：unit 优先，pnl 与 bar 的旧名 suffix 也认。
  let unit: string | undefined = format.unit ?? (type === 'pnl' || type === 'bar' ? format.suffix : undefined)
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
    case 'bar': {
      const number = toNumber(raw)
      const digits = format.digits ?? 2
      const barMax = format.barMax
      const share = barMax !== undefined && barMax > 0
      // 单边条（barMax）的量没有正负，数照写不带符号；居中条带符号。
      text = number === null ? DASH : share ? fixed(number, digits) : signed(number, digits)
      bar = number ?? undefined
      if (number !== null && share) barShare = clamp01(number / barMax)
      sort = number ?? undefined
      break
    }
    case 'pill': {
      pills = toPills(raw)
      text = pills ? pills.map((pill) => pill.label).join(' ') : DASH
      sort = pills ? pills[0]!.label : undefined
      break
    }
    case 'progress': {
      const value = toProgress(raw)
      progress = value
        ? { ...value, ratio: value.total > 0 ? clamp01(value.done / value.total) : undefined }
        : undefined
      text = value ? `${value.done}/${value.total}` : DASH
      sort = progress?.ratio
      break
    }
    case 'streak': {
      const value = normalizeStreak(raw as number | StreakValue | null | undefined)
      const labels = format.streakLabels ?? cnLabelsZh.streak
      streak = { value, form: format.streakForm, labels }
      text = streakText(value, labels, format.streakForm)
      sort = streakSortKey(value)
      break
    }
    case 'limitStatus': {
      const value = raw as LimitStatusValue | undefined
      const labels = format.limitStatusLabels ?? cnLabelsZh.limitStatus
      limitStatus = { value, labels }
      const { status } = normalizeLimitStatus(value)
      text = limitStatusText(value, labels)
      sort = status === null ? undefined : LIMIT_STATUS_ORDER.indexOf(status)
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
    bar,
    barShare,
    pills,
    progress,
    streak,
    limitStatus,
    symbol,
    main,
    unit,
    visual,
  }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function toPills(raw: unknown): ResolvedCell['pills'] {
  const list = Array.isArray(raw) ? raw : raw === null || raw === undefined ? [] : [raw]
  const pills = list.flatMap((item: PillValue) => {
    const label = typeof item === 'string' ? item : (item?.label ?? '')
    if (label === '') return []
    return [{ label, tone: (typeof item === 'string' ? undefined : item.tone) ?? 'muted' }]
  })
  return pills.length > 0 ? pills : undefined
}

function toProgress(raw: unknown): { done: number; total: number } | undefined {
  const pair = Array.isArray(raw)
    ? [raw[0], raw[1]]
    : raw !== null && typeof raw === 'object'
      ? [(raw as { done?: unknown }).done, (raw as { total?: unknown }).total]
      : undefined
  const done = toNumber(pair?.[0])
  const total = toNumber(pair?.[1])
  return done === null || total === null || done === undefined || total === undefined ? undefined : { done, total }
}

/**
 * 强度底色：这一格按 heat.domain 落在哪一边、多深。跨 0 的 domain 里正数取涨色、负数取跌色，深浅是到 0 的距离占端点距离的比例；
 * 不跨 0 的 domain 全在 0 以上取涨色（最小到最大）、全在 0 以下取跌色（最大到最小）。没有数、等于 0 的格子没有底色。纯函数。
 */
export function resolveHeat<Row>(
  column: GridColumn<Row>,
  row: Row,
): { tone: 'up' | 'down'; level: number; rank: string | undefined } | undefined {
  const heat = column.heat
  if (!heat) return undefined
  const value = toNumber(column.value?.(row))
  if (value === null || value === 0) return undefined
  const [lo, hi] = heat.domain
  const span = (from: number, to: number) => (to === from ? 1 : clamp01((value - from) / (to - from)))
  let tone: 'up' | 'down'
  let level: number
  if (lo < 0 && hi > 0) {
    tone = value > 0 ? 'up' : 'down'
    level = value > 0 ? clamp01(value / hi) : clamp01(value / lo)
  } else if (hi <= 0) {
    tone = 'down'
    level = span(hi, lo)
  } else {
    tone = 'up'
    level = span(lo, hi)
  }
  const rank = heat.rank?.(row)
  return { tone, level, rank: rank === undefined ? undefined : String(rank) }
}

/** bar 列的条：带符号的值除以列的最大绝对值，落在 -1 到 1；没有值或最大值不是正数是 0。纯函数，DataGrid 与单测共用。 */
export function barRatio(value: number | undefined, extent: number): number {
  return value === undefined || !(extent > 0) ? 0 : Math.max(-1, Math.min(1, value / extent))
}

/** bar 列的归一基准：这一列所有行里绝对值最大的那个数。 */
export function barExtent<Row>(column: GridColumn<Row>, rows: readonly Row[], env: CellEnv = {}): number {
  let max = 0
  for (const row of rows) {
    const value = resolveCell(column, row, env).bar
    if (value !== undefined) max = Math.max(max, Math.abs(value))
  }
  return max
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

/**
 * 复制与导出要的表头与行（#117）：分量只管显示，不管数据，所以调用方传全部可见列的 id 与要带的行，不看 compact 的列筛选与前几行。
 * csv 为 true 时用列声明的 csvHeader / csv（原始数值、带单位的表头），否则是屏幕上的字。
 */
export function exportTable<Row>(
  specs: ReadonlyMap<string, GridColumn<Row>>,
  ids: readonly string[],
  labelOf: (id: string) => string,
  rows: readonly Row[],
  env: CellEnv,
  csv: boolean,
): { header: string[]; lines: string[][] } {
  const text = (spec: GridColumn<Row> | undefined, row: Row) => (spec ? resolveCell(spec, row, env).text : '')
  return {
    header: ids.map((id) => (csv ? specs.get(id)?.csvHeader?.() : undefined) ?? labelOf(id)),
    lines: rows.map((row) =>
      ids.map((id) => {
        const spec = specs.get(id)
        return csv && spec?.csv ? spec.csv(row) : text(spec, row)
      }),
    ),
  }
}
