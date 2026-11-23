// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  addDays,
  dayMs,
  latestTradingDayOnOrBefore,
  shiftTradingDay,
  tradingDayTest,
  weekdayOf,
} from './trading-date-model.ts'
import { TradingDatePicker } from './trading-date-picker.tsx'

// #110 第 2 批第 3 项：交易日选择。交易日历是示例（2026-10-01 到 10-08 休市，周末休市），不是真日历。
const closed = new Set(['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'])
const calendar = (date: string) => {
  const weekday = weekdayOf(date)
  return weekday !== 0 && weekday !== 6 && !closed.has(date)
}

describe('交易日的纯函数', () => {
  it('日期运算：只认真有的日期，跨月跨年正确', () => {
    expect(dayMs('2026-02-30')).toBeNull()
    expect(dayMs('2026/11/20')).toBeNull()
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(weekdayOf('2026-11-22')).toBe(0)
  })

  it('tradingDayTest：吃数组、Set、函数；写不对的日期不是交易日', () => {
    expect(tradingDayTest(['2026-11-20'])('2026-11-20')).toBe(true)
    expect(tradingDayTest(new Set(['2026-11-20']))('2026-11-21')).toBe(false)
    expect(tradingDayTest(() => true)('乱写')).toBe(false)
    expect(tradingDayTest(calendar)('2026-11-21')).toBe(false)
  })

  it('shiftTradingDay：周一往前跳到上周五，长假整段跳过，受 min / max 限制', () => {
    expect(shiftTradingDay('2026-11-23', calendar, -1)).toBe('2026-11-20')
    expect(shiftTradingDay('2026-11-20', calendar, 1)).toBe('2026-11-23')
    expect(shiftTradingDay('2026-09-30', calendar, 1)).toBe('2026-10-09')
    expect(shiftTradingDay('2026-10-09', calendar, -1)).toBe('2026-09-30')
    expect(shiftTradingDay('2026-11-20', calendar, 1, { max: '2026-11-22' })).toBeNull()
    expect(shiftTradingDay('2026-11-23', calendar, -1, { min: '2026-11-22' })).toBeNull()
    expect(shiftTradingDay('2026-11-20', () => false, 1)).toBeNull()
  })

  it('latestTradingDayOnOrBefore：交易日取自己，休市取前一个交易日', () => {
    expect(latestTradingDayOnOrBefore('2026-11-20', calendar)).toBe('2026-11-20')
    expect(latestTradingDayOnOrBefore('2026-11-22', calendar)).toBe('2026-11-20')
    expect(latestTradingDayOnOrBefore('2026-10-05', calendar)).toBe('2026-09-30')
  })
})

describe('TradingDatePicker', () => {
  it('显示选中的日子，前后按钮可用；日期在边界时对应的按钮禁用', () => {
    const html = renderToStaticMarkup(
      <TradingDatePicker value="2026-11-20" onValueChange={() => {}} calendar={calendar} max="2026-11-20" />,
    )
    expect(html).toContain('data-slot="trading-date-value">2026-11-20<')
    expect(html).toMatch(/data-slot="trading-date-next"[^>]*disabled/)
    expect(html).not.toMatch(/data-slot="trading-date-prev"[^>]*disabled/)
  })

  it('选中的日子本身休市：标 data-closed；没选写占位字', () => {
    expect(
      renderToStaticMarkup(<TradingDatePicker value="2026-11-21" onValueChange={() => {}} calendar={calendar} />),
    ).toContain('data-closed="true"')
    expect(
      renderToStaticMarkup(<TradingDatePicker value={null} onValueChange={() => {}} calendar={calendar} />),
    ).toContain('选择交易日')
  })
})
