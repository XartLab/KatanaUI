// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { CalendarHeatmap } from './calendar-heatmap.tsx'
import {
  addDays,
  calendarGrid,
  calendarKey,
  calendarTone,
  formatDate,
  isoWeek,
  monthGrid,
  parseDate,
} from './calendar-model.ts'
import { BrushChart } from './brush-chart.tsx'
import { centerWindow, clampWindow, moveWindow, resizeWindow } from './brush-model.ts'
import { HorizonChart } from './horizon-chart.tsx'
import { horizonBands, horizonMax } from './horizon-model.ts'
import { areaPath, extent, linePath, makePlot, niceTicks, PLOT_W } from './series-geometry.ts'

// #1917：时间序列与盈亏的件的几何与结构（纯函数）。拖拽、悬停、键盘与画出来的像素在 e2e/ui-gallery.spec.ts 里用真浏览器验。

describe('序列几何', () => {
  it('好看的刻度：整齐步长，区间包住数据', () => {
    const { domain, ticks, step } = niceTicks(3, 97, 5)
    expect(step).toBe(20)
    expect(domain).toEqual([0, 100])
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(-0.12, 0.31, 4).ticks).toEqual([-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4])
    // 数据 -800 ~ 4300：区间贴着数据，不撑成对称的 ±5000。
    expect(niceTicks(-800, 4300, 4).domain).toEqual([-2000, 6000])
  })

  it('一个值也有区间：上下各留 1', () => {
    expect(niceTicks(5, 5, 3).domain[0]).toBeLessThan(5)
    expect(niceTicks(5, 5, 3).domain[1]).toBeGreaterThan(5)
  })

  it('extent 跳过非有限数，可把 0 包进来，全空是 [0, 1]', () => {
    expect(extent([3, Number.NaN, -2, 9])).toEqual([-2, 9])
    expect(extent([3, 9], true)).toEqual([0, 9])
    expect(extent([])).toEqual([0, 1])
  })

  it('比例尺：点的 x 头尾贴边，带的 x 在带中心；y 向上为大', () => {
    const points = makePlot(5, [0, 100], { height: 108, exact: true })
    expect(points.xAt(0)).toBe(0)
    expect(points.xAt(4)).toBe(PLOT_W)
    expect(points.yAt(0)).toBe(100)
    expect(points.yAt(100)).toBe(8)
    const bands = makePlot(4, [0, 1], { height: 100, band: true, exact: true })
    expect(bands.step).toBe(250)
    expect(bands.xAt(0)).toBe(125)
    expect(bands.xAt(3)).toBe(875)
    expect(makePlot(1, [0, 1], { height: 50 }).xAt(0)).toBe(500)
  })

  it('折线路径遇到非有限数断开；面积回到基线闭合', () => {
    const plot = makePlot(3, [0, 10], { height: 108, exact: true, padTop: 8, padBottom: 8 })
    expect(linePath([0, 10, 0], plot)).toBe('M0.00,100.00L500.00,8.00L1000.00,100.00')
    expect(linePath([0, Number.NaN, 10], plot)).toBe('M0.00,100.00M1000.00,8.00')
    expect(areaPath([0, 10], plot, 0)).toBe('M0.00,100.00L500.00,8.00L500.00,100.00L0.00,100.00Z')
    expect(areaPath([1], plot, 0)).toBe('')
  })
})

