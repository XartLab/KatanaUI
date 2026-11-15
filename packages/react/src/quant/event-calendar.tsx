// SPDX-License-Identifier: MIT
import { ChevronLeftIcon, ChevronRightIcon, CrownIcon, MoonIcon, SunIcon } from 'lucide-react'
import { Fragment, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Sparkline } from '../katana/sparkline.tsx'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { Button } from '../primitives/button.tsx'
import { Checkbox } from '../primitives/checkbox.tsx'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog.tsx'
import { Input } from '../primitives/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { RowActions, RowContextMenu, type RowAction } from '../patterns/row-actions.tsx'
import { formatPercentChange, formatVolume } from './format/index.ts'
import {
  ECONOMIC_CATEGORIES,
  dayKeyOf,
  filterEvents,
  groupByDay,
  minutesUntil,
  nowIndex,
  releaseState,
  surprisePercent,
  toneOfSign,
  addDays,
  weekDays,
  type CalendarCategory,
  type DividendEvent,
  type EarningsEvent,
  type EarningsSession,
  type EconomicCategory,
  type EconomicEvent,
  type EconomicImportance,
  type IpoEvent,
} from './event-calendar-model.ts'

// 日历：经济 / 财报 / 分红 / IPO 四个类别药丸，同一件、不同列集；周条（周一到周日七张日卡，每张列出当天各类别的条数）选日；日期分隔行粘顶、表头的数字列名写在它右侧，今天那天插一条「现在」线。
// 布局与信息结构照 TradingView 日历（主会话 2026-11-15 登录态实测 tradingview.com/economic-calendar/ 与 /earnings-calendar/；帮助中心「Economic Calendar」同日读，出处与差异见 packages/react/docs/tv-parity.md）：
// 导航行（今天、选日期、按周翻页、范围文字、重要性开关、国家选择框、时区读数），周条，类别药丸 + 重要性单开关 + 「全部类别」下拉（12 类，单选），国家是模态框（搜索、两个预设、按地区分组两列复选、取消 / 应用）。
// 经济表：同一时间同一国家的多条合并（时间与国家只在组首行写，组间粗分隔）；列是时间、国旗 + 国名、重要程度条、事件、实际（加粗）、预期、前值；实际值不上涨跌色（TradingView 如此）；缺值「—」。
// 财报表：时段图标（太阳盘前、月亮盘后）+ 时间、徽标、代码胶囊、公司名，列是预期 / 实际 EPS、EPS 意外、预期 / 实际营收、营收意外、市值；只有两个意外列上涨跌色；营收与市值后带币种小字；行下可选一行动作（财报材料、电话会，调用方给链接才有）。
// 比 TradingView 多的：经济事件行点开详情（TradingView 点行无变化）、财报 / 分红按列头排序。表格手感同连板天梯。橙色不画数据。
// 「现在」「时区」由调用方传，件里不读时钟。文字全由调用方传，包里没有语言。悬停行的操作用 RowActions（浮在行上、不占列宽）。
// 筛选状态在件里（不受控）：类别、选中的那天、重要性、经济类别、国家。

export type CalendarItem = EconomicEvent | EarningsEvent | DividendEvent | IpoEvent

export type EventCalendarLabels = {
  list: string
  empty: string
  nav: {
    today: string
    prevWeek: string
    nextWeek: string
    /** 选日期的原生日期框读屏名。 */
    pickDate: string
    /** 周条的读屏名。 */
    week: string
  }
  categoryGroup: string
  category: Record<CalendarCategory, string>
  /** 重要性单开关（按下 = 只看高重要）的读屏名与提示。 */
  highOnly: string
  /** 经济类别下拉：触发器读屏名、「全部类别」、各类的名字。 */
  economicCategory: { label: string; all: string; items: Record<EconomicCategory, string> }
  countries: {
    /** 触发按钮上没选时的字。 */
    all: string
    /** 选了几个时的字，例「2 个国家」。 */
    count: (n: number) => string
    title: string
    search: string
    entireWorld: string
    top: string
    /** 找不到时。 */
    empty: string
    /** 没写地区分组的国家归到这一组。 */
    otherGroup: string
    cancel: string
    apply: string
  }
  /** 「今天」小标。 */
  today: string
  /** 「现在」线上的字。 */
  now: string
  /** 重要程度格条的读屏名，例「重要程度 2」。 */
  importance: (level: EconomicImportance) => string
  columns: { actual: string; forecast: string; previous: string }
  earningsColumns: {
    epsEstimate: string
    epsActual: string
    epsSurprise: string
    revenueEstimate: string
    revenueActual: string
    revenueSurprise: string
    marketCap: string
  }
  dividendColumns: { amount: string; yield: string; payDate: string }
  ipoColumns: { exchange: string; priceRange: string; shares: string; dealSize: string; status: string }
  /** 财报的披露时段。 */
  session: Record<EarningsSession, string>
  /** 倒计时文字，例「45 分后」；参数是剩余分钟。 */
  countdown: (minutes: number) => string
  /** 一天的标题（「11月17日 周二」），由调用方按语言格式化。 */
  dayTitle: (day: string) => string
  count: (n: number) => string
  /** 行详情：小标题与历史值读屏名。 */
  detail: {
    description: string
    source: string
    history: string
    historyLabel: (n: number) => string
    nextRelease: string
  }
  rowActions: string
  rowMenu: string
}

