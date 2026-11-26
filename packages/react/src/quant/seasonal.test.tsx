// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SeasonalChart } from './seasonal-chart.tsx'
import {
  calendarDay,
  calendarDayText,
  dayOfYear,
  monthClose,
  monthStep,
  nearestDay,
  seasonalDayText,
  seasonalKey,
  seasonalSeries,
  seasonalValueAt,
  toggleHidden,
} from './seasonal-model.ts'

// KatanaUI #147（KATANAview #1884）：季节性图的纯逻辑与结构。

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const at = (year: number, month: number, day: number) => Date.UTC(year, month, day)

describe('季节性的纯逻辑', () => {
  it('dayOfYear：按 UTC 加偏移算年与第几天', () => {
    expect(dayOfYear(at(2025, 0, 1))).toEqual({ year: 2025, day: 0 })
    expect(dayOfYear(at(2025, 2, 1))).toEqual({ year: 2025, day: 59 })
    // 东八区：UTC 12 月 31 日 20:00 已是次年 1 月 1 日。
    expect(dayOfYear(Date.UTC(2025, 11, 31, 20), 8 * 3_600_000)).toEqual({ year: 2026, day: 0 })
  })

  it('seasonalSeries：按年切开、相对年初基准算百分数、同一天取最后一个、年份从早到晚', () => {
    const years = seasonalSeries([
      { time: at(2025, 0, 2), value: 200 },
      { time: at(2025, 0, 3), value: 210 },
      { time: at(2024, 0, 2), value: 100 },
      { time: at(2024, 0, 3), value: 90 },
      { time: at(2024, 0, 3), value: 95 },
      { time: at(2024, 0, 4), value: Number.NaN },
    ])
    expect(years.map((entry) => entry.year)).toEqual([2024, 2025])
    // 2024 没有上一年：基准是这一年第一个价 100。
    expect(years[0]!.points).toEqual([
      { day: 1, pct: 0 },
      { day: 2, pct: -5 },
    ])
    // 2025 的基准是 2024 最后一天的收盘 95（#147 起；之前是这一年第一个价 200）。
    expect(years[1]!.points[1]!.day).toBe(2)
    expect(years[1]!.points[1]!.pct).toBeCloseTo(((210 - 95) / 95) * 100, 10)
  })

  it('第一个价是 0 的年不要；nearestDay 在这一年的点范围外是 null', () => {
    expect(seasonalSeries([{ time: at(2024, 0, 2), value: 0 }])).toEqual([])
    const points = [
      { day: 3, pct: 0 },
      { day: 6, pct: 1 },
      { day: 10, pct: 2 },
    ]
    expect(nearestDay(points, 7)).toEqual({ day: 6, pct: 1 })
    expect(nearestDay(points, 9)).toEqual({ day: 10, pct: 2 })
    expect(nearestDay(points, 11)).toBeNull()
    expect(nearestDay(points, 2)).toBeNull()
  })

  it('seasonalDayText：第几天写成「月 日」', () => {
    expect(seasonalDayText(0, MONTHS)).toBe('Jan 1')
    expect(seasonalDayText(59, MONTHS)).toBe('Mar 1')
    expect(seasonalDayText(364, MONTHS)).toBe('Dec 31')
  })
})

describe('366 格日历（#147）', () => {
  it('calendarDay：同一个日期每年同一格，2 月 29 日是 59，3 月 1 日总是 60，12 月 31 日总是 365', () => {
    expect(calendarDay(at(2024, 1, 29))).toEqual({ year: 2024, day: 59 })
    expect(calendarDay(at(2024, 2, 1))).toEqual({ year: 2024, day: 60 })
    expect(calendarDay(at(2025, 2, 1))).toEqual({ year: 2025, day: 60 })
    expect(calendarDay(at(2024, 11, 31))).toEqual({ year: 2024, day: 365 })
    expect(calendarDay(at(2025, 11, 31))).toEqual({ year: 2025, day: 365 })
    expect(calendarDay(Date.UTC(2025, 11, 31, 20), 8 * 3_600_000)).toEqual({ year: 2026, day: 0 })
  })

  it('seasonalSeries 用 366 格：闰年与平年的 3 月 1 日、12 月 31 日落在同一格', () => {
    const years = seasonalSeries(
      [2024, 2025].flatMap((year) => [
        { time: at(year, 0, 2), value: 100 },
        { time: at(year, 2, 1), value: 101 },
        { time: at(year, 11, 31), value: 102 },
      ]),
    )
    expect(years.map((entry) => entry.points.map((point) => point.day))).toEqual([
      [1, 60, 365],
      [1, 60, 365],
    ])
  })

  it('calendarDayText：59 是 Feb 29，60 是 Mar 1，365 是 Dec 31', () => {
    expect(calendarDayText(0, MONTHS)).toBe('Jan 1')
    expect(calendarDayText(59, MONTHS)).toBe('Feb 29')
    expect(calendarDayText(60, MONTHS)).toBe('Mar 1')
    expect(calendarDayText(365, MONTHS)).toBe('Dec 31')
  })
})

