# EventCalendar

照 TradingView 日历的布局（主会话 2026-11-15 登录态实测）：导航行（今天、选日期、按周翻页、范围文字、时区读数），周条（周一到周日七张日卡，列出当天各类别条数，点卡选日），类别药丸（经济 / 财报 / 分红 / IPO，给了哪类数据才有哪个），重要性单开关（只看高重要）、经济类别下拉（12 类，单选）、国家选择框（模态：搜索、全球与前 20 预设、按地区分组两列复选、取消 / 应用）。经济表：日期分隔行粘顶、数字列名写在它右侧；同一时间同一国家的事件合并；实际值加粗不上涨跌色；点开一行看说明、来源、历史值小图、下次发布（比 TradingView 多的部分）。财报表：时段图标 + 时间、徽标、代码、公司名，预期 / 实际 EPS 与营收，EPS 意外与营收意外（只有这两列上涨跌色），市值，币种小字，行下可选「财报材料 / 电话会」。分红、IPO 各有自己的列。数据、现在、时区、文字都由调用方传。

## Provide

`*` marks a required prop.

### EventCalendar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` | `EconomicEvent[]` | — | 经济事件：{ id, at（毫秒）, region, regionName, flag?, name, importance（1–3）, actual?, forecast?, previous?（格式化好的文字）, category?（12 类之一）, regionGroup?（国家框的地区分组）, description?, source?, history?（数字，从旧到新）, nextAt? }。给了说明 / 来源 / 历史值 / 下次发布任一项，这一行才能点开。 |
| `earnings / dividends / ipos` | `EarningsEvent[] / DividendEvent[] / IpoEvent[]` | — | 可选；给了哪类就多一个页签。数字都是原值（EPS、营收、市值、每股金额、股息率百分数），件按 formatVolume 等写；财报的实际对预期自己比，高于预期用涨色。分红的 at 是除权日，派息日用 payAt。 |
| `labels` | `EventCalendarLabels` | — | 类别、区间、重要程度、国家多选、各类列名、盘前盘后、倒计时、「现在」、详情小标题、日期标题、空态等文字，由调用方传。 |
| `now` | `number` | — | 现在（毫秒）：今天 / 本周 / 下周、倒计时与「现在」线从它算；件里不读时钟。 |
| `timeZone / locale` | `string` | — | 显示时区（IANA）与语言：分天、时间格式（时间列头带时区缩写）、周起点（周一）都按它。 |
| `defaultRange` | `'yesterday' \| 'today' \| 'tomorrow' \| 'week' \| 'next'` | — | 起始区间，默认今天。 |
| `defaultCategory` | `CalendarCategory` | — | 起始类别，默认经济。 |
| `rowActions` | `(event, category) => RowAction[]` | — | 悬停或键盘聚焦一行时浮在行尾的图标按钮（RowActions），不占列宽；右键出同一份菜单。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import { EventCalendar, type EconomicEvent, type EventCalendarLabels } from '@katana-ui/react/quant'
import { symbolMenu } from '@katana-ui/react'

const CAL_NOW = Date.UTC(2026, 10, 17, 1, 30)

const calAt = (day: number, hour: number, minute = 0) => Date.UTC(2026, 10, day, hour - 8, minute)

const CAL_EVENTS: EconomicEvent[] = [
  {
    id: 'a1',
    at: calAt(16, 9, 30),
    region: 'CN',
    regionName: '甲国',
    name: '示例消费者物价指数 同比',
    importance: 3,
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.3%',
  },
  {
    id: 'a2',
    at: calAt(16, 22, 0),
    region: 'US',
    regionName: '乙国',
    name: '示例零售销售 环比',
    importance: 2,
    actual: '0.2%',
    forecast: '0.4%',
    previous: '0.6%',
  },
  {
    id: 'b1',
    at: calAt(17, 9, 0),
    region: 'CN',
    regionName: '甲国',
    name: '示例工业增加值 同比',
    importance: 2,
    actual: '5.1%',
    forecast: '4.9%',
    previous: '4.8%',
  },
  {
    id: 'b2',
    at: calAt(17, 8, 45),
    region: 'JP',
    regionName: '丙国',
    name: '示例贸易帐',
    importance: 1,
    actual: '-0.2万亿',
    forecast: '-0.3万亿',
    previous: '-0.4万亿',
  },
  {
    id: 'b3',
    at: calAt(17, 17, 0),
    region: 'EU',
    regionName: '丁区',
    name: '示例经济景气指数',
    importance: 2,
    forecast: '98.5',
    previous: '97.9',
  },
  {
    id: 'b4',
    at: calAt(17, 21, 30),
    region: 'US',
    regionName: '乙国',
    name: '示例新屋开工',
    importance: 1,
    forecast: '1.32M',
    previous: '1.35M',
  },
  {
    id: 'c1',
    at: calAt(18, 10, 0),
    region: 'GB',
    regionName: '戊国',
    name: '示例失业率',
    importance: 2,
    forecast: '4.3%',
    previous: '4.2%',
  },
  {
    id: 'c2',
    at: calAt(18, 21, 30),
    region: 'US',
    regionName: '乙国',
    name: '示例非农就业人数',
    importance: 3,
    forecast: '18.5万',
    previous: '22.8万',
  },
  {
    id: 'c3',
    at: calAt(18, 23, 0),
    region: 'US',
    regionName: '乙国',
    name: '示例央行官员讲话',
    importance: 3,
    previous: '—',
  },
  {
    id: 'd1',
    at: calAt(20, 15, 0),
    region: 'EU',
    regionName: '丁区',
    name: '示例央行利率决议',
    importance: 3,
    forecast: '2.25%',
    previous: '2.25%',
  },
  {
    id: 'd2',
    at: calAt(20, 20, 30),
    region: 'US',
    regionName: '乙国',
    name: '示例初请失业金人数',
    importance: 2,
    forecast: '22.0万',
    previous: '21.8万',
  },
  {
    id: 'n1',
    at: calAt(24, 9, 30),
    region: 'CN',
    regionName: '甲国',
    name: '示例制造业采购经理指数',
    importance: 3,
    forecast: '50.2',
    previous: '49.8',
  },
  {
    id: 'n2',
    at: calAt(25, 10, 0),
    region: 'GB',
    regionName: '戊国',
    name: '示例工业产出',
    importance: 1,
    forecast: '0.1%',
    previous: '0.0%',
  },
]

