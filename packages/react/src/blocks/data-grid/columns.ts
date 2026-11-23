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
} from '../../lib/chart/format/index.ts'
import { pad, signed as signedText } from '../../lib/num.ts'
import {
  LIMIT_STATUS_ORDER,
  boardSortKey,
  boardText,
  limitStatusText,
  normalizeLimitStatus,
  normalizeStreak,
  streakSortKey,
  streakText,
  toBoardKind,
  type BoardInput,
  type LimitStatusValue,
  type StreakValue,
} from '../../cn/badge-model.ts'
import { auctionSteps, auctionSummary, type AuctionPoint } from '../../cn/auction-model.ts'
import { formatCnAmount, type CnAmountSize, type CnAmountUnits } from '../../cn/format.ts'
import {
  cnLabelsZh,
  type BoardKind,
  type BoardMarkLabels,
  type LimitStatusLabels,
  type StreakLabels,
} from '../../cn/labels.ts'
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
  | 'board'
  | 'cnAmount'
  | 'auctionStep'
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

/** 品种：代码加场所（BTCUSDT + BINANCE）；只有一段字时当代码。 */
/** 品种：代码、场所，可选名称与徽标（icon 有就在代码前画 SymbolMark，icon.src 是图片地址，没有 src 画字母圆标）。 */
export type SymbolValue = string | { code: string; venue?: string; name?: string; icon?: { src?: string } }

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
  /** streak：写法（首板 / 2板 / 5天3板，或晋级口径「一进二」）与文案（默认简体中文，可整份换，#110）。 */
  streakForm?: 'boards' | 'promotion'
  streakLabels?: StreakLabels
  /** limitStatus：文案（默认简体中文，可整份换，#110）。 */
  limitStatusLabels?: LimitStatusLabels
  /** board：BoardMark 的写法（cm 写 20cm / 30cm、主板空，name 写板块名，both 都写；默认 cm）与文案（默认简体中文，#148）。 */
  boardDisplay?: 'cm' | 'name' | 'both'
  boardLabels?: BoardMarkLabels
  /** cnAmount：同 `formatCnAmount` 的缩写、小数位与正数带 +（signed 为真时按正负着涨跌色），万、亿两个字可换（#148）。 */
  cnAmount?: CnAmountSize
  cnUnits?: CnAmountUnits
  /** pill：最多画几枚，多出的收成「+n」；没给就只按格子宽度收。 */
  maxPills?: number
}

export type GridColumn<Row> = {
  id: string
  /** 列类型；省略是 text。 */
  type?: ColumnType
  /**
   * 原始值，由类型决定怎么读：price / quantity / pnl / change / number / bar 是数字或十进制字符串（空、不是数写 —）；
   * pill 是 PillValue 或 PillValue[]；progress 是 ProgressValue；streak 是板数或 StreakValue（A 股连板，#110）；auctionStep 是竞价点数组或 { points, prevClose }（A 股集合竞价台阶，#110）；limitStatus 是状态名或 { status, sealAmount, reason }；
   * board 是板块名、六位代码或 { code, name }（由代码判断板块，名称带 ST 的算 ST）；cnAmount 是元（数或十进制字符串，写成万 / 亿）；
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
}

export type ResolvedCell = {
  /** 屏幕上的字。 */
  text: string
  tone: GridTone | undefined
  /** 排序用的值。 */
  sort: string | number | undefined
  /** 类型决定的方向（pnl / change / side），渲染时用 ToneText；没有方向是 undefined。 */
  direction: 'up' | 'down' | 'flat' | undefined
  /** bar 列的带符号数值（条的长度按列的最大绝对值归一，由 DataGrid 在 barRatio 里算）；别的类型是 undefined。 */
  bar: number | undefined
  /** pill 列拆好的标签，没有标签是 undefined。 */
  pills: { label: string; tone: GridPillTone }[] | undefined
  /** progress 列的分子、分母与比例（分母不是正数时比例是 undefined）。 */
  progress: { done: number; total: number; ratio: number | undefined } | undefined
  /** streak 列：拆好的连板（取不到是 boards 为 null）、写法与文案，DataGrid 用 StreakBadge 画；别的类型是 undefined。 */
  streak: { value: StreakValue; form: 'boards' | 'promotion' | undefined; labels: StreakLabels } | undefined
  /** limitStatus 列：原样的值与文案，DataGrid 用 LimitStatus 画；别的类型是 undefined。 */
  limitStatus: { value: LimitStatusValue | undefined; labels: LimitStatusLabels } | undefined
  /** board 列：判断好的板块（取不到是 null）、写法与文案，DataGrid 用 BoardMark 画；别的类型是 undefined。 */
  board: { kind: BoardKind | null; display: 'cm' | 'name' | 'both'; labels: BoardMarkLabels } | undefined
  /** auctionStep 列：整理过的竞价点与昨收，DataGrid 用 AuctionStepSpark 画迷你台阶；别的类型是 undefined。 */
  auctionStep: { points: readonly AuctionPoint[]; prevClose: number | null } | undefined
  /** symbol 列拆好的两段。 */
  symbol:
    | { code: string; venue: string | undefined; name: string | undefined; icon: { src?: string } | undefined }
    | undefined
}