describe('刷选窗口', () => {
  it('夹取：不出界，不小于最小窗口', () => {
    expect(clampWindow([-5, 3], 10)).toEqual([0, 3])
    expect(clampWindow([8, 30], 10)).toEqual([8, 10])
    expect(clampWindow([4, 4], 10, 2)).toEqual([4, 6])
    expect(clampWindow([9, 10], 10, 2)).toEqual([8, 10])
    expect(clampWindow([0, 1], 1)).toEqual([0, 1])
    expect(clampWindow([2, 5], 0)).toEqual([0, 0])
  })

  it('平移：长度不变，碰到边停在边上', () => {
    expect(moveWindow([2, 5], 3, 20)).toEqual([5, 8])
    expect(moveWindow([2, 5], -9, 20)).toEqual([0, 3])
    expect(moveWindow([15, 18], 9, 20)).toEqual([17, 20])
  })

  it('缩放：另一端不动，不越过最小窗口；end 端的 to 含这个点', () => {
    expect(resizeWindow([4, 10], 'start', 6, 20)).toEqual([6, 10])
    expect(resizeWindow([4, 10], 'start', 9, 20)).toEqual([8, 10])
    expect(resizeWindow([4, 10], 'end', 12, 20)).toEqual([4, 13])
    expect(resizeWindow([4, 10], 'end', 4, 20)).toEqual([4, 6])
    expect(resizeWindow([4, 10], 'end', 99, 20)).toEqual([4, 20])
  })

  it('点概览条：窗口移到那里居中，长度不变', () => {
    expect(centerWindow([0, 4], 10, 20)).toEqual([8, 12])
    expect(centerWindow([0, 4], 19, 20)).toEqual([16, 20])
  })
})

describe('BrushChart', () => {
  const values = Array.from({ length: 30 }, (_, i) => i * 2)
  const labels = { start: '起点', end: '终点', window: '位置' }
  const html = renderToStaticMarkup(
    <BrushChart
      values={values}
      label="示例"
      formatX={(i) => `d${i}`}
      formatValue={String}
      labels={labels}
      defaultWindow={[10, 20]}
    />,
  )

  it('主图只画窗口里的点；概览条画全部', () => {
    const line = /data-slot="brush-line" d="([^"]*)"/.exec(html)![1]!
    expect(line.match(/[ML]/g)).toHaveLength(10)
    expect(line.startsWith('M0.00')).toBe(true)
    expect(line).toContain('L1000.00')
    const strip = html.slice(html.indexOf('data-slot="brush-strip"'))
    const overview = /k-brush-strip-line" d="([^"]*)"/.exec(strip)![1]!
    expect(overview.match(/[ML]/g)).toHaveLength(30)
    expect(strip).toContain('k-brush-strip-line')
  })

  it('三个手柄是 slider，值与读屏文字对得上窗口', () => {
    expect(html).toContain('aria-label="起点"')
    expect(html).toContain('aria-valuenow="10"')
    expect(html).toContain('aria-valuetext="d10"')
    expect(html).toContain('aria-label="终点"')
    expect(html).toContain('aria-valuenow="19"')
    expect(html).toContain('aria-valuetext="d19"')
    expect(html).toContain('aria-label="位置"')
    expect(html).toContain('aria-valuetext="d10 – d19"')
    expect(html).toContain('left:33.33333333333333%;width:33.33333333333333%')
  })
})

