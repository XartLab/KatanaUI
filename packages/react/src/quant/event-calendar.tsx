// SPDX-License-Identifier: MIT
import { useMemo, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { Switch } from '../primitives/switch.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { RowActions, RowContextMenu, type RowAction } from '../patterns/row-actions.tsx'
import { ChipGroup } from '../patterns/chip-group.tsx'
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
import {
  dayKeyOf,
  filterEvents,
  groupByDay,
  minutesUntil,
  presetRange,
  type EconomicEvent,
  type EconomicImportance,
  type EconomicRangeKey,
  type DayRange,
} from './event-calendar-model.ts'

// 经济日历：按日分组的事件表，列是时间、国家 / 地区、事件、重要程度（1–3 格条）、实际 / 预期 / 前值。
// 功能参照 TradingView 的经济日历（帮助文档：按日期与重要程度、国家筛选，实际值对预期上色，2026-11-15 读，只取功能），卡片结构参照 Arc UI（uiarc.dev）；实现原创。
// 表格手感同连板天梯（无衬线加 tabular-nums、数字右对齐、紧凑行、极淡分隔线）。重要程度用亮度格条，不上色；橙色不画数据，只给选中。
// 实际值好于预期用涨色、差于预期用跌色：好坏方向由调用方按事件给（tone），件不懂 CPI 高是好是坏。未公布写「—」，还没到点的写倒计时。
// 「现在」「时区」由调用方传，件里不读时钟；文字全由调用方传，包里没有语言。悬停行的操作用 RowActions（浮在行上、不占列宽），项由调用方给。
// 筛选状态在件里（不受控）：区间、重要程度、国家、只看高重要。

export type EventCalendarLabels = {
  list: string
  empty: string
  range: Record<EconomicRangeKey, string>
  rangeGroup: string
  importanceGroup: string
  importanceClear: string
  /** 重要程度芯片与格条读屏名，例「重要程度 2」。 */
  importance: (level: EconomicImportance) => string
  /** 国家多选：触发器没选时的字、搜索占位、没有结果、全部清除。 */
  regionsAll: string
  regionsPlaceholder: string
  regionsEmpty: string
  /** 触发器选了几个时的字，例「2 个国家」。 */
  regionsCount: (n: number) => string
  onlyHigh: string
  today: string
  columns: {
    time: string
    region: string
    event: string
    importance: string
    actual: string
    forecast: string
    previous: string
  }
  /** 倒计时文字，例「45 分后」；参数是剩余分钟。 */
  countdown: (minutes: number) => string
  /** 自定义区间用的日期区间选择文案。 */
  dateRange: DateRangeLabels
  /** 一天的标题（「11月17日 周二」），由调用方按语言格式化。 */
  dayTitle: (day: string) => string
  count: (n: number) => string
  /** 行悬停按钮条与右键菜单的读屏名。 */
  rowActions: string
  rowMenu: string
}

export type EventCalendarProps = {
  events: readonly EconomicEvent[]
  labels: EventCalendarLabels
  /** 现在（毫秒时间戳）：今天 / 本周 / 下周与倒计时从它算；要倒计时走动，调用方定时更新它。 */
  now: number
  /** 显示时区（IANA）。 */
  timeZone: string
  /** 给时间格式与日期选择的语言（zh-CN）。 */
  locale: string
  defaultRange?: Exclude<EconomicRangeKey, 'custom'>
  /** 悬停（或键盘聚焦）一行时在行尾浮出的图标按钮（RowActions，#25），项与动作由调用方给。 */
  rowActions?: (event: EconomicEvent) => readonly RowAction[]
  className?: string
}

const DASH = '—'
const LEVELS: readonly EconomicImportance[] = [1, 2, 3]

export function EventCalendar({
  events,
  labels,
  now,
  timeZone,
  locale,
  defaultRange = 'week',
  rowActions,
  className,
}: EventCalendarProps) {
  const [rangeKey, setRangeKey] = useState<EconomicRangeKey>(defaultRange)
  const [custom, setCustom] = useState<DayRange | null>(null)
  const [importance, setImportance] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [regionsOpen, setRegionsOpen] = useState(false)
  const [onlyHigh, setOnlyHigh] = useState(false)

  const today = dayKeyOf(now, timeZone)
  const range = rangeKey === 'custom' ? (custom ?? presetRange('today', today)) : presetRange(rangeKey, today)

  const regionOptions = useMemo(() => {
    const map = new Map<string, EconomicEvent>()
    for (const event of events) if (!map.has(event.region)) map.set(event.region, event)
    return [...map.values()].sort((a, b) => a.regionName.localeCompare(b.regionName, locale))
  }, [events, locale])

  const visible = useMemo(
    () =>
      filterEvents(events, {
        range,
        importance: importance.map(Number) as EconomicImportance[],
        regions,
        onlyHigh,
        timeZone,
      }),
    [events, range, importance, regions, onlyHigh, timeZone],
  )
  const groups = groupByDay(visible, timeZone)
  const actionsFor = rowActions
    ? (id: string) => {
        const event = events.find((item) => item.id === id)
        return event ? rowActions(event) : []
      }
    : undefined
  const clock = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    [locale, timeZone],
  )

  return (
    <div className={cn('k-ecal', className)} data-slot="event-calendar">
      <div className="k-ecal-bar" data-slot="ecal-bar">
        <ToggleGroup
          variant="sm"
          aria-label={labels.rangeGroup}
          value={rangeKey}
          onValueChange={(next) => setRangeKey(next as EconomicRangeKey)}
        >
          {(['today', 'week', 'next', 'custom'] as const).map((key) => (
            <ToggleGroupItem key={key} value={key}>
              {labels.range[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {rangeKey === 'custom' && (
          <DateRangePicker value={custom} onValue={setCustom} today={today} labels={labels.dateRange} locale={locale} />
        )}
        <ChipGroup
          label={labels.importanceGroup}
          clearLabel={labels.importanceClear}
          items={LEVELS.map((level) => ({
            value: String(level),
            label: labels.importance(level),
            disabled: onlyHigh,
          }))}
          value={onlyHigh ? [] : importance}
          onValueChange={setImportance}
        />
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
        <label className="k-ecal-only">
          <Switch checked={onlyHigh} onCheckedChange={setOnlyHigh} aria-label={labels.onlyHigh} />
          <span>{labels.onlyHigh}</span>
        </label>
        <span className="k-ecal-count" aria-live="polite">
          {labels.count(visible.length)}
        </span>
      </div>

      <div className="k-ecal-columns" aria-hidden="true">
        <span>{labels.columns.time}</span>
        <span>{labels.columns.region}</span>
        <span>{labels.columns.event}</span>
        <span>{labels.columns.importance}</span>
        <span className="is-num">{labels.columns.actual}</span>
        <span className="is-num">{labels.columns.forecast}</span>
        <span className="is-num">{labels.columns.previous}</span>
        <span />
      </div>

      {groups.length === 0 ? (
        <p className="k-ecal-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <RowContextMenu actionsFor={actionsFor} label={labels.rowMenu}>
          <div className="k-ecal-list" role="table" aria-label={labels.list}>
            {groups.map((group) => (
              <div key={group.day} role="rowgroup" className="k-ecal-day" data-day={group.day}>
                <div className="k-ecal-day-head" role="row" data-slot="ecal-day-head">
                  <span role="columnheader">
                    {labels.dayTitle(group.day)}
                    {group.day === today && <span className="k-ecal-today">{labels.today}</span>}
                  </span>
                </div>
                {group.events.map((event) => {
                  const wait = event.actual === undefined ? minutesUntil(event.at, now) : null
                  return (
                    <div
                      key={event.id}
                      role="row"
                      tabIndex={0}
                      className="k-ecal-row k-row-host"
                      data-slot="ecal-row"
                      data-id={event.id}
                      data-code={event.id}
                      data-importance={event.importance}
                    >
                      <span role="cell" className="k-ecal-time">
                        {clock.format(event.at)}
                      </span>
                      <span role="cell" className="k-ecal-region" title={event.regionName}>
                        <SymbolMark code={event.region} name={event.regionName} src={event.flag} size={16} />
                      </span>
                      <span role="cell" className="k-ecal-name">
                        {event.name}
                      </span>
                      <span
                        role="cell"
                        className="k-ecal-level"
                        data-slot="ecal-level"
                        data-level={event.importance}
                        aria-label={labels.importance(event.importance)}
                      >
                        {LEVELS.map((level) => (
                          <i key={level} className={level <= event.importance ? 'is-on' : undefined} />
                        ))}
                      </span>
                      <span role="cell" className="k-ecal-num k-ecal-actual" data-tone={event.tone}>
                        {event.actual ?? DASH}
                        {wait !== null && <small className="k-ecal-wait">{labels.countdown(wait)}</small>}
                      </span>
                      <span role="cell" className="k-ecal-num">
                        {event.forecast ?? DASH}
                      </span>
                      <span role="cell" className="k-ecal-num">
                        {event.previous ?? DASH}
                      </span>
                      {rowActions && (
                        <RowActions items={rowActions(event)} label={labels.rowActions} focusable={false} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </RowContextMenu>
      )}
    </div>
  )
}
