// SPDX-License-Identifier: MIT
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  Button as AriaButton,
  CalendarGrid,
  DateField,
  DateInput,
  DateSegment,
  Heading,
  I18nProvider,
  RangeCalendar,
  RangeCalendarStateContext,
  type DateSegmentProps,
} from 'react-aria-components'
import { CalendarDate } from '@internationalized/date'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { useCalendarEvents, type CalendarEventProps } from './calendar-events.tsx'
import {
  canApplyRange,
  matchPreset,
  NO_PICK,
  presetAvailable,
  presetRange,
  RANGE_PRESETS,
  rangeStatus,
  sameRange,
  toDay,
  type DateRange,
  type RangePick,
  type RangePreset,
  type WeekStart,
} from './date-range-model.ts'

// 功能参照 Arc Date range picker（uiarc.dev，2026-11-14 读：双月日历加预设），实现原创；样子沿用 DateTimeInput 的日历皮肤（theme/date-time.css 的 .k-cal*）加 theme/date-range.css。
// 行为底座是 react-aria-components 的 DateField 与 RangeCalendar（键盘、读屏、日期运算都是它的）。没有用它的整件 DateRangePicker：
// 整件自带 RAC 的 Popover，浮层材质、入场动效、静态预览（InlineOverlays）、焦点归还都是我们的 Popover 管，两个浮层体系并存会打架。
// 值是字符串（YYYY-MM-DD 一对，起止都含），按哪个时区解读由调用方定；今天由调用方传，件里不读时钟。
// 两种提交方式（commit）：immediate（默认，原来的行为）是点完终点、点预设就上报并收起；apply（#192）是「先挑、再应用」——
// 日历里的改动先放在草稿里，弹层脚上写状态（选第一天 / 已选 N 天）、有「清除」「应用」两颗钮，点「应用」才上报并收起，Esc 或点外面收起就丢掉草稿。
// 交互借自 Jamie Merrill 的 Date range picker（x.com/Jamie_Merrill/status/2120075066092462477，2026-11-24 逐帧看），只借交互，样子沿用本件原有的。
// 默认不改成 apply：apply 要四条新文案（没有后备语言，包里不写字），改默认等于让所有现有调用点编译不过、行为也变；调用方按需显式传 commit="apply"。

export type DateRangeLabels = {
  /** 起点、终点日期框的读屏名。 */
  start: string
  end: string
  /** 日历按钮的读屏名与日历弹层的名字。 */
  pickRange: string
  calendar: string
  previousMonth: string
  nextMonth: string
  /** 预设组的读屏名，与每个预设、「自定义」的字。 */
  presets: string
  preset: Readonly<Record<RangePreset, string>>
  custom: string
}

/** commit="apply" 时多要的文案：脚上的状态字与两颗钮。 */
export type DateRangeApplyLabels = {
  /** 状态字：还没点第一天。 */
  pickFirst: string
  /** 状态字：已选 days 天（含首尾，数的是日历上高亮的格数）。带数字的文案一律传函数，英文要在里面处理单复数（1 day / 3 days）。 */
  selected: (days: number) => string
  /** 脚上两颗钮的字。 */
  apply: string
  clear: string
}