describe('日历热力图', () => {
  it('日期按 UTC 日历日算：往返不变，写错的日期是 NaN', () => {
    expect(formatDate(parseDate('2026-02-28'))).toBe('2026-02-28')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(parseDate('2026-02-30')).toBeNaN()
    expect(parseDate('abc')).toBeNaN()
  })

  it('排布：一周一列、一天一格；周一起头时周一在第 0 行；第一列开头的空位不画', () => {
    // 2026-11-14 是周六。
    const grid = calendarGrid('2026-11-14', '2026-11-23', 1)
    expect(grid.cells.map((c) => [c.date, c.col, c.row]).slice(0, 3)).toEqual([
      ['2026-11-14', 0, 5],
      ['2026-11-15', 0, 6],
      ['2026-11-16', 1, 0],
    ])
    expect(grid.cols).toBe(3)
    expect(calendarGrid('2026-11-14', '2026-11-14', 0).cells[0]!.row).toBe(6)
    expect(calendarGrid('2026-11-14', '2026-11-01').cells).toEqual([])
  })

  it('月份标签落在每个月第一天所在的列，区间起点那一列也有', () => {
    const grid = calendarGrid('2026-11-14', '2026-12-10', 1)
    expect(grid.months).toEqual([
      { col: 0, month: 10 },
      { col: 3, month: 11 },
    ])
  })

  it('格色：正负各两档，深档只给超过阈值的；0 持平、没数据 none；阈值是 0 时没有深档', () => {
    expect(calendarTone(10, 50)).toBe('pos1')
    expect(calendarTone(51, 50)).toBe('pos2')
    expect(calendarTone(50, 50)).toBe('pos1')
    expect(calendarTone(-51, 50)).toBe('neg2')
    expect(calendarTone(-5, 50)).toBe('neg1')
    expect(calendarTone(0, 50)).toBe('flat')
    expect(calendarTone(null, 50)).toBe('none')
    expect(calendarTone(Number.NaN, 50)).toBe('none')
    expect(calendarTone(99, 0)).toBe('pos1')
  })

  it('ISO 周序号与月历：2026-10-01（周四）在第 40 周；一个月补满整周；周日起头时周标按周一算', () => {
    expect(isoWeek('2026-10-01')).toBe(40)
    expect(isoWeek('2026-01-01')).toBe(1)
    expect(isoWeek('2027-01-01')).toBe(53)
    const weeks = monthGrid('2026-10', 1)
    expect(weeks).toHaveLength(5)
    expect(weeks[0]!.week).toBe(40)
    expect(weeks[0]!.days.map((d) => d.date)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ])
    expect(weeks[0]!.days.filter((d) => d.inMonth)).toHaveLength(4)
    expect(weeks.flatMap((w) => w.days).filter((d) => d.inMonth)).toHaveLength(31)
    expect(monthGrid('坏', 1)).toEqual([])
  })

  it('键盘：←→ 一天、↑↓ 一周、Home / End 头尾，夹在区间里；没选中先落到最后一天；Esc 清掉', () => {
    const [from, to] = ['2026-01-01', '2026-12-31']
    expect(calendarKey('2026-06-10', 'ArrowDown', from, to)).toBe('2026-06-17')
    expect(calendarKey('2026-06-10', 'ArrowUp', from, to)).toBe('2026-06-03')
    expect(calendarKey('2026-06-10', 'ArrowRight', from, to)).toBe('2026-06-11')
    expect(calendarKey('2026-06-10', 'ArrowLeft', from, to)).toBe('2026-06-09')
    expect(calendarKey('2026-01-01', 'ArrowLeft', from, to)).toBe(from)
    expect(calendarKey('2026-12-30', 'ArrowRight', from, to)).toBe('2026-12-31')
    expect(calendarKey('2026-12-30', 'ArrowDown', from, to)).toBe(to)
    expect(calendarKey('2026-06-10', 'Home', from, to)).toBe(from)
    expect(calendarKey(null, 'ArrowLeft', from, to)).toBe(to)
    expect(calendarKey('2026-06-10', 'Escape', from, to)).toBeNull()
    expect(calendarKey(null, 'Escape', from, to)).toBeUndefined()
    expect(calendarKey('2026-06-10', 'x', from, to)).toBeUndefined()
  })

  it('渲染：月历每天一格，休市日灰底写休，事件点最多 3 个更多写 +n，今天带标记，格色是发散色档', () => {
    const base = {
      weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
      monthLabels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
      weekLabel: (w: number) => `W${w}`,
      closedLabel: '休',
      formatValue: (v: number) => String(v),
      describe: (date: string, value: number | null) => `${date} ${value}`,
      label: '示例',
      actionLabels: { group: '图工具', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
      tableHeads: { date: '日期', value: '值' },
    }
    const ev = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `e${i}` }))
    const html = renderToStaticMarkup(
      <CalendarHeatmap
        {...base}
        month="2026-10"
        today="2026-10-04"
        days={[
          { date: '2026-10-01', value: 100, events: ev(5) },
          { date: '2026-10-02', value: -30 },
          { date: '2026-10-03', value: null, open: false },
          { date: '2026-10-04', value: 0 },
        ]}
        legend={{ down: '亏', up: '盈' }}
      />,
    )
    expect(html.match(/data-slot="calendar-cell"/g)).toHaveLength(31)
    expect(html).toContain('W40')
    expect(html).toMatch(/data-date="2026-10-01" data-tone="pos2"/)
    expect(html).toMatch(/data-date="2026-10-02" data-tone="neg1"/)
    expect(html).toMatch(/data-date="2026-10-03" data-tone="none" data-closed="true"/)
    expect(html).toMatch(/data-date="2026-10-04" data-tone="flat"/)
    expect(html).toContain('data-today="true"')
    expect(html).toContain('>休<')
    expect(html).toContain('<b>+2</b>')
    expect(html.match(/<i data-tone="normal">/g)).toHaveLength(3)
    expect(html).toContain('data-action="table"')
    expect(html.match(/<i data-tone="(?:pos|neg|flat)/g)).toHaveLength(5)
  })

  it('渲染：年视图每天一格，周末休市不着色；事件视图格子不着色', () => {
    const props = {
      weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
      monthLabels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
      weekLabel: (w: number) => `W${w}`,
      closedLabel: '休',
      formatValue: (v: number) => String(v),
      describe: (date: string) => date,
      label: '示例',
      actionLabels: { group: '图工具', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
      tableHeads: { date: '日期', value: '值' },
      days: [
        { date: '2026-11-16', value: 100 },
        { date: '2026-11-21', value: null, open: false },
      ],
    }
    const year = renderToStaticMarkup(<CalendarHeatmap {...props} mode="year" from="2026-11-16" to="2026-11-22" />)
    expect(year.match(/data-slot="calendar-cell"/g)).toHaveLength(7)
    expect(year).toContain('data-date="2026-11-16" data-tone="pos1"')
    expect(year).toContain('data-date="2026-11-21" data-tone="none" data-closed="true"')
    const events = renderToStaticMarkup(<CalendarHeatmap {...props} month="2026-11" view="events" />)
    expect(events).not.toContain('data-tone="pos')
  })
})