describe('年初基准（#147）', () => {
  it('上一年最后一天的收盘是基准：今年第一个点就带着跨年的涨跌', () => {
    const years = seasonalSeries([
      { time: at(2024, 0, 2), value: 100 },
      { time: at(2024, 11, 30), value: 120 },
      { time: at(2024, 11, 31), value: 125 },
      { time: at(2025, 0, 2), value: 130 },
      { time: at(2025, 0, 3), value: 100 },
    ])
    expect(years[0]!.points.map((point) => point.pct)).toEqual([0, 20, 25])
    expect(years[1]!.points.map((point) => point.pct)).toEqual([4, -20])
  })

  it('数据里没有上一年（中间缺年）、或上一年收盘是 0：退回这一年第一个价', () => {
    const gap = seasonalSeries([
      { time: at(2023, 11, 29), value: 50 },
      { time: at(2025, 0, 2), value: 200 },
      { time: at(2025, 0, 3), value: 210 },
    ])
    expect(gap.find((entry) => entry.year === 2025)!.points.map((point) => point.pct)).toEqual([0, 5])
    const zero = seasonalSeries([
      { time: at(2024, 11, 31), value: 0 },
      { time: at(2025, 0, 2), value: 200 },
      { time: at(2025, 0, 3), value: 210 },
    ])
    expect(zero.map((entry) => entry.year)).toEqual([2025])
    expect(zero[0]!.points.map((point) => point.pct)).toEqual([0, 5])
  })
})

describe('读数、表格与键位（#147）', () => {
  const points = [
    { day: 3, pct: 1 },
    { day: 40, pct: 2 },
    { day: 59, pct: 3 },
    { day: 60, pct: 4 },
    { day: 200, pct: 5 },
  ]

  it('seasonalValueAt：往年最后一个点之后沿用到年底；今年（carry 为假）过了最后一个点是 null；早于第一个点是 null', () => {
    expect(seasonalValueAt(points, 365, true)).toBe(5)
    expect(seasonalValueAt(points, 201, false)).toBeNull()
    expect(seasonalValueAt(points, 199, false)).toBe(5)
    expect(seasonalValueAt(points, 2, true)).toBeNull()
  })

  it('monthClose：一个月里最后一个点是月末；2 月 29 日算 2 月；没有点的月是 null', () => {
    expect(monthClose(points, 0)).toBe(1)
    expect(monthClose(points, 1)).toBe(3)
    expect(monthClose(points, 2)).toBe(4)
    expect(monthClose(points, 3)).toBeNull()
    expect(monthClose(points, 11)).toBeNull()
  })

  it('monthStep：PageUp 到前一个月初、PageDown 到后一个月初，头尾贴边', () => {
    expect(monthStep(324, -1)).toBe(305)
    expect(monthStep(305, -1)).toBe(274)
    expect(monthStep(0, -1)).toBe(0)
    expect(monthStep(324, 1)).toBe(335)
    expect(monthStep(340, 1)).toBe(365)
  })

  it('seasonalKey：没选中时 ← / → 落在 anchor，PageUp / PageDown 从 anchor 算；其余同 scrubKey', () => {
    expect(seasonalKey(null, 'ArrowLeft', false, 324)).toBe(324)
    expect(seasonalKey(null, 'ArrowRight', false, 324)).toBe(324)
    expect(seasonalKey(null, 'PageUp', false, 324)).toBe(305)
    expect(seasonalKey(null, 'PageDown', false, 324)).toBe(335)
    expect(seasonalKey(324, 'ArrowLeft', false, 324)).toBe(323)
    expect(seasonalKey(324, 'ArrowLeft', true, 324)).toBe(321)
    expect(seasonalKey(10, 'Home', false, 324)).toBe(0)
    expect(seasonalKey(10, 'End', false, 324)).toBe(365)
    expect(seasonalKey(10, 'Escape', false, 324)).toBeNull()
    expect(seasonalKey(null, 'Escape', false, 324)).toBeUndefined()
    expect(seasonalKey(10, 'a', false, 324)).toBeUndefined()
  })

  it('toggleHidden：开关一年；最后一个看得见的年不让关；列表里多出的年不挡路', () => {
    expect(toggleHidden([], 2024, [2024, 2025])).toEqual([2024])
    expect(toggleHidden([2024], 2024, [2024, 2025])).toEqual([])
    expect(toggleHidden([2024], 2025, [2024, 2025])).toBeNull()
    expect(toggleHidden([1999], 2024, [2024, 2025])).toEqual([1999, 2024])
  })
})

