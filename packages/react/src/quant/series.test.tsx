// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { BrushChart } from './brush-chart'
import { centerWindow, clampWindow, moveWindow, resizeWindow } from './brush-model'
import { areaPath, extent, linePath, makePlot, niceTicks, PLOT_W } from './series-geometry'

// #1917：时间序列与盈亏的件的几何与结构（纯函数）。拖拽、悬停、键盘与画出来的像素在 e2e/ui-gallery.spec.ts 里用真浏览器验。

describe('序列几何', () => {
  it('好看的刻度：整齐步长，区间包住数据', () => {
    const { domain, ticks, step } = niceTicks(3, 97, 5)
    expect(step).toBe(20)
    expect(domain).toEqual([0, 100])
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(-0.12, 0.31, 4).ticks).toEqual([-0.2, 0, 0.2, 0.4])
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
