// SPDX-License-Identifier: MIT
import { Fragment, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Sparkline } from '../katana/sparkline.tsx'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { RowActions, RowContextMenu, type RowAction } from '../patterns/row-actions.tsx'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '../patterns/combobox.tsx'
import { DateRangePicker, type DateRangeLabels } from '../patterns/date-range-picker.tsx'
import { formatVolume } from './format/index.ts'
import {
  dayKeyOf,
  eventTone,
  filterEvents,
  groupByDay,
  minutesUntil,
  nowIndex,
  presetRange,
  releaseState,
  surpriseTone,
  type CalendarCategory,
  type DayRange,
  type DividendEvent,
  type EarningsEvent,
  type EarningsSession,
  type EconomicEvent,
  type EconomicImportance,
  type EconomicRangeKey,
  type EconomicTone,
  type IpoEvent,
} from './event-calendar-model.ts'

// 日历：经济 / 财报 / 分红 / IPO 四个类别页签，同一件、不同列集；每页按日分组，日期分隔行粘顶，今天那天插一条「现在」线。
// 功能与信息结构参照 TradingView 的日历（2026-11-15 读，只取功能，出处与没读到的部分见 packages/react/docs/tv-parity.md）：
// 经济日历的列是时间、国家、重要程度条、事件、实际、预期、前值，上面有 昨天 / 今天 / 明天 / 本周 / 下周 的区间、国家多选、重要程度；
// 财报列是预期 EPS、实际 EPS、市值（TradingView 另有「意外」列，我们用文字色表示实际对预期的好坏，不另占列，待核对再加）；分红列是每股金额、除权日、派息日、股息率；IPO 列是交易所、价格、股数、募资额、状态。
// 表格手感同连板天梯（无衬线加 tabular-nums、数字右对齐、紧凑行、极淡分隔线）。重要程度用 3 格亮度条，不上色；橙色不画数据。
// 实际值好于预期用涨色、差于预期用跌色，只上文字色：经济事件的好坏方向由调用方按事件给（tone，件不懂 CPI 高是好是坏）；财报 / 营收高于预期一律算好，件自己比。
// 行点开详情（只有经济事件，给了说明 / 来源 / 历史值 / 下次发布任一项才能点开）：说明、来源、历史值小图、下次发布时间，行内展开（TradingView 详情的位置待核对）。
// 「现在」「时区」由调用方传，件里不读时钟；时间列头带时区缩写。文字全由调用方传，包里没有语言。悬停行的操作用 RowActions（浮在行上、不占列宽）。
// 筛选状态在件里（不受控）：类别、区间、重要程度、国家。

export type CalendarItem = EconomicEvent | EarningsEvent | DividendEvent | IpoEvent

export type EventCalendarLabels = {
  list: string
  empty: string
  range: Record<EconomicRangeKey, string>
  rangeGroup: string
  categoryGroup: string
  category: Record<CalendarCategory, string>
  importanceGroup: string
  /** 重要程度按钮与格条的读屏名，例「重要程度 2」。 */
  importance: (level: EconomicImportance) => string
  /** 国家多选：触发器没选时的字、搜索占位、没有结果。 */
  regionsAll: string
  regionsPlaceholder: string
  regionsEmpty: string
  /** 触发器选了几个时的字，例「2 个国家」。 */
  regionsCount: (n: number) => string
  today: string
  /** 「现在」线上的字。 */
  now: string
  columns: {
    time: string
    region: string
    event: string
    importance: string
    actual: string
    forecast: string
    previous: string
  }
  earningsColumns: {
    time: string
    company: string
    epsActual: string
    epsForecast: string
    revenueActual: string
    revenueForecast: string
    marketCap: string
  }
  dividendColumns: { company: string; amount: string; yield: string; payDate: string }
  ipoColumns: {
    company: string
    exchange: string
    priceRange: string
    shares: string
    dealSize: string
    status: string
  }
  /** 财报的披露时段。 */
  session: Record<EarningsSession, string>
  /** 倒计时文字，例「45 分后」；参数是剩余分钟。 */
  countdown: (minutes: number) => string
  /** 自定义区间用的日期区间选择文案。 */
  dateRange: DateRangeLabels
  /** 一天的标题（「11月17日 周二」），由调用方按语言格式化。 */
  dayTitle: (day: string) => string
  count: (n: number) => string
  /** 行详情：小标题与历史值读屏名。 */
  detail: {
    description: string
    source: string
    history: string
    /** 历史值小图的读屏名，参数是期数。 */
    historyLabel: (n: number) => string
    nextRelease: string
  }
  /** 行悬停按钮条与右键菜单的读屏名。 */
  rowActions: string
  rowMenu: string
}