const CAL_LABELS: EventCalendarLabels = {
  list: '经济日历',
  empty: '这一天没有符合条件的事件',
  nav: { today: '今天', prevWeek: '上一周', nextWeek: '下一周', pickDate: '选择日期', week: '本周' },
  categoryGroup: '日历类别',
  category: { economic: '经济', earnings: '财报', dividends: '分红', ipo: 'IPO' },
  highOnly: '只看高重要',
  economicCategory: {
    label: '经济类别',
    all: '全部类别',
    items: {
      bonds: '债券',
      business: '商业',
      consumer: '消费',
      gdp: 'GDP',
      government: '政府',
      health: '卫生',
      housing: '住房',
      labor: '就业',
      money: '货币',
      prices: '价格',
      trade: '贸易',
      taxes: '税收',
    },
  },
  countries: {
    all: '全部国家',
    count: (n) => `${n} 个国家`,
    title: '选择国家',
    search: '搜索国家 / 地区',
    entireWorld: '全球',
    top: '前 20 大经济体',
    empty: '没有这个国家',
    otherGroup: '其他',
    cancel: '取消',
    apply: '应用',
  },
  today: '今天',
  now: '现在',
  importance: (level) => `重要程度 ${level}`,
  columns: { actual: '实际', forecast: '预期', previous: '前值' },
  earningsColumns: {
    epsEstimate: 'EPS 预期',
    epsActual: 'EPS 实际',
    epsSurprise: 'EPS 意外',
    revenueEstimate: '营收预期',
    revenueActual: '营收实际',
    revenueSurprise: '营收意外',
    marketCap: '市值',
  },
  dividendColumns: { amount: '每股分红', yield: '股息率', payDate: '派息日' },
  ipoColumns: { exchange: '交易所', priceRange: '发行价', shares: '股数', dealSize: '募资额', status: '状态' },
  session: { before: '盘前', during: '盘中', after: '盘后' },
  countdown: (m) => (m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分后` : `${m} 分后`),
  dayTitle: (day) => {
    const [y, m, d] = day.split('-').map(Number)
    const week = '日一二三四五六'[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]
    return `${m} 月 ${d} 日 周${week}`
  },
  count: (n) => `${n} 条`,
  detail: {
    description: '说明',
    source: '来源',
    history: '历史值',
    historyLabel: (n) => `最近 ${n} 期历史值`,
    nextRelease: '下次发布',
  },
  rowActions: '事件操作',
  rowMenu: '事件菜单',
}

export function EventCalendarUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 820, height: 640 }}>
      <PanelFrame focused aria-label="经济日历">
        <PanelFrameHeader heading="经济日历" object="演示数据" />
        <PanelFrameBody>
          <EventCalendar
            events={CAL_EVENTS}
            labels={CAL_LABELS}
            now={CAL_NOW}
            timeZone="Asia/Shanghai"
            locale="zh-CN"
            defaultDay="2026-11-17"
            topRegions={['US', 'CN', 'JP']}
            rowActions={(event) =>
              symbolMenu({
                newAlert: { label: '设提醒', onSelect: () => undefined },
                copyCode: { label: `复制 ${event.id}`, onSelect: () => undefined },
              })
            }
          />
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

// 指标卡演示（#30）：序列由固定种子的随机游走编出来（演示数据，不是行情），两组各一面卡片墙。
```

## States

- 涨色 / 跌色：只给财报的 EPS 意外与营收意外（正涨色、负跌色，带正负号百分比）；实际值一律只加粗，不上色。
- 已发布：时间与事件名用亮字；未发布：实际写「—」，还没到点的在下面写倒计时（「45 分后」）。
- 同一时间同一国家的经济事件合并：时间与国家只在组首行写。
- 现在线：只在今天那天的经济 / 财报页出现，插在已过与未到的行之间。
- 行展开：点一行或在行上按 Enter / 空格，详情行在它下面；再点收起。

## Don't

- 不要把橙色用在数据上。
- 不要在件里写死中文或国家表；文字与国家由调用方传。
- 没有数据时不要放样本行，传空数组。

## Composition

```
EventCalendar
  导航行：今天 | 选日期 | ‹ › | 范围 | 时区
  周条：七张日卡
  类别药丸 | 重要性开关 | 经济类别下拉 | 国家 | 条数
  table
    天（rowgroup）：粘顶的日期标题 + 数字列名
      行：按类别不同的列（行尾悬停浮出 RowActions）
      现在线（今天）
      详情行（经济，点开后）/ 动作行（财报）
```

## Keyboard

- `Tab`：在行间移动焦点
- `Enter / 空格`：展开或收起有详情的行
