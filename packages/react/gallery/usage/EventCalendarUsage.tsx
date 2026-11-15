// SPDX-License-Identifier: MIT
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import { EventCalendar, type EconomicEvent, type EventCalendarLabels } from '../../src/quant'
import { symbolMenu } from '../../src/index'

const CAL_NOW = Date.UTC(2026, 10, 17, 0, 0)

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
    tone: 'down',
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
    tone: 'down',
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
    tone: 'up',
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
    tone: 'up',
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
  empty: '这段时间没有符合条件的事件',
  range: { today: '今天', week: '本周', next: '下周', custom: '自定义' },
  rangeGroup: '日期范围',
  importanceGroup: '重要程度',
  importanceClear: '清除重要程度筛选',
  importance: (level) => `重要程度 ${level}`,
  regionsAll: '全部国家',
  regionsPlaceholder: '搜索国家 / 地区',
  regionsEmpty: '没有这个国家',
  regionsCount: (n) => `${n} 个国家`,
  onlyHigh: '只看高重要',
  today: '今天',
  columns: {
    time: '时间',
    region: '国家',
    event: '事件',
    importance: '重要',
    actual: '实际',
    forecast: '预期',
    previous: '前值',
  },
  countdown: (m) => (m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分后` : `${m} 分后`),
  dateRange: {
    start: '起点',
    end: '终点',
    pickRange: '选择区间',
    calendar: '区间日历',
    previousMonth: '上个月',
    nextMonth: '下个月',
    presets: '常用区间',
    preset: { today: '今天', week: '本周', month: '本月', ytd: '年初至今' },
    custom: '自定义',
  },
  dayTitle: (day) => {
    const [y, m, d] = day.split('-').map(Number)
    const week = '日一二三四五六'[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]
    return `${m} 月 ${d} 日 周${week}`
  },
  count: (n) => `${n} 条`,
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
            defaultRange="week"
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