export type EarningsLink = { key: string; label: string; href?: string; onSelect?: () => void }

export type EventCalendarProps = {
  /** 经济事件。 */
  events: readonly EconomicEvent[]
  /** 给了哪一类，就多出哪一个药丸；只给 events 时不画药丸。 */
  earnings?: readonly EarningsEvent[]
  dividends?: readonly DividendEvent[]
  ipos?: readonly IpoEvent[]
  labels: EventCalendarLabels
  /** 现在（毫秒时间戳）：今天与倒计时、「现在」线从它算；要走动，调用方定时更新它。 */
  now: number
  /** 显示时区（IANA）。 */
  timeZone: string
  /** 给时间与日期格式的语言（zh-CN）。 */
  locale: string
  /** 起始选中的那天（YYYY-MM-DD），默认今天。 */
  defaultDay?: string
  defaultCategory?: CalendarCategory
  /** 国家框里「前 20 大经济体」预设：给国家代码列表；不给就没有这个预设。 */
  topRegions?: readonly string[]
  /** 悬停（或键盘聚焦）一行时在行尾浮出的图标按钮（RowActions），项与动作由调用方给；第二个参数是这行所在的类别。 */
  rowActions?: (event: CalendarItem, category: CalendarCategory) => readonly RowAction[]
  /** 财报行下的一行小按钮（财报材料、电话会）：返回空数组就没有这一行。 */
  earningsLinks?: (event: EarningsEvent) => readonly EarningsLink[]
  className?: string
}

const DASH = '—'
const EMPTY: readonly CalendarItem[] = []
// 表头排序（TradingView 财报、分红页：点指标列头排序）：只给有数字的列；在每一天内排，缺值排最后；点一次降序、再点升序、第三次回到按时间。
type SortKey = 'marketCap' | 'yield' | 'amount'
const SORT_VALUE: Record<SortKey, (item: CalendarItem) => number | undefined> = {
  marketCap: (item) => (item as EarningsEvent).marketCap,
  yield: (item) => (item as DividendEvent).yield,
  amount: (item) => (item as DividendEvent).amount,
}
const LEVELS: readonly EconomicImportance[] = [1, 2, 3]
const COLS: Record<CalendarCategory, string> = {
  economic: '76px 150px 28px minmax(160px, 1fr) 84px 72px 72px',
  earnings: 'minmax(240px, 1fr) 72px 72px 88px 96px 96px 88px 104px',
  dividends: 'minmax(180px, 1fr) 88px 72px 104px',
  ipo: 'minmax(180px, 1fr) 80px 120px 84px 84px 72px',
}
type Col = { label: string; numeric?: boolean; sort?: SortKey; head: boolean }

function LevelBars({ level, label }: { level: EconomicImportance; label?: string }) {
  return (
    <span
      className="k-ecal-level"
      data-slot="ecal-level"
      data-level={level}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {LEVELS.map((n) => (
        <i key={n} className={n <= level ? 'is-on' : undefined} />
      ))}
    </span>
  )
}

const num = (value: number | undefined, text: (n: number) => string): string =>
  value === undefined ? DASH : text(value)
const eps = (n: number) => n.toFixed(2)

