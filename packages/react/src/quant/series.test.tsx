// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { CalendarHeatmap } from './calendar-heatmap'
import { addDays, calendarGrid, calendarKey, calendarLevel, formatDate, parseDate } from './calendar-model'
import { Meter } from './meter'
import { meterModel } from './meter-model'
import { BrushChart } from './brush-chart'
import { centerWindow, clampWindow, moveWindow, resizeWindow } from './brush-model'
import { HorizonChart } from './horizon-chart'
import { horizonBands, horizonMax } from './horizon-model'
import { AttributionBars } from './attribution-bars'
import { attributionBar, attributionRows, attributionScale } from './attribution-model'
import { areaPath, extent, linePath, makePlot, niceTicks, PLOT_W } from './series-geometry'

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

describe('盈亏归因', () => {
  const items = [
    { key: 'a', label: 'A', value: 100 },
    { key: 'b', label: 'B', value: -300 },
    { key: 'c', label: 'C', value: 50 },
    { key: 'd', label: 'D', value: -20 },
    { key: 'fee', label: '费用', value: -10, kind: 'fee' as const },
  ]

  it('正负分组、组内按 |贡献| 降序，费用·税永远在最底', () => {
    expect(attributionRows(items).map((row) => row.key)).toEqual(['a', 'c', 'b', 'd', 'fee'])
    expect(attributionRows(items).at(-1)!.kind).toBe('fee')
  })

  it('超过 maxItems 折进「其他」：数是净和，放在自己符号那一组的最后，费用不参与折叠', () => {
    const rows = attributionRows(items, 3)
    // 保留 |值| 最大的两项（B、A），其余折成其他：50 - 20 = 30，放在正组最后。
    expect(rows.map((row) => row.key)).toEqual(['a', '__other', 'b', 'fee'])
    const other = rows.find((row) => row.kind === 'other')!
    expect(other.value).toBe(30)
    expect(other.folded).toBe(2)
    expect(attributionRows(items, 4).some((row) => row.kind === 'other')).toBe(false)
  })

  it('刻度对称：最大 |值| 向上取到一位有效数字；条从零轴往右（正）或往左（负）', () => {
    expect(attributionScale(attributionRows([{ key: 'a', label: 'a', value: 73_920 }]))).toBe(80_000)
    expect(attributionScale([])).toBe(1)
    expect(attributionBar(50, 100)).toEqual({ left: 0.5, width: 0.25 })
    expect(attributionBar(-50, 100)).toEqual({ left: 0.25, width: 0.25 })
    expect(attributionBar(500, 100).width).toBe(0.5)
  })

  it('渲染：每行一条点阵纹理的条，数字带正负方向，焦点项带 data-focus，页脚写刻度，表格视图按钮总有', () => {
    const html = renderToStaticMarkup(
      <AttributionBars
        items={items}
        label="归因"
        formatValue={String}
        otherLabel={(n) => `其他 ×${n}`}
        formatShare={String}
        shareLabel="占比"
        focusKey="a"
        footer={{ count: '5 项', scale: (max) => `刻度 ±${max}` }}
        actionLabels={{ group: '图工具', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' }}
        tableHeads={{ item: '项', value: '值', share: '占比' }}
      />,
    )
    expect(html.match(/data-slot="attribution-bar"/g)).toHaveLength(5)
    expect(html).toContain('k-dotfill')
    expect(html).toContain('data-focus="true"')
    expect(html).toContain('data-tone="down"')
    expect(html).toContain('刻度 ±300')
    expect(html).toContain('data-action="table"')
    expect(html).not.toContain('data-action="export"')
  })
})

describe('Meter 仪表', () => {
  it('状态按「达到」算：已用 ≥ 软限是 warn，≥ 硬限是 breach；没给限就是 ok', () => {
    expect(meterModel({ value: 79, soft: 80, hard: 100 }).state).toBe('ok')
    expect(meterModel({ value: 80, soft: 80, hard: 100 }).state).toBe('warn')
    expect(meterModel({ value: 100, soft: 80, hard: 100 }).state).toBe('breach')
    expect(meterModel({ value: 5 }).state).toBe('ok')
    expect(meterModel({ value: 90, hard: 100 }).state).toBe('ok')
  })

  it('位置：按满刻度，越界按边；满刻度没给取已用与两条限里最大的', () => {
    const m = meterModel({ value: 50, max: 200, soft: 100, hard: 150 })
    expect([m.value, m.soft, m.hard]).toEqual([0.25, 0.5, 0.75])
    expect(meterModel({ value: 300, max: 200 }).value).toBe(1)
    expect(meterModel({ value: -5, max: 200 }).value).toBe(0)
    expect(meterModel({ value: 120, soft: 80, hard: 100 }).max).toBe(120)
    expect(meterModel({ value: 0, max: 0 }).value).toBe(0)
    expect(meterModel({ value: 10, max: 100 }).soft).toBeNull()
  })

  it('渲染：bar 带点阵填充与两根刻度，role=meter 有读屏句，状态词跟状态走；超限的 tone 换成 warn', () => {
    const html = renderToStaticMarkup(
      <Meter
        value={82}
        max={120}
        soft={80}
        hard={100}
        tone="ok"
        label="敞口"
        valueText="已用 82"
        formatValue={String}
        stateLabels={{ warn: '接近' }}
      />,
    )
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="82"')
    expect(html).toContain('aria-valuetext="已用 82"')
    expect(html).toContain('data-state="warn"')
    expect(html).toContain('data-tone="warn"')
    expect(html).toContain('k-dotfill')
    expect(html).toContain('>接近<')
    expect(html).toContain('is-soft')
    expect(html).toContain('is-hard')
  })

  it('gauge：弱势转 weak、受锁转 locked，刻度 0 到 100；sync：分段齿条按比例点亮，评估点画刻度', () => {
    const weak = renderToStaticMarkup(
      <Meter display="gauge" value={27} weakBelow={30} label="军工" valueText="27" formatValue={String} />,
    )
    expect(weak).toContain('data-pin="weak"')
    expect(weak).toContain('>100<')
    const locked = renderToStaticMarkup(
      <Meter display="gauge" value={60} locked label="x" valueText="60" formatValue={String} />,
    )
    expect(locked).toContain('data-pin="locked"')
    const sync = renderToStaticMarkup(
      <Meter display="sync" value={50} mark={80} label="p" valueText="50" formatValue={String} />,
    )
    expect(sync.match(/data-on="true"/g)).toHaveLength(10)
    expect(sync).toContain('data-slot="meter-mark"')
    expect(sync).toContain('data-slot="meter-big"')
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

  it('档位：按 |值| 占最大值的比例分 4 档，0 单独一档，涨跌符号分开；最大值是 0 时全是 0 档', () => {
    expect(calendarLevel(100, 100)).toBe(4)
    expect(calendarLevel(-100, 100)).toBe(-4)
    expect(calendarLevel(25, 100)).toBe(1)
    expect(calendarLevel(26, 100)).toBe(2)
    expect(calendarLevel(0.001, 100)).toBe(1)
    expect(calendarLevel(0, 100)).toBe(0)
    expect(calendarLevel(5, 0)).toBe(0)
    expect(calendarLevel(Number.NaN, 100)).toBe(0)
  })

  it('键盘：←→ 一周、↑↓ 一天、Home / End 头尾，夹在区间里；没选中先落到最后一天；Esc 清掉', () => {
    const [from, to] = ['2026-01-01', '2026-12-31']
    expect(calendarKey('2026-06-10', 'ArrowRight', from, to)).toBe('2026-06-17')
    expect(calendarKey('2026-06-10', 'ArrowLeft', from, to)).toBe('2026-06-03')
    expect(calendarKey('2026-06-10', 'ArrowDown', from, to)).toBe('2026-06-11')
    expect(calendarKey('2026-06-10', 'ArrowUp', from, to)).toBe('2026-06-09')
    expect(calendarKey('2026-01-03', 'ArrowLeft', from, to)).toBe(from)
    expect(calendarKey('2026-12-30', 'ArrowDown', from, to)).toBe(to)
    expect(calendarKey('2026-06-10', 'Home', from, to)).toBe(from)
    expect(calendarKey(null, 'ArrowLeft', from, to)).toBe(to)
    expect(calendarKey('2026-06-10', 'Escape', from, to)).toBeNull()
    expect(calendarKey(null, 'Escape', from, to)).toBeUndefined()
    expect(calendarKey('2026-06-10', 'x', from, to)).toBeUndefined()
  })

  it('渲染：每天一格带档位，没数据的日子是 none；色例有 9 格', () => {
    const html = renderToStaticMarkup(
      <CalendarHeatmap
        days={[
          { date: '2026-11-16', value: 100 },
          { date: '2026-11-17', value: -30 },
          { date: '2026-11-18', value: 0 },
        ]}
        from="2026-11-16"
        to="2026-11-19"
        weekdayLabels={['日', '一', '二', '三', '四', '五', '六']}
        monthLabels={Array.from({ length: 12 }, (_, i) => `${i + 1}月`)}
        describe={(date, value) => `${date} ${value}`}
        label="示例"
        legend={{ down: '亏', up: '盈' }}
      />,
    )
    expect(html.match(/data-slot="calendar-cell"/g)).toHaveLength(4)
    expect(html).toContain('data-date="2026-11-16" data-level="4"')
    expect(html).toContain('data-date="2026-11-17" data-level="-2"')
    expect(html).toContain('data-date="2026-11-18" data-level="0"')
    expect(html).toContain('data-date="2026-11-19" data-level="none"')
    expect(html.match(/<i data-level/g)).toHaveLength(9)
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