type DateRangePickerBaseProps = {
export type DateRangePickerProps = CalendarEventProps & {
  /** The current range (inclusive YYYY-MM-DD pair); null means nothing picked. */
  value: DateRange | null
  /** Called with a valid range once both ends are filled and start ≤ end (typing, calendar or a preset). */
  onValueChange?: (range: DateRange) => void
  /** Old name of onValueChange, kept for one release. @deprecated Use onValueChange. */
  onValue?: (range: DateRange) => void
  /** 今天（YYYY-MM-DD，按应用的显示时区算好）：预设从它算。 */
  today: string
  /** 一周从哪天起，默认周一。 */
  weekStart?: WeekStart
  /** 能选的最早、最晚日期（YYYY-MM-DD）。 */
  min?: string
  max?: string
  /** 给 react-aria 的语言（日期各段的顺序）：中文界面 zh-CN，英文界面 en-CA。 */
  locale: string
  className?: string
}

export type DateRangePickerProps = DateRangePickerBaseProps &
  (
    | {
        /** immediate（默认）：点完终点、点预设就上报并收起。apply：改动先放草稿，点「应用」才上报并收起，Esc 或点外面丢掉草稿。 */
        commit?: 'immediate'
        labels: DateRangeLabels & Partial<DateRangeApplyLabels>
      }
    | { commit: 'apply'; labels: DateRangeLabels & DateRangeApplyLabels }
  )

function Segments({ segment }: { segment: DateSegmentProps['segment'] }) {
  if (segment.type === 'literal') {
    const text = segment.text.replace('/', '-').replace(/[⁦-⁩]/g, '')
    return text ? (
      <span className="k-dt-sep" aria-hidden="true">
        {text}
      </span>
    ) : null
  }
  return <DateSegment segment={segment} className="k-dt-seg" />
}

/** 挂在 RangeCalendar 里的桥：把日历内部的「起点 / 悬停预览」报给外面（脚上的状态字、日期框要跟着草稿走）。不画东西。 */
function PickBridge({ onPick }: { onPick: (pick: RangePick) => void }) {
  const state = useContext(RangeCalendarStateContext)
  const anchor = state?.anchorDate?.toString() ?? null
  const range = anchor ? state?.highlightedRange : null
  const from = range?.start.toString() ?? null
  const to = range?.end.toString() ?? null
  useEffect(() => {
    const next: RangePick = { anchor, preview: from && to ? { start: from, end: to } : null }
    onPick(next)
  }, [anchor, from, to, onPick])
  return null
}

// 比较两个挑选状态是否相同（setPick 的函数形式里用，相同就保持原对象）。
const samePick = (a: RangePick, b: RangePick) =>
  a.anchor === b.anchor && a.preview?.start === b.preview?.start && a.preview?.end === b.preview?.end

// 草稿里没有可定位的日子、调用方的 today 也不合法时的兜底（只是让日历有个起点，不代表「今天」）。
const FALLBACK_DAY = new CalendarDate(1970, 1, 1)

/** Date range field: two typed date fields, a two-month calendar and presets (today, this week, this month, year to date). */
export function DateRangePicker({
  value,
  onValueChange,
  onValue: legacyOnValue,
  today,
  weekStart = 'mon',
  min,
  max,
  commit = 'immediate',
  labels,
  locale,
  className,
  events,
  insight,
}: DateRangePickerProps) {
  const view = useCalendarEvents({ events, insight, locale, selected: value?.start })
  const onValue = (range: DateRange) => (onValueChange ?? legacyOnValue)?.(range)
  const apply = commit === 'apply'
  // 类型已保证 commit="apply" 时带齐了这几条文案；immediate 时它们可能没有，只在 apply 的分支里读。
  const text = labels as DateRangeLabels & DateRangeApplyLabels
  const [open, setOpen] = useState(false)
  // 两个框是分开打字的：只填了一头、或起点晚于终点时，先存在这里，凑成合法区间才上报。
  const [pending, setPending] = useState<{ start: CalendarDate | null; end: CalendarDate | null } | null>(null)
  // apply：草稿（点完终点或点预设后的完整区间）、日历里正在挑的状态（起点与悬停预览）、日历聚焦的日子（预设要能把日历带到它的月份）。
  const [draft, setDraft] = useState<DateRange | null>(null)
  const [pick, setPick] = useState<RangePick>(NO_PICK)
  const [focus, setFocus] = useState<CalendarDate>(FALLBACK_DAY)
  // 打开那一刻（以及草稿最后一次跟着外部值走时）的 value：草稿还等于它，就说明用户没动过。
  const [seed, setSeed] = useState<DateRange | null>(null)
  const live = apply && open
  const root = useRef<HTMLSpanElement>(null)
  const content = useRef<HTMLDivElement>(null)
  // 稳定的回调：PickBridge 的 effect 才不会随每次重画重跑；值没变就保持原对象，悬停挪一格不会白重画整件。
  const reportPick = useCallback((next: RangePick) => setPick((prev) => (samePick(prev, next) ? prev : next)), [])
  const minValue = toDay(min ?? '')
  const maxValue = toDay(max ?? '')
  // 框里显示什么：apply 打开着时跟着草稿走（点了起点：起点段落填好、终点仍是占位）；否则是值（或还没凑成区间的打字）。
  const shown = live
    ? pick.anchor
      ? { start: toDay(pick.anchor), end: null }
      : { start: draft ? toDay(draft.start) : null, end: draft ? toDay(draft.end) : null }
    : pending
      ? pending
      : { start: value ? toDay(value.start) : null, end: value ? toDay(value.end) : null }
  const { start, end } = shown
  const shownRange = live ? draft : value
  const active = matchPreset(shownRange, today, weekStart)
  const complete = start && end ? { start, end } : null

  // 弹层开着时外部改了 value（URL、别的面板、「回到今天」）：草稿没动过（还等于 seed）就跟着变，动过就保留用户的草稿；这时日历显示月与聚焦日都不动。
  // 在渲染里调整状态（React 文档里「根据 props 调整 state」的写法），不用 effect，免得框与状态字闪一帧旧值。
  // 正在日历里点选（点了起点还没点终点）也算动过：此时不跟、不挪聚焦与日历，否则 react-aria 会按新的聚焦日画预览，状态字（「已选 38 天」）就与框里只有起点对不上。
  // 这时也不更新 seed：用户放弃这次挑选、草稿回到没动过时，下一次渲染再跟上外部的新值。
  if (live && !pick.anchor && !sameRange(seed, value)) {
    setSeed(value)
    if (sameRange(draft, seed)) {
      setDraft(value)
      setPick(NO_PICK)
      setFocus((value && toDay(value.start)) || toDay(today) || FALLBACK_DAY)
    }
  }

  // 点日历里的格子、翻月钮之后，Radix 的「点外面收起」会吃掉第一次点外面：react-aria 的按压把 pointerdown 在 React 根上截住，
  // Radix 里「指针在弹层内」的标记没人复位，下一次点外面被当成内部点击（根上的修法是 #207：primitives/popover.tsx，修了就删这段）。
  // apply 下点外面要丢草稿，不能漏，所以在 document 捕获阶段自己收一道；immediate 也走它，所以 immediate 现在点外面一次就收（以前翻月后要点两次）。
  // 「里面」按实例判断：这一份弹层的节点（content ref）、自己的触发钮，以及从弹层里再 portal 出去的子浮层（Tooltip、Select 这类，
  // 都带 Radix 的 popper 外壳或 portal 标记）；点它们不收。以后往弹层里加子浮层不用改这里，但子浮层必须是 Radix 的（别的体系的浮层要自己登记）。
  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (content.current?.contains(target)) return
      if (root.current?.querySelector('[data-slot="popover-trigger"]')?.contains(target)) return
      if (target.closest('[data-radix-popper-content-wrapper], [data-radix-portal]')) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss, true)
    return () => document.removeEventListener('pointerdown', dismiss, true)
  }, [open])

  const edit = (next: { start: CalendarDate | null; end: CalendarDate | null }) => {
    const valid = next.start && next.end && next.start.compare(next.end) <= 0
    if (live) {
      // 弹层开着时打字改的是草稿，不上报。
      if (valid) setDraft({ start: next.start!.toString(), end: next.end!.toString() })
      return
    }
    if (valid) {
      setPending(null)
      onValue({ start: next.start!.toString(), end: next.end!.toString() })
    } else setPending(next)
  }
  const choose = (range: DateRange) => {
    setPending(null)
    onValue(range)
    setOpen(false)
  }
  // apply 打开时草稿从当前值起、日历聚焦到它的起点；关上（Esc、点外面、应用）都不留痕，下次打开重新来。
  const onOpenChange = (next: boolean) => {
    if (next && apply) {
      setDraft(value)
      setSeed(value)
      setPick(NO_PICK)
      setFocus((value && toDay(value.start)) || toDay(today) || FALLBACK_DAY)
    }
    setOpen(next)
  }
  const pickPreset = (preset: RangePreset) => {
    const range = presetRange(preset, today, weekStart)
    if (!range) return
    if (!apply) return choose(range)
    // apply：预设也只是改草稿，日历翻到它的月份，等「应用」。
    setDraft(range)
    setFocus(toDay(range.start) ?? FALLBACK_DAY)
  }
  const applyDraft = () => {
    if (!draft || !canApplyRange(draft, pick)) return
    choose(draft)
  }
  // 脚上看得见的状态字跟着悬停走；读屏播报的那份只在点选后更新（点起点、点终点、预设、清除），悬停不播报——
  // 否则鼠标每挪一格就读一次。键盘移动日期时 react-aria 自己会播报日期，不需要再叠一句。
  const status = rangeStatus(draft, pick)
  const spoken = rangeStatus(draft, pick.anchor ? { anchor: pick.anchor, preview: null } : NO_PICK)
  const say = (s: typeof status) => (s.kind === 'first' ? text.pickFirst : text.selected(s.days))

  return (
    <I18nProvider locale={locale}>
      <span ref={root} className={cn('k-dr', className)}>
        <DateField
          aria-label={labels.start}
          className="k-dt-field"
          value={start}
          minValue={minValue}
          maxValue={end ?? maxValue}
          validationBehavior="aria"
          shouldForceLeadingZeros
          onChange={(day) => edit({ start: day, end })}
        >
          <DateInput className="k-dt-input">{(segment) => <Segments segment={segment} />}</DateInput>
        </DateField>
        <span className="k-dr-dash" aria-hidden="true">
          –
        </span>
        <DateField
          aria-label={labels.end}
          className="k-dt-field"
          value={end}
          minValue={start ?? minValue}
          maxValue={maxValue}
          validationBehavior="aria"
          shouldForceLeadingZeros
          onChange={(day) => edit({ start, end: day })}
        >
          <DateInput className="k-dt-input">{(segment) => <Segments segment={segment} />}</DateInput>
        </DateField>
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger className="k-dt-pick" aria-label={labels.pickRange}>
            <CalendarDays size={14} aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            variant="menu"
            side="bottom"
            align="start"
            sideOffset={4}
            className="k-dr-pop"
            aria-label={labels.calendar}
            ref={content}
          >
            <div className="k-dr-presets" role="group" aria-label={labels.presets}>
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="k-dr-preset"
                  aria-pressed={active === preset}
                  // 越界的预设禁用（不裁剪）：整段在 min / max 里才能点。
                  disabled={!presetAvailable(preset, today, weekStart, min, max)}
                  onClick={() => pickPreset(preset)}
                >
                  {labels.preset[preset]}
                </button>
              ))}
              {shownRange && active === null && (
                <span className="k-dr-preset" data-custom aria-current="true">
                  {labels.custom}
                </span>
              )}
            </div>
            <div className="k-dr-main">
              <RangeCalendar
                className="k-cal k-rcal"
                aria-label={labels.calendar}
                value={complete}
                minValue={minValue}
                maxValue={maxValue}
                {...(apply
                  ? {
                      focusedValue: focus,
                      onFocusChange: setFocus,
                      // 挑到一半离开日历（Tab 走、点脚上的钮）：放弃这次挑选，不替用户补一个终点。
                      commitBehavior: 'reset' as const,
                    }
                  : { defaultFocusedValue: start ?? undefined })}
                visibleDuration={{ months: 2 }}
                pageBehavior="visible"
                autoFocus
                onChange={(range) => {
                  const next = { start: range.start.toString(), end: range.end.toString() }
                  if (apply) setDraft(next)
                  else choose(next)
                }}
              >
                {apply && <PickBridge onPick={reportPick} />}
                <header className="k-cal-head">
                  <AriaButton slot="previous" className="k-cal-nav" aria-label={labels.previousMonth}>
                    <ChevronLeft size={14} aria-hidden />
                  </AriaButton>
                  <Heading className="k-cal-title" />
                  <AriaButton slot="next" className="k-cal-nav" aria-label={labels.nextMonth}>
                    <ChevronRight size={14} aria-hidden />
                  </AriaButton>
                </header>
                <div className="k-rcal-months">
                  <CalendarGrid className="k-cal-grid">
                    {(day) => <CalendarCell date={day} className="k-cal-cell" data-k-today={isToday(day, today)} />}
                  </CalendarGrid>
                  <CalendarGrid className="k-cal-grid" offset={{ months: 1 }}>
                    {(day) => <CalendarCell date={day} className="k-cal-cell" data-k-today={isToday(day, today)} />}
                  </CalendarGrid>
                </div>
              </RangeCalendar>
              {apply && (
                <footer className="k-dr-foot">
                  <span className="k-dr-status" data-slot="date-range-status" aria-hidden="true">
                    {say(status)}
                  </span>
                  <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                    {say(spoken)}
                  </span>
                  <Button type="button" size="sm" onClick={() => setDraft(null)}>
                    {text.clear}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={!canApplyRange(draft, pick)}
                    onClick={applyDraft}
                  >
                    {text.apply}
                  </Button>
                </footer>
              )}
            </div>
            <RangeCalendar
              className="k-cal k-rcal"
              aria-label={labels.calendar}
              value={start && end ? { start, end } : null}
              minValue={minValue}
              maxValue={maxValue}
              defaultFocusedValue={start ?? undefined}
              visibleDuration={{ months: 2 }}
              pageBehavior="visible"
              autoFocus
              onChange={(range) => choose({ start: range.start.toString(), end: range.end.toString() })}
            >
              <header className="k-cal-head">
                <AriaButton slot="previous" className="k-cal-nav" aria-label={labels.previousMonth}>
                  <ChevronLeft size={14} aria-hidden />
                </AriaButton>
                <Heading className="k-cal-title" />
                <AriaButton slot="next" className="k-cal-nav" aria-label={labels.nextMonth}>
                  <ChevronRight size={14} aria-hidden />
                </AriaButton>
              </header>
              <div className="k-rcal-months">
                <CalendarGrid className="k-cal-grid">{(day) => view.cell(day)}</CalendarGrid>
                <CalendarGrid className="k-cal-grid" offset={{ months: 1 }}>
                  {(day) => view.cell(day)}
                </CalendarGrid>
              </div>
              {view.foot}
            </RangeCalendar>
          </PopoverContent>
        </Popover>
      </span>
    </I18nProvider>
  )
}

/** 这一格是不是调用方说的「今天」（用 today 而不是时钟：两个时区的人各看各的今天）；给格子写 data-k-today。 */
function isToday(day: CalendarDate, today: string): true | undefined {
  return day.toString() === today ? true : undefined
}
