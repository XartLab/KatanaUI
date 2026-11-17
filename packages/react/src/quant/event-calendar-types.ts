// SPDX-License-Identifier: MIT
// EventCalendar 的公开类型：一行是哪四类事件之一、全部文案（labels）、财报行下的链接、属性。从 event-calendar.tsx 拆出（G5），名字与形状不变。
import type {
  CalendarCategory,
  DividendEvent,
  EarningsEvent,
  EarningsSession,
  EconomicCategory,
  EconomicEvent,
  EconomicImportance,
  IpoEvent,
} from './event-calendar-model.ts'
import type { RowAction } from '../patterns/row-actions.tsx'

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