describe('SeasonalChart', () => {
  const labels = { chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'No data' }
  const years = [2023, 2024, 2025].map((year) => ({
    year,
    points: [
      { day: 2, pct: 0 },
      { day: 100, pct: year - 2024 },
      { day: 200, pct: 1 },
    ],
  }))
  const actionLabels = {
    group: 'Chart actions',
    table: 'Table view',
    exportCsv: 'Export CSV',
    fullscreen: 'Fullscreen',
  }

  it('每年一条线、一个开关；最新一年加粗；十二个月刻度', () => {
    const html = renderToStaticMarkup(<SeasonalChart years={years} labels={labels} />)
    expect(html.match(/data-slot="seasonal-line"/g)?.length).toBe(3)
    expect(html).toMatch(/k-seasonal-line is-bold"[^>]*data-year="2025"/)
    expect(html.match(/data-slot="seasonal-key"/g)?.length).toBe(3)
    expect(html.match(/aria-pressed="true"/g)?.length).toBe(3)
    for (const month of MONTHS) expect(html).toContain(`>${month}<`)
  })

  it('起始隐去的年不画线、开关 aria-pressed 为假；highlight 指定加粗的年', () => {
    const html = renderToStaticMarkup(
      <SeasonalChart years={years} defaultHidden={[2023]} highlight={2024} labels={labels} />,
    )
    expect(html.match(/data-slot="seasonal-line"/g)?.length).toBe(2)
    expect(html).not.toContain('data-year="2023"')
    expect(html).toMatch(/aria-pressed="false"[^>]*>.*2023/)
    expect(html).toMatch(/k-seasonal-line is-bold"[^>]*data-year="2024"/)
  })

  it('没有至少两个点的年：画空态', () => {
    const html = renderToStaticMarkup(
      <SeasonalChart years={[{ year: 2025, points: [{ day: 1, pct: 0 }] }]} labels={labels} />,
    )
    expect(html).toContain('seasonal-empty')
    expect(html).toContain('No data')
  })

  it('受控 hidden 以它为准（defaultHidden 不管用）', () => {
    const html = renderToStaticMarkup(
      <SeasonalChart years={years} hidden={[2024]} defaultHidden={[2023]} onHiddenChange={() => {}} labels={labels} />,
    )
    expect(html.match(/data-slot="seasonal-line"/g)?.length).toBe(2)
    expect(html).not.toContain('data-year="2024"')
    expect(html).toContain('data-year="2023"')
    expect(html).toMatch(/aria-pressed="false"[^>]*>.*?2024/)
  })

  it('图例写出每年最后一个点的涨跌幅，位数跟 digits', () => {
    const changes = (html: string) =>
      [...html.matchAll(/data-slot="seasonal-key-value">([^<]*)</g)].map((match) => match[1])
    expect(changes(renderToStaticMarkup(<SeasonalChart years={years} labels={labels} />))).toEqual([
      '+1.00%',
      '+1.00%',
      '+1.00%',
    ])
    const falling = [{ year: 2025, points: [years[0]!.points[0]!, { day: 9, pct: -2.345 }] }]
    expect(changes(renderToStaticMarkup(<SeasonalChart years={falling} digits={1} labels={labels} />))).toEqual([
      '-2.3%',
    ])
  })

  it('给了 actionLabels 才画图操作（表格视图按钮），导出按钮跟 onExport；表格默认关着', () => {
    expect(renderToStaticMarkup(<SeasonalChart years={years} labels={labels} />)).not.toContain('chart-actions')
    const html = renderToStaticMarkup(
      <SeasonalChart years={years} labels={labels} actionLabels={actionLabels} onExport={() => {}} />,
    )
    expect(html).toContain('data-slot="chart-actions"')
    expect(html).toMatch(/data-action="table" aria-pressed="false" aria-label="Table view"/)
    expect(html).toContain('data-action="export"')
    expect(html).not.toContain('data-action="fullscreen"')
    expect(html).not.toContain('seasonal-table')
  })

  it('横轴月初按 366 格摆：3 月 1 日在第 60 格；双数月带 data-even（窄图只留单数月）', () => {
    const html = renderToStaticMarkup(<SeasonalChart years={years} labels={labels} />)
    expect(html).toContain(`left:${(60 / 365) * 100}%" data-align="mid">Mar<`)
    expect(html).toContain('data-even="true">Feb<')
    expect(html).not.toContain('data-even="true">Mar<')
  })
})
