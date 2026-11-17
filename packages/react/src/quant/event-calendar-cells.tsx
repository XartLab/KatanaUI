// SPDX-License-Identifier: MIT
// EventCalendar 的表格部分：四个类别的列集、一行的单元格、重要程度格条、经济事件的详情行。从 event-calendar.tsx 拆出（G5），行为与样子不变。
import { MoonIcon, SunIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { formatPercentChange, formatVolume } from '../lib/chart/format/index.ts'
import { Sparkline } from '../katana/sparkline.tsx'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import {
  minutesUntil,
  surprisePercent,
  toneOfSign,
  type CalendarCategory,
  type DividendEvent,
  type EarningsEvent,
  type EconomicEvent,
  type EconomicImportance,
  type IpoEvent,
} from './event-calendar-model.ts'
import type { CalendarItem, EventCalendarLabels } from './event-calendar-types.ts'

export const DASH = '—'
export const EMPTY: readonly CalendarItem[] = []
// 表头排序（TradingView 财报、分红页：点指标列头排序）：只给有数字的列；在每一天内排，缺值排最后；点一次降序、再点升序、第三次回到按时间。
export type SortKey = 'marketCap' | 'yield' | 'amount'
export const SORT_VALUE: Record<SortKey, (item: CalendarItem) => number | undefined> = {
  marketCap: (item) => (item as EarningsEvent).marketCap,
  yield: (item) => (item as DividendEvent).yield,
  amount: (item) => (item as DividendEvent).amount,
}
const LEVELS: readonly EconomicImportance[] = [1, 2, 3]
export const COLS: Record<CalendarCategory, string> = {
  economic: '76px 150px 28px minmax(160px, 1fr) 84px 72px 72px',
  earnings: 'minmax(240px, 1fr) 72px 72px 88px 96px 96px 88px 104px',
  dividends: 'minmax(180px, 1fr) 88px 72px 104px',
  ipo: 'minmax(180px, 1fr) 80px 120px 84px 84px 72px',
}
export type Col = { label: string; numeric?: boolean; sort?: SortKey; head: boolean }

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

/** 四个类别各自的列：前面不带列名的列（日期分隔行的标题占它们），其余各带列名；数字列右对齐、可排序的带 sort。 */
export function calendarColumns(active: CalendarCategory, labels: EventCalendarLabels): readonly Col[] {
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
}

/** 单元格要的上下文：当前类别、文案、现在、两个格式器、展开着的那行。 */
export type CellContext = {
  active: CalendarCategory
  labels: EventCalendarLabels
  now: number
  clock: Intl.DateTimeFormat
  dateOnly: Intl.DateTimeFormat
  openId: string | null
  toggleOpen: (id: string) => void
}

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

/** 一行的单元格（按当前类别的列集）；repeat：经济事件同一时间同一国家的后续行，时间与国家留空。 */
export function rowCells(item: CalendarItem, repeat: boolean, ctx: CellContext): ReactNode {
  const { active, labels, now, clock, dateOnly, openId, toggleOpen } = ctx
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
          {hasDetail(active, event) ? (
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

/** 经济事件有说明、来源、历史值或下次发布时间之一，才能点开详情。 */
export function hasDetail(active: CalendarCategory, item: CalendarItem): boolean {
  return (
    active === 'economic' &&
    ['description', 'source', 'history', 'nextAt'].some((key) => (item as EconomicEvent)[key as 'source'] !== undefined)
  )
}

/** 经济事件点开的详情行：说明、来源、下次发布、历史值小图。 */
export const economicDetail = (event: EconomicEvent, labels: EventCalendarLabels, dateTime: Intl.DateTimeFormat) => (
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