export function EventCalendar({
  events,
  earnings,
  dividends,
  ipos,
  labels,
  now,
  timeZone,
  locale,
  defaultDay,
  defaultCategory = 'economic',
  topRegions,
  rowActions,
  earningsLinks,
  className,
}: EventCalendarProps) {
  const today = dayKeyOf(now, timeZone)
  const [category, setCategory] = useState<CalendarCategory>(defaultCategory)
  const [day, setDay] = useState(defaultDay ?? today)
  const [highOnly, setHighOnly] = useState(false)
  const [econCategory, setEconCategory] = useState<EconomicCategory | ''>('')
  const [regions, setRegions] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'desc' | 'asc' } | null>(null)

  const sources: Record<CalendarCategory, readonly CalendarItem[] | undefined> = {
    economic: events,
    earnings,
    dividends,
    ipo: ipos,
  }
  const categories = (['economic', 'earnings', 'dividends', 'ipo'] as const).filter((key) => sources[key] !== undefined)
  const active: CalendarCategory = categories.includes(category) ? category : 'economic'
  const items = sources[active] ?? EMPTY

  const week = weekDays(day)

  // 周条：每天各类别（有数据的）还剩几条，按当前的国家 / 重要性 / 经济类别筛。
  const counts = useMemo(
    () =>
      week.map((d) =>
        categories
          .map(
            (key) =>
              [
                key,
                filterEvents(sources[key] ?? EMPTY, {
                  range: { start: d, end: d },
                  highOnly,
                  category: econCategory,
                  regions,
                  timeZone,
                }).length,
              ] as const,
          )
          .filter(([, n]) => n > 0),
      ),
    // oxlint-disable-next-line react/exhaustive-deps -- sources 与 categories 由四个 props 拼出，依赖写成那四个
    [week.join(), events, earnings, dividends, ipos, highOnly, econCategory, regions, timeZone],
  )

  const regionOptions = useMemo(() => {
    const map = new Map<string, CalendarItem>()
    for (const list of [events, earnings, dividends, ipos])
      for (const event of list ?? EMPTY) if (!map.has(event.region)) map.set(event.region, event)
    return [...map.values()].sort((a, b) => a.regionName.localeCompare(b.regionName, locale))
  }, [events, earnings, dividends, ipos, locale])

  const visible = useMemo(
    () => filterEvents(items, { range: { start: day, end: day }, highOnly, category: econCategory, regions, timeZone }),
    [items, day, highOnly, econCategory, regions, timeZone],
  )
  const groups = useMemo(() => {
    const days = groupByDay(visible, timeZone)
    if (!sort) return days
    const value = SORT_VALUE[sort.key]
    const sign = sort.dir === 'desc' ? -1 : 1
    return days.map((d) => ({
      ...d,
      events: [...d.events].sort((a, b) => {
        const [x, y] = [value(a), value(b)]
        if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? 1 : -1
        return (x - y) * sign
      }),
    }))
  }, [visible, timeZone, sort])
  const actionsFor = rowActions
    ? (id: string) => {
        const event = items.find((item) => item.id === id)
        return event ? rowActions(event, active) : []
      }
    : undefined
  const clock = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    [locale, timeZone],
  )
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone,
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    [locale, timeZone],
  )
  const dateOnly = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }),
    [locale, timeZone],
  )
  const zoneName = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')?.value,
    [locale, timeZone, now],
  )
  // 周条与范围文字只拿「天」格式化：用正午的 UTC 时刻，避免时区把日期推到前后一天。
  const dayFormat = (key: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options }).format(Date.parse(`${key}T12:00:00Z`))

  const timed = active === 'economic' || active === 'earnings'
  const columns: readonly Col[] = (() => {
    if (active === 'economic') {
      const c = labels.columns
      return [
        { label: '', head: false },
        { label: '', head: false },
        { label: '', head: false },
        { label: '', head: false },
        { label: c.actual, numeric: true, head: true },
        { label: c.forecast, numeric: true, head: true },
        { label: c.previous, numeric: true, head: true },
      ]
    }
    if (active === 'earnings') {
      const c = labels.earningsColumns
      return [
        { label: '', head: false },
        { label: c.epsEstimate, numeric: true, head: true },
        { label: c.epsActual, numeric: true, head: true },
        { label: c.epsSurprise, numeric: true, head: true },
        { label: c.revenueEstimate, numeric: true, head: true },
        { label: c.revenueActual, numeric: true, head: true },
        { label: c.revenueSurprise, numeric: true, head: true },
        { label: c.marketCap, numeric: true, sort: 'marketCap', head: true },
      ]
    }
    if (active === 'dividends') {
      const c = labels.dividendColumns
      return [
        { label: '', head: false },
        { label: c.amount, numeric: true, sort: 'amount', head: true },
        { label: c.yield, numeric: true, sort: 'yield', head: true },
        { label: c.payDate, numeric: true, head: true },
      ]
    }
    const c = labels.ipoColumns
    return [
      { label: '', head: false },
      { label: c.exchange, head: true },
      { label: c.priceRange, numeric: true, head: true },
      { label: c.shares, numeric: true, head: true },
      { label: c.dealSize, numeric: true, head: true },
      { label: c.status, head: true },
    ]
  })()
  // 日期分隔行：标题占前面不带列名的列，其余的列名各占自己那一列。
  const lead = Math.max(
    1,
    columns.findIndex((c) => c.head),
  )

  const company = (item: { code?: string; name: string; logo?: string; regionName: string }, lead?: ReactNode) => (
    <span role="cell" className="k-ecal-company" title={item.regionName}>
      {lead}
      <SymbolMark code={item.code ?? item.name} name={item.name} src={item.logo} size={18} />
      {item.code && <span className="k-ecal-code">{item.code}</span>}
      <span className={item.code ? 'k-ecal-sub' : 'k-ecal-code'}>{item.name}</span>
    </span>
  )
  const cell = (key: string, content: ReactNode, tone?: string, extra?: string) => (
    <span key={key} role="cell" className={cn('k-ecal-num', extra)} data-tone={tone === 'flat' ? undefined : tone}>
      {content}
    </span>
  )
  const withUnit = (text: string, unit?: string) =>
    text === DASH || !unit ? (
      text
    ) : (
      <>
        {text} <small className="k-ecal-unit">{unit}</small>
      </>
    )
  const surprise = (value: number | undefined) => (value === undefined ? DASH : formatPercentChange(value))

  const cells = (item: CalendarItem, repeat: boolean): ReactNode => {
    if (active === 'economic') {
      const event = item as EconomicEvent
      const wait = event.actual === undefined ? minutesUntil(event.at, now) : null
      return (
        <>
          <span role="cell" className="k-ecal-time">
            {repeat ? '' : clock.format(event.at)}
          </span>
          <span role="cell" className="k-ecal-region" title={event.regionName}>
            {repeat ? null : (
              <>
                <SymbolMark code={event.region} name={event.regionName} src={event.flag} size={16} />
                <span>{event.regionName}</span>
              </>
            )}
          </span>
          <span role="cell">
            <LevelBars level={event.importance} label={labels.importance(event.importance)} />
          </span>
          <span role="cell" className="k-ecal-name">
            {hasDetail(event) ? (
              // aria-expanded 在 table 的行上不合法（只许 treegrid），挂在名字里的按钮上；键盘用行本身的 Enter / 空格，按钮不进 Tab 序。
              <button
                type="button"
                tabIndex={-1}
                className="k-ecal-name-btn"
                aria-expanded={openId === event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleOpen(event.id)
                }}
              >
                {event.name}
              </button>
            ) : (
              event.name
            )}
          </span>
          <span role="cell" className="k-ecal-num k-ecal-actual">
            {event.actual ?? DASH}
            {wait !== null && <small className="k-ecal-wait">{labels.countdown(wait)}</small>}
          </span>
          <span role="cell" className="k-ecal-num">
            {event.forecast ?? DASH}
          </span>
          <span role="cell" className="k-ecal-num">
            {event.previous ?? DASH}
          </span>
        </>
      )
    }
    if (active === 'earnings') {
      const e = item as EarningsEvent
      const epsPct = e.epsSurprise ?? surprisePercent(e.epsActual, e.epsForecast)
      const revPct = e.revenueSurprise ?? surprisePercent(e.revenueActual, e.revenueForecast)
      const session = e.session ? (
        <span
          className="k-ecal-session"
          title={labels.session[e.session]}
          role="img"
          aria-label={labels.session[e.session]}
        >
          {e.session === 'after' ? <MoonIcon size={13} aria-hidden="true" /> : <SunIcon size={13} aria-hidden="true" />}
        </span>
      ) : null
      return (
        <>
          {company(
            e,
            <>
              {session}
              <span className="k-ecal-time">{clock.format(e.at)}</span>
            </>,
          )}
          {cell('ef', num(e.epsForecast, eps))}
          {cell('ea', num(e.epsActual, eps), undefined, 'k-ecal-actual')}
          {cell('es', surprise(epsPct), toneOfSign(epsPct), 'k-ecal-surprise')}
          {cell('rf', withUnit(num(e.revenueForecast, formatVolume), e.currency))}
          {cell('ra', withUnit(num(e.revenueActual, formatVolume), e.currency), undefined, 'k-ecal-actual')}
          {cell('rs', surprise(revPct), toneOfSign(revPct), 'k-ecal-surprise')}
          {cell('mc', withUnit(num(e.marketCap, formatVolume), e.currency))}
        </>
      )
    }
    if (active === 'dividends') {
      const d = item as DividendEvent
      return (
        <>
          {company(d)}
          {cell('am', d.currency ? `${d.currency}${d.amount}` : String(d.amount))}
          {cell(
            'yl',
            num(d.yield, (n) => `${n.toFixed(2)}%`),
          )}
          {cell('pay', d.payAt === undefined ? DASH : dateOnly.format(d.payAt))}
        </>
      )
    }
    const p = item as IpoEvent
    const price =
      p.priceLow === undefined
        ? DASH
        : p.priceHigh === undefined || p.priceHigh === p.priceLow
          ? p.priceLow.toFixed(2)
          : `${p.priceLow.toFixed(2)} – ${p.priceHigh.toFixed(2)}`
    return (
      <>
        {company(p)}
        <span role="cell" className="k-ecal-sub-cell">
          {p.exchange ?? DASH}
        </span>
        {cell('pr', price)}
        {cell('sh', num(p.shares, formatVolume))}
        {cell('ds', num(p.dealSize, formatVolume))}
        <span role="cell" className="k-ecal-status">
          {p.status ?? DASH}
        </span>
      </>
    )
  }

  function hasDetail(item: CalendarItem): boolean {
    return (
      active === 'economic' &&
      ['description', 'source', 'history', 'nextAt'].some(
        (key) => (item as EconomicEvent)[key as 'source'] !== undefined,
      )
    )
  }
  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  const detail = (event: EconomicEvent) => (
    <div role="row" className="k-ecal-detail" data-slot="ecal-detail" data-for={event.id}>
      <div role="cell" className="k-ecal-detail-body">
        {event.description && (
          <p>
            <b>{labels.detail.description}</b>
            {event.description}
          </p>
        )}
        <dl>
          {event.source && (
            <div>
              <dt>{labels.detail.source}</dt>
              <dd>{event.source}</dd>
            </div>
          )}
          {event.nextAt !== undefined && (
            <div>
              <dt>{labels.detail.nextRelease}</dt>
              <dd className="k-ecal-next">{dateTime.format(event.nextAt)}</dd>
            </div>
          )}
        </dl>
        {event.history && event.history.length > 1 && (
          <div className="k-ecal-history">
            <b>{labels.detail.history}</b>
            <Sparkline
              values={event.history}
              tone="flat"
              label={labels.detail.historyLabel(event.history.length)}
              className="k-ecal-spark"
            />
          </div>
        )}
      </div>
    </div>
  )

  const row = (item: CalendarItem, previous?: CalendarItem) => {
    const expandable = hasDetail(item)
    const state = active === 'economic' ? releaseState(item as EconomicEvent, now) : undefined
    // 同一时间同一国家的经济事件合并：组首行写时间与国家，后面的行左边留空。
    const repeat =
      active === 'economic' && previous !== undefined && previous.at === item.at && previous.region === item.region
    const links = active === 'earnings' && earningsLinks ? earningsLinks(item as EarningsEvent) : []
    return (
      <Fragment key={item.id}>
        <div
          role="row"
          tabIndex={0}
          className="k-ecal-row k-row-host"
          data-slot="ecal-row"
          data-id={item.id}
          data-code={item.id}
          data-importance={'importance' in item ? item.importance : undefined}
          data-state={state}
          data-repeat={repeat || undefined}
          data-group-start={!repeat || undefined}
          data-expandable={expandable || undefined}
          onClick={expandable ? () => toggleOpen(item.id) : undefined}
          onKeyDown={
            expandable
              ? (event: KeyboardEvent<HTMLDivElement>) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    toggleOpen(item.id)
                  }
                }
              : undefined
          }
        >
          {cells(item, repeat)}
          {rowActions && (
            <RowActions items={rowActions(item, active)} label={labels.rowActions} role="cell" focusable={false} />
          )}
        </div>
        {links.length > 0 && (
          <div role="row" className="k-ecal-links" data-slot="ecal-links" data-for={item.id}>
            <div role="cell">
              {links.map((link) =>
                link.href ? (
                  <a key={link.key} className="k-ecal-link" href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ) : (
                  <button key={link.key} type="button" className="k-ecal-link" onClick={link.onSelect}>
                    {link.label}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
        {expandable && openId === item.id && detail(item as EconomicEvent)}
      </Fragment>
    )
  }

  const nowLine = (
    <div role="row" className="k-ecal-now" data-slot="ecal-now">
      <span role="cell">
        {labels.now} {clock.format(now)}
      </span>
    </div>
  )

  const openCountries = () => {
    setDraft(regions)
    setSearch('')
    setDialogOpen(true)
  }
  const needle = search.trim().toLowerCase()
  const shownRegions = regionOptions.filter(
    (r) => needle === '' || r.regionName.toLowerCase().includes(needle) || r.region.toLowerCase().includes(needle),
  )
  const regionGroups = (() => {
    const map = new Map<string, CalendarItem[]>()
    for (const r of shownRegions) {
      const key = r.regionGroup ?? labels.countries.otherGroup
      map.set(key, [...(map.get(key) ?? []), r])
    }
    return [...map]
  })()
  const toggleDraft = (code: string) =>
    setDraft((prev) => (prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]))
  const shiftWeek = (by: number) => setDay((prev) => addDays(prev, by * 7))

  return (
    <div
      className={cn('k-ecal', className)}
      data-slot="event-calendar"
      style={{ ['--ecal-cols' as string]: COLS[active] }}
    >
      <div className="k-ecal-nav" data-slot="ecal-nav">
        <Button size="sm" variant="ghost" onClick={() => setDay(today)}>
          {labels.nav.today}
        </Button>
        <input
          type="date"
          className="k-ecal-date"
          aria-label={labels.nav.pickDate}
          value={day}
          onChange={(event) => event.target.value && setDay(event.target.value)}
        />
        <Button size="icon" variant="ghost" aria-label={labels.nav.prevWeek} onClick={() => shiftWeek(-1)}>
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <Button size="icon" variant="ghost" aria-label={labels.nav.nextWeek} onClick={() => shiftWeek(1)}>
          <ChevronRightIcon aria-hidden="true" />
        </Button>
        <span className="k-ecal-range" data-slot="ecal-range">
          {dayFormat(week[0]!, { month: 'short', day: 'numeric' })} —{' '}
          {dayFormat(week[6]!, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="k-ecal-tz" data-slot="ecal-tz">
          {clock.format(now)} {zoneName ? `(${zoneName})` : ''}
        </span>
      </div>

      <div className="k-ecal-week" role="group" aria-label={labels.nav.week} data-slot="ecal-week">
        {week.map((d, i) => (
          <button
            key={d}
            type="button"
            className="k-ecal-daycard"
            data-day={d}
            data-today={d === today || undefined}
            aria-pressed={d === day}
            onClick={() => setDay(d)}
          >
            <span className="k-ecal-daycard-head">
              <span>{dayFormat(d, { weekday: 'short' })}</span>
              <b>{dayFormat(d, { day: 'numeric' })}</b>
            </span>
            {counts[i]!.map(([key, n]) => (
              <span key={key} className="k-ecal-daycard-line">
                {labels.category[key]} <b>{n}</b>
              </span>
            ))}
          </button>
        ))}
      </div>

      <div className="k-ecal-bar" data-slot="ecal-bar">
        {categories.length > 1 && (
          <div role="tablist" aria-label={labels.categoryGroup} className="k-ecal-pills" data-slot="ecal-tabs">
            {categories.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={key === active}
                className="k-ecal-pill"
                onClick={() => {
                  setCategory(key)
                  setOpenId(null)
                  setSort(null)
                }}
              >
                {labels.category[key]}
              </button>
            ))}
          </div>
        )}
        <span className="k-ecal-bar-gap" />
        {active === 'economic' && (
          <>
            <button
              type="button"
              className="k-ecal-high"
              data-slot="ecal-importance"
              aria-pressed={highOnly}
              aria-label={labels.highOnly}
              title={labels.highOnly}
              onClick={() => setHighOnly((v) => !v)}
            >
              <CrownIcon size={14} aria-hidden="true" />
            </button>
            <Select
              value={econCategory === '' ? 'all' : econCategory}
              onValueChange={(v) => setEconCategory(v === 'all' ? '' : (v as EconomicCategory))}
            >
              <SelectTrigger
                aria-label={labels.economicCategory.label}
                className="k-ecal-cat"
                data-slot="ecal-category"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.economicCategory.all}</SelectItem>
                {ECONOMIC_CATEGORIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {labels.economicCategory.items[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <Button size="sm" variant="ghost" className="k-ecal-regions" data-slot="ecal-regions" onClick={openCountries}>
          {regions.length === 0 ? labels.countries.all : labels.countries.count(regions.length)}
        </Button>
        <span className="k-ecal-count" aria-live="polite">
          {labels.count(visible.length)}
        </span>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent closeLabel={labels.countries.cancel} className="k-ecal-dialog">
          <DialogHeader>
            <DialogTitle>{labels.countries.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">{labels.countries.title}</DialogDescription>
          <DialogBody>
            <Input
              type="search"
              aria-label={labels.countries.search}
              placeholder={labels.countries.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="k-ecal-presets">
              <Button size="sm" variant="ghost" onClick={() => setDraft([])}>
                {labels.countries.entireWorld}
              </Button>
              {topRegions && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDraft(topRegions.filter((r) => regionOptions.some((o) => o.region === r)))}
                >
                  {labels.countries.top}
                </Button>
              )}
            </div>
            {regionGroups.length === 0 && <p className="k-ecal-empty">{labels.countries.empty}</p>}
            {regionGroups.map(([group, list]) => (
              <fieldset key={group} className="k-ecal-region-group">
                <legend>{group}</legend>
                <div className="k-ecal-region-grid">
                  {list.map((r) => (
                    <label key={r.region} className="k-ecal-region-item">
                      <Checkbox checked={draft.includes(r.region)} onCheckedChange={() => toggleDraft(r.region)} />
                      <SymbolMark code={r.region} name={r.regionName} src={r.flag} size={16} />
                      <span>{r.regionName}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {labels.countries.cancel}
            </Button>
            <Button
              onClick={() => {
                setRegions(draft)
                setDialogOpen(false)
              }}
            >
              {labels.countries.apply}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {groups.length === 0 ? (
        <p className="k-ecal-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <div className="k-ecal-scroll" data-slot="ecal-scroll">
          <RowContextMenu actionsFor={actionsFor} label={labels.rowMenu}>
            <div className="k-ecal-list" role="table" aria-label={labels.list}>
              {groups.map((group) => {
                const at = timed && group.day === today ? nowIndex(group.events, now) : -1
                return (
                  <div key={group.day} role="rowgroup" className="k-ecal-day" data-day={group.day}>
                    <div className="k-ecal-day-head" role="row" data-slot="ecal-day-head">
                      <span role="columnheader" style={{ gridColumn: `1 / span ${lead}` }}>
                        {labels.dayTitle(group.day)}
                        {group.day === today && <span className="k-ecal-today">{labels.today}</span>}
                      </span>
                      {columns.slice(lead).map((col, i) =>
                        col.sort ? (
                          <button
                            key={col.label}
                            type="button"
                            role="columnheader"
                            className="k-ecal-sort is-num"
                            style={{ gridColumn: lead + i + 1 }}
                            data-sort={col.sort}
                            aria-sort={
                              sort?.key === col.sort ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined
                            }
                            onClick={() => {
                              const key = col.sort!
                              setSort((prev) =>
                                !prev || prev.key !== key
                                  ? { key, dir: 'desc' }
                                  : prev.dir === 'desc'
                                    ? { key, dir: 'asc' }
                                    : null,
                              )
                            }}
                          >
                            <span aria-hidden="true">
                              {sort?.key === col.sort ? (sort.dir === 'desc' ? '↓' : '↑') : ''}
                            </span>
                            {col.label}
                          </button>
                        ) : (
                          <span
                            key={col.label}
                            role="columnheader"
                            className={col.numeric ? 'is-num' : undefined}
                            style={{ gridColumn: lead + i + 1 }}
                          >
                            {col.label}
                          </span>
                        ),
                      )}
                    </div>
                    {group.events.map((item, index) => (
                      <Fragment key={item.id}>
                        {index === at && nowLine}
                        {row(item, group.events[index - 1])}
                      </Fragment>
                    ))}
                    {at === group.events.length && nowLine}
                  </div>
                )
              })}
            </div>
          </RowContextMenu>
        </div>
      )}
    </div>
  )
}
