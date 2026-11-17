// SPDX-License-Identifier: MIT
import { DateFormatter, parseDate } from '@internationalized/date'
import { ChevronLeftIcon, ChevronRightIcon, CrownIcon } from 'lucide-react'
import { Fragment, useMemo, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { RowActions, RowContextMenu } from '../quotes/row-actions.tsx'
import {
  ECONOMIC_CATEGORIES,
  dayKeyOf,
  filterEvents,
  groupByDay,
  nowIndex,
  releaseState,
  addDays,
  weekDays,
  type CalendarCategory,
  type EarningsEvent,
  type EconomicCategory,
  type EconomicEvent,
} from './event-calendar-model.ts'
import {
  COLS,
  EMPTY,
  SORT_VALUE,
  calendarColumns,
  economicDetail,
  hasDetail as hasDetailIn,
  rowCells,
  type CellContext,
  type SortKey,
} from './event-calendar-cells.tsx'
import { RegionPicker } from './event-calendar-regions.tsx'
import type { CalendarItem, EventCalendarProps } from './event-calendar-types.ts'

export type { CalendarItem, EarningsLink, EventCalendarLabels, EventCalendarProps } from './event-calendar-types.ts'

// 日历：经济 / 财报 / 分红 / IPO 四个类别药丸，同一件、不同列集；周条（周一到周日七张日卡，每张列出当天各类别的条数）选日；日期分隔行粘顶、表头的数字列名写在它右侧，今天那天插一条「现在」线。
// 布局与信息结构照 TradingView 日历（主会话 2026-11-15 登录态实测 tradingview.com/economic-calendar/ 与 /earnings-calendar/；帮助中心「Economic Calendar」同日读，出处与差异见 packages/react/docs/tv-parity.md）：
// 导航行（今天、选日期、按周翻页、范围文字、重要性开关、国家选择框、时区读数），周条，类别药丸 + 重要性单开关 + 「全部类别」下拉（12 类，单选），国家是模态框（搜索、两个预设、按地区分组两列复选、取消 / 应用）。
// 经济表：同一时间同一国家的多条合并（时间与国家只在组首行写，组间粗分隔）；列是时间、国旗 + 国名、重要程度条、事件、实际（加粗）、预期、前值；实际值不上涨跌色（TradingView 如此）；缺值「—」。
// 财报表：时段图标（太阳盘前、月亮盘后）+ 时间、徽标、代码胶囊、公司名，列是预期 / 实际 EPS、EPS 意外、预期 / 实际营收、营收意外、市值；只有两个意外列上涨跌色；营收与市值后带币种小字；行下可选一行动作（财报材料、电话会，调用方给链接才有）。
// 比 TradingView 多的：经济事件行点开详情（TradingView 点行无变化）、财报 / 分红按列头排序。表格手感同连板天梯。橙色不画数据。
// 「现在」「时区」由调用方传，件里不读时钟。文字全由调用方传，包里没有语言。悬停行的操作用 RowActions（浮在行上、不占列宽）。
// 筛选状态在件里（不受控）：类别、选中的那天、重要性、经济类别、国家。

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
      // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
      events: d.events.toSorted((a, b) => {
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
  // 周条与范围文字只拿「天」格式化：日历日按 UTC 零点转成时刻、再按 UTC 写，时区不会把日期推到前后一天。
  const dayFormat = (key: string, options: Intl.DateTimeFormatOptions) =>
    new DateFormatter(locale, { timeZone: 'UTC', ...options }).format(parseDate(key).toDate('UTC'))

  const timed = active === 'economic' || active === 'earnings'
  const columns = calendarColumns(active, labels)
  // 日期分隔行：标题占前面不带列名的列，其余的列名各占自己那一列。
  const lead = Math.max(
    1,
    columns.findIndex((c) => c.head),
  )

  const hasDetail = (item: CalendarItem) => hasDetailIn(active, item)
  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }
  const cellContext: CellContext = { active, labels, now, clock, dateOnly, openId, toggleOpen }

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
          {rowCells(item, repeat, cellContext)}
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
        {expandable && openId === item.id && economicDetail(item as EconomicEvent, labels, dateTime)}
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
        <RegionPicker
          value={regions}
          onValueChange={setRegions}
          options={regionOptions}
          topRegions={topRegions}
          labels={labels}
        />
        <span className="k-ecal-count" aria-live="polite">
          {labels.count(visible.length)}
        </span>
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