export type EventCalendarProps = {
  /** 经济事件。 */
  events: readonly EconomicEvent[]
  /** 给了哪一类，就多出哪一个页签；只给 events 时不画页签。 */
  earnings?: readonly EarningsEvent[]
  dividends?: readonly DividendEvent[]
  ipos?: readonly IpoEvent[]
  labels: EventCalendarLabels
  /** 现在（毫秒时间戳）：今天 / 本周 / 下周与倒计时、「现在」线从它算；要走动，调用方定时更新它。 */
  now: number
  /** 显示时区（IANA）。 */
  timeZone: string
  /** 给时间格式与日期选择的语言（zh-CN）。 */
  locale: string
  /** 起始区间，默认今天（TradingView 日历页头默认「今天」）。 */
  defaultRange?: Exclude<EconomicRangeKey, 'custom'>
  defaultCategory?: CalendarCategory
  /** 悬停（或键盘聚焦）一行时在行尾浮出的图标按钮（RowActions），项与动作由调用方给；第二个参数是这行所在的类别。 */
  rowActions?: (event: CalendarItem, category: CalendarCategory) => readonly RowAction[]
  className?: string
}

const DASH = '—'
// 表头排序（TradingView 财报、分红页：点指标列头排序）：只给有数字的列；在每一天内排，缺值排最后；点一次降序、再点升序、第三次回到按时间。
type SortKey = 'marketCap' | 'yield' | 'amount'
const SORT_VALUE: Record<SortKey, (item: CalendarItem) => number | undefined> = {
  marketCap: (item) => (item as EarningsEvent).marketCap,
  yield: (item) => (item as DividendEvent).yield,
  amount: (item) => (item as DividendEvent).amount,
}
const EMPTY: readonly CalendarItem[] = []
const LEVELS: readonly EconomicImportance[] = [1, 2, 3]
const RANGES = ['yesterday', 'today', 'tomorrow', 'week', 'next', 'custom'] as const
const COLS: Record<CalendarCategory, string> = {
  economic: '76px 36px minmax(160px, 1fr) 44px 84px 64px 64px',
  earnings: '76px minmax(180px, 1fr) 64px 64px 84px 84px 84px',
  dividends: 'minmax(180px, 1fr) 88px 72px 104px',
  ipo: 'minmax(180px, 1fr) 80px 120px 84px 84px 72px',
}

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
  defaultRange = 'today',
  defaultCategory = 'economic',
  rowActions,
  className,
}: EventCalendarProps) {
  const [category, setCategory] = useState<CalendarCategory>(defaultCategory)
  const [rangeKey, setRangeKey] = useState<EconomicRangeKey>(defaultRange)
  const [custom, setCustom] = useState<DayRange | null>(null)
  const [importance, setImportance] = useState<EconomicImportance[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [regionsOpen, setRegionsOpen] = useState(false)
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

  const today = dayKeyOf(now, timeZone)
  const range = useMemo(
    () => (rangeKey === 'custom' ? (custom ?? presetRange('today', today)) : presetRange(rangeKey, today)),
    [rangeKey, custom, today],
  )

  const regionOptions = useMemo(() => {
    const map = new Map<string, CalendarItem>()
    for (const event of items) if (!map.has(event.region)) map.set(event.region, event)
    return [...map.values()].sort((a, b) => a.regionName.localeCompare(b.regionName, locale))
  }, [items, locale])

  const visible = useMemo(
    () => filterEvents(items, { range, importance, regions, timeZone }),
    [items, range, importance, regions, timeZone],
  )
  const groups = useMemo(() => {
    const days = groupByDay(visible, timeZone)
    if (!sort) return days
    const value = SORT_VALUE[sort.key]
    const sign = sort.dir === 'desc' ? -1 : 1
    return days.map((day) => ({
      ...day,
      events: [...day.events].sort((a, b) => {
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

  const timed = active === 'economic' || active === 'earnings'
  const columns: readonly (readonly [string, boolean, SortKey?])[] = (() => {
    if (active === 'economic') {
      const c = labels.columns
      return [
        [`${c.time}${zoneName ? ` (${zoneName})` : ''}`, false],
        [c.region, false],
        [c.event, false],
        [c.importance, false],
        [c.actual, true],
        [c.forecast, true],
        [c.previous, true],
      ] as const
    }
    if (active === 'earnings') {
      const c = labels.earningsColumns
      return [
        [`${c.time}${zoneName ? ` (${zoneName})` : ''}`, false],
        [c.company, false],
        [c.epsActual, true],
        [c.epsForecast, true],
        [c.revenueActual, true],
        [c.revenueForecast, true],
        [c.marketCap, true, 'marketCap'],
      ] as const
    }
    if (active === 'dividends') {
      const c = labels.dividendColumns
      return [
        [c.company, false],
        [c.amount, true, 'amount'],
        [c.yield, true, 'yield'],
        [c.payDate, true],
      ] as const
    }
    const c = labels.ipoColumns
    return [
      [c.company, false],
      [c.exchange, false],
      [c.priceRange, true],
      [c.shares, true],
      [c.dealSize, true],
      [c.status, false],
    ] as const
  })()

  const company = (item: { code?: string; name: string; logo?: string; regionName: string }) => (
    <span role="cell" className="k-ecal-company" title={item.regionName}>
      <SymbolMark code={item.code ?? item.name} name={item.name} src={item.logo} size={18} />
      <span className="k-ecal-code">{item.code ?? item.name}</span>
      {item.code && <span className="k-ecal-sub">{item.name}</span>}
    </span>
  )
  const money = (value: number | undefined, currency = '') => (value === undefined ? DASH : `${currency}${value}`)
  const cell = (key: string, content: ReactNode, tone?: EconomicTone, extra?: string) => (
    <span key={key} role="cell" className={cn('k-ecal-num', extra)} data-tone={tone === 'flat' ? undefined : tone}>
      {content}
    </span>
  )

  const cells = (item: CalendarItem): ReactNode => {
    if (active === 'economic') {
      const event = item as EconomicEvent
      const wait = event.actual === undefined ? minutesUntil(event.at, now) : null
      const tone = eventTone(event)
      return (
        <>
          <span role="cell" className="k-ecal-time">
            {clock.format(event.at)}
          </span>
          <span role="cell" className="k-ecal-region" title={event.regionName}>
            <SymbolMark code={event.region} name={event.regionName} src={event.flag} size={16} />
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
          <span role="cell">
            <LevelBars level={event.importance} label={labels.importance(event.importance)} />
          </span>
          <span role="cell" className="k-ecal-num k-ecal-actual" data-tone={tone}>
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
      return (
        <>
          <span role="cell" className="k-ecal-time">
            {e.session ? labels.session[e.session] : clock.format(e.at)}
          </span>
          {company(e)}
          {cell('ea', num(e.epsActual, eps), surpriseTone(e.epsActual, e.epsForecast), 'k-ecal-actual')}
          {cell('ef', num(e.epsForecast, eps))}
          {cell(
            'ra',
            num(e.revenueActual, formatVolume),
            surpriseTone(e.revenueActual, e.revenueForecast),
            'k-ecal-actual',
          )}
          {cell('rf', num(e.revenueForecast, formatVolume))}
          {cell('mc', num(e.marketCap, formatVolume))}
        </>
      )
    }
    if (active === 'dividends') {
      const d = item as DividendEvent
      return (
        <>
          {company(d)}
          {cell('am', money(d.amount, d.currency))}
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

  const hasDetail = (item: CalendarItem): boolean =>
    active === 'economic' &&
    ['description', 'source', 'history', 'nextAt'].some((key) => (item as EconomicEvent)[key as 'source'] !== undefined)

  const toggleOpen = (id: string) => setOpenId((prev) => (prev === id ? null : id))

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

  const row = (item: CalendarItem) => {
    const expandable = hasDetail(item)
    const state = active === 'economic' ? releaseState(item as EconomicEvent, now) : undefined
    return (
      <div
        key={item.id}
        role="row"
        tabIndex={0}
        className="k-ecal-row k-row-host"
        data-slot="ecal-row"
        data-id={item.id}
        data-code={item.id}
        data-importance={'importance' in item ? item.importance : undefined}
        data-state={state}
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
        {cells(item)}
        {rowActions && (
          <RowActions items={rowActions(item, active)} label={labels.rowActions} role="cell" focusable={false} />
        )}
      </div>
    )
  }

  const nowLine = (
    <div role="row" className="k-ecal-now" data-slot="ecal-now">
      <span role="cell">
        {labels.now} {clock.format(now)}
      </span>
    </div>
  )

  return (
    <Tabs
      value={active}
      onValueChange={(next) => {
        setCategory(next as CalendarCategory)
        setRegions([])
        setOpenId(null)
        setSort(null)
      }}
      className={cn('k-ecal', className)}
      data-slot="event-calendar"
      style={{ ['--ecal-cols' as string]: COLS[active] }}
    >
      {categories.length > 1 && (
        <TabsList aria-label={labels.categoryGroup} className="k-ecal-tabs" data-slot="ecal-tabs">
          {categories.map((key) => (
            <TabsTrigger key={key} value={key}>
              {labels.category[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      <div className="k-ecal-bar" data-slot="ecal-bar">
        <ToggleGroup
          variant="sm"
          aria-label={labels.rangeGroup}
          value={rangeKey}
          onValueChange={(next) => setRangeKey(next as EconomicRangeKey)}
        >
          {RANGES.map((key) => (
            <ToggleGroupItem key={key} value={key}>
              {labels.range[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {rangeKey === 'custom' && (
          <DateRangePicker value={custom} onValue={setCustom} today={today} labels={labels.dateRange} locale={locale} />
        )}
        {active === 'economic' && (
          <div role="group" aria-label={labels.importanceGroup} className="k-ecal-imp" data-slot="ecal-importance">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className="k-ecal-imp-btn"
                aria-pressed={importance.includes(level)}
                aria-label={labels.importance(level)}
                title={labels.importance(level)}
                onClick={() =>
                  setImportance((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]))
                }
              >
                <LevelBars level={level} />
              </button>
            ))}
          </div>
        )}
        <Combobox open={regionsOpen} onOpenChange={setRegionsOpen}>
          <ComboboxTrigger data-slot="ecal-regions" aria-label={labels.regionsAll} className="k-ecal-regions">
            {regions.length === 0 ? labels.regionsAll : labels.regionsCount(regions.length)}
          </ComboboxTrigger>
          <ComboboxContent label={labels.regionsAll}>
            <ComboboxInput placeholder={labels.regionsPlaceholder} />
            <ComboboxList>
              <ComboboxEmpty>{labels.regionsEmpty}</ComboboxEmpty>
              {regionOptions.map((event) => {
                const selected = regions.includes(event.region)
                return (
                  <ComboboxItem
                    key={event.region}
                    value={event.regionName}
                    keywords={[event.region]}
                    selected={selected}
                    onSelect={() =>
                      setRegions((prev) =>
                        prev.includes(event.region) ? prev.filter((r) => r !== event.region) : [...prev, event.region],
                      )
                    }
                  >
                    <SymbolMark code={event.region} name={event.regionName} src={event.flag} size={16} />
                    <span>{event.regionName}</span>
                  </ComboboxItem>
                )
              })}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <span className="k-ecal-count" aria-live="polite">
          {labels.count(visible.length)}
        </span>
      </div>

      <TabsContent value={active} className="k-ecal-panel">
        <div className="k-ecal-columns" data-slot="ecal-columns">
          {columns.map(([text, numeric, sortKey]) =>
            sortKey ? (
              <button
                key={text}
                type="button"
                className="k-ecal-sort is-num"
                data-sort={sortKey}
                aria-sort={sort?.key === sortKey ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
                onClick={() =>
                  setSort((prev) =>
                    prev?.key !== sortKey
                      ? { key: sortKey, dir: 'desc' }
                      : prev.dir === 'desc'
                        ? { key: sortKey, dir: 'asc' }
                        : null,
                  )
                }
              >
                {text}
                <span aria-hidden="true">{sort?.key === sortKey ? (sort.dir === 'desc' ? '↓' : '↑') : ''}</span>
              </button>
            ) : (
              <span key={text} className={numeric ? 'is-num' : undefined} aria-hidden="true">
                {text}
              </span>
            ),
          )}
          <span />
        </div>

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
                        <span role="columnheader">
                          {labels.dayTitle(group.day)}
                          {group.day === today && <span className="k-ecal-today">{labels.today}</span>}
                        </span>
                      </div>
                      {group.events.map((item, index) => (
                        <Fragment key={item.id}>
                          {index === at && nowLine}
                          {row(item)}
                          {hasDetail(item) && openId === item.id && detail(item as EconomicEvent)}
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
      </TabsContent>
    </Tabs>
  )
}
