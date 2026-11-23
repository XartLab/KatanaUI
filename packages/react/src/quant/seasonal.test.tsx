// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SeasonalChart } from './seasonal-chart.tsx'
import { dayOfYear, nearestDay, seasonalDayText, seasonalSeries } from './seasonal-model.ts'

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

  it('seasonalSeries：按年切开、相对这一年第一个价算百分数、同一天取最后一个、年份从早到晚', () => {
    const years = seasonalSeries([
      { time: at(2025, 0, 2), value: 200 },
      { time: at(2025, 0, 3), value: 210 },
      { time: at(2024, 0, 2), value: 100 },
      { time: at(2024, 0, 3), value: 90 },
      { time: at(2024, 0, 3), value: 95 },
      { time: at(2024, 0, 4), value: Number.NaN },
    ])
    expect(years.map((entry) => entry.year)).toEqual([2024, 2025])
    expect(years[0]!.points).toEqual([
      { day: 1, pct: 0 },
      { day: 2, pct: -5 },
    ])
    expect(years[1]!.points[1]).toEqual({ day: 2, pct: 5 })
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
})
