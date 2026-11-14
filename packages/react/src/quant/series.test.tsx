// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { BulletMeter } from './bullet-meter'
import { bulletModel } from './bullet-model'
import { BrushChart } from './brush-chart'
import { centerWindow, clampWindow, moveWindow, resizeWindow } from './brush-model'
import { WaterfallChart } from './waterfall-chart'
import { waterfallBars, waterfallExtent } from './waterfall-model'
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

describe('瀑布累加', () => {
  const steps = [
    { key: 'open', label: '期初', value: 1000, kind: 'total' as const },
    { key: 'real', label: '已实现', value: 250 },
    { key: 'fee', label: '手续费', value: -40 },
    { key: 'fund', label: '资金费', value: -10 },
    { key: 'end', label: '期末', value: 1200, kind: 'total' as const },
  ]

  it('增减柱从上一步的累计走到加上它之后；总计柱从 0 起，累计重置成它自己', () => {
    const bars = waterfallBars(steps)
    expect(bars.map((bar) => [bar.from, bar.to, bar.end])).toEqual([
      [0, 1000, 1000],
      [1000, 1250, 1250],
      [1250, 1210, 1210],
      [1210, 1200, 1200],
      [0, 1200, 1200],
    ])
    expect(bars.map((bar) => bar.direction)).toEqual(['total', 'up', 'down', 'down', 'total'])
  })

  it('总计柱对不上时差额原样给出，不抹平；对得上是 0', () => {
    expect(waterfallBars(steps)[4]!.gap).toBe(0)
    expect(waterfallBars(steps)[0]!.gap).toBe(0)
    const off = waterfallBars([...steps.slice(0, 4), { key: 'end', label: '期末', value: 1230, kind: 'total' }])
    expect(off[4]!.gap).toBe(30)
    expect(off[4]!.to).toBe(1230)
  })

  it('范围包住所有柱的两端和 0；一步为 0 是 flat', () => {
    expect(waterfallExtent(waterfallBars(steps))).toEqual([0, 1250])
    expect(
      waterfallExtent(
        waterfallBars([
          { key: 'a', label: 'a', value: -5 },
          { key: 'b', label: 'b', value: -5 },
        ]),
      ),
    ).toEqual([-10, 0])
    expect(waterfallBars([{ key: 'a', label: 'a', value: 0 }])[0]!.direction).toBe('flat')
  })

  it('渲染：每步一根柱，涨跌总计各带方向；对不上的总计柱带 data-gap；读屏列表写满每一步', () => {
    const html = renderToStaticMarkup(
      <WaterfallChart
        steps={[...steps.slice(0, 4), { key: 'end', label: '期末', value: 1230, kind: 'total' }]}
        label="盈亏桥"
        formatValue={(v) => String(v)}
        formatGap={(g) => `差 ${g}`}
      />,
    )
    expect(html.match(/data-slot="waterfall-bar"/g)).toHaveLength(5)
    expect(html).toContain('data-key="fee" data-direction="down"')
    expect(html).toContain('data-key="end" data-direction="total" data-gap="true"')
    expect(html).toContain('<li>期末  1230  差 30</li>')
  })
})

describe('子弹图仪表', () => {
  it('状态按「达到」算：已用 ≥ 软限是 warn，≥ 硬限是 breach；没给限就是 ok', () => {
    expect(bulletModel({ value: 79, soft: 80, hard: 100 }).state).toBe('ok')
    expect(bulletModel({ value: 80, soft: 80, hard: 100 }).state).toBe('warn')
    expect(bulletModel({ value: 100, soft: 80, hard: 100 }).state).toBe('breach')
    expect(bulletModel({ value: 5 }).state).toBe('ok')
    expect(bulletModel({ value: 90, hard: 100 }).state).toBe('ok')
  })

  it('位置：按满刻度，越界按边；满刻度没给取已用与两条限里最大的', () => {
    const m = bulletModel({ value: 50, max: 200, soft: 100, hard: 150 })
    expect([m.value, m.soft, m.hard]).toEqual([0.25, 0.5, 0.75])
    expect(bulletModel({ value: 300, max: 200 }).value).toBe(1)
    expect(bulletModel({ value: -5, max: 200 }).value).toBe(0)
    expect(bulletModel({ value: 120, soft: 80, hard: 100 }).max).toBe(120)
    expect(bulletModel({ value: 0, max: 0 }).value).toBe(0)
    expect(bulletModel({ value: 10, max: 100 }).soft).toBeNull()
  })

  it('渲染：role=meter 带读屏句，三段底按限画，状态词跟状态走', () => {
    const html = renderToStaticMarkup(
      <BulletMeter
        value={82}
        max={120}
        soft={80}
        hard={100}
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
    expect(html).toContain('>接近<')
    expect(html).toContain('class="k-bullet-zone is-warn"')
    expect(html).toContain('class="k-bullet-zone is-breach"')
  })
})