const NUMERIC: ReadonlySet<ColumnType> = new Set([
  'number',
  'price',
  'quantity',
  'pnl',
  'change',
  'bar',
  'progress',
  'cnAmount',
])

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
  let pills: ResolvedCell['pills']
  let progress: ResolvedCell['progress']
  let streak: ResolvedCell['streak']
  let limitStatus: ResolvedCell['limitStatus']
  let board: ResolvedCell['board']
  let auctionStep: ResolvedCell['auctionStep']
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
    case 'bar': {
      const number = toNumber(raw)
      const digits = format.digits ?? 2
      text = number === null ? DASH : `${signed(number, digits)}${format.suffix ? ` ${format.suffix}` : ''}`
      bar = number ?? undefined
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
    case 'board': {
      const kind = toBoardKind(raw as BoardInput)
      const labels = format.boardLabels ?? cnLabelsZh.board
      const display = format.boardDisplay ?? 'cm'
      board = { kind, display, labels }
      text = boardText(kind, labels, display)
      sort = boardSortKey(kind)
      break
    }
    case 'cnAmount': {
      const number = toNumber(raw)
      const size = format.cnAmount ?? {}
      text = number === null ? DASH : formatCnAmount(number, size, format.cnUnits)
      // 只有 signed（净流入这类有方向的金额）才着涨跌色；成交额、市值不着色。
      direction = number === null || !size.signed ? undefined : number > 0 ? 'up' : number < 0 ? 'down' : 'flat'
      sort = number ?? undefined
      break
    }
    case 'auctionStep': {
      // 值是竞价点数组，或 { points, prevClose }（有昨收才着涨跌色、才按涨跌幅排）。
      const input = raw as
        | readonly AuctionPoint[]
        | { points: readonly AuctionPoint[]; prevClose?: number | null }
        | null
        | undefined
      const points =
        (Array.isArray(input) ? input : (input as { points?: readonly AuctionPoint[] } | null | undefined)?.points) ??
        []
      const prevClose = Array.isArray(input)
        ? null
        : ((input as { prevClose?: number | null } | null | undefined)?.prevClose ?? null)
      const summary = auctionSummary(auctionSteps(points), prevClose)
      auctionStep = { points, prevClose }
      text = summary.last === null ? DASH : summary.last.toFixed(format.digits ?? 2)
      sort = summary.change ?? summary.last ?? undefined
      break
    }
    case 'symbol': {
      const value = raw as SymbolValue | null | undefined
      const code = typeof value === 'string' ? value : (value?.code ?? '')
      const venue = typeof value === 'object' && value !== null ? value.venue : undefined
      const obj = typeof value === 'object' && value !== null ? value : undefined
      symbol = code === '' ? undefined : { code, venue, name: obj?.name, icon: obj?.icon }
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
    bar,
    pills,
    progress,
    streak,
    limitStatus,
    board,
    auctionStep,
    symbol,
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
  const numeric =
    type !== undefined &&
    (NUMERIC.has(type) ||
      type === 'time' ||
      type === 'streak' ||
      type === 'limitStatus' ||
      type === 'auctionStep' ||
      type === 'board')
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