describe('地平线图分带', () => {
  it('每条带装自己那一截：2.5 在 unit 为 1 的三条带里是 [1, 1, 0.5]，负数镜像到负的一套', () => {
    const out = horizonBands([2.5, -1.5, 0], 3, 3)
    expect(out.positive.map((band) => band[0])).toEqual([1, 1, 0.5])
    expect(out.negative.map((band) => band[1])).toEqual([1, 0.5, 0])
    expect(out.positive.map((band) => band[1])).toEqual([0, 0, 0])
    expect(out.negative.map((band) => band[0])).toEqual([0, 0, 0])
  })

  it('超过满刻度的按满高画，非有限数与 0 是空；满刻度为 0 全空', () => {
    expect(horizonBands([10], 3, 3).positive.map((band) => band[0])).toEqual([1, 1, 1])
    expect(horizonBands([Number.NaN, 0], 3, 3).positive.flat()).toEqual([0, 0, 0, 0, 0, 0])
    expect(horizonBands([1, -1], 0, 3).negative.flat()).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('共用的满刻度是所有行 |值| 的最大值', () => {
    expect(
      horizonMax([
        [1, -4],
        [2, Number.NaN],
      ]),
    ).toBe(4)
    expect(horizonMax([])).toBe(0)
  })

  it('渲染：每行 2 乘 带数 条带路径，共用满刻度时小行的高带是空路径，各自满刻度时填满', () => {
    const rows = [
      { key: 'a', label: 'A', values: [0, 3, -3, 1] },
      { key: 'b', label: 'B', values: [0, 1, -1, 0.5] },
    ]
    const shared = renderToStaticMarkup(<HorizonChart rows={rows} label="示例" formatValue={String} />)
    expect(shared.match(/data-slot="horizon-band"/g)).toHaveLength(12)
    expect(shared).toMatch(/data-row="b"[\s\S]*data-band="2"(?: data-outer="true")? style="[^"]*" d=""/)
    const own = renderToStaticMarkup(<HorizonChart rows={rows} label="示例" formatValue={String} scale="row" />)
    expect(own.match(/ d=""/g)?.length ?? 0).toBeLessThan(shared.match(/ d=""/g)!.length)
    expect(shared).toContain('data-tone="up"')
  })
})
