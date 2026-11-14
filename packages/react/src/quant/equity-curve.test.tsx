// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { EquityCurve, type EquityCurvePoint } from './equity-curve.tsx'
import { canLog, defaultTimeTicks, drawdownY, equityPlot, timeX } from './equity-curve-model.ts'
import { PLOT_W } from './series-geometry.ts'

const T0 = Date.UTC(2026, 9, 8, 3)
const point = (equity: number, drawdown: number, index: number): EquityCurvePoint => ({
  time: T0 + index * 60_000,
  equity,
  drawdown,
  title: `第 ${index} 笔`,
  equityText: equity.toFixed(2),
  drawdownText: drawdown.toFixed(2),
})

describe('EquityCurve 的纯逻辑', () => {
  it('横轴按时刻摆：间隔不同间距就不同；只有一个时刻放中间（#725）', () => {
    expect(timeX(T0, T0, T0 + 60_000)).toBe(0)
    expect(timeX(T0 + 15_000, T0, T0 + 60_000)).toBe(PLOT_W / 4)
    expect(timeX(T0 + 60_000, T0, T0 + 60_000)).toBe(PLOT_W)
    expect(timeX(T0, T0, T0)).toBe(PLOT_W / 2)
  })

  it('对数轴要全部大于 0；刻度是 1、2、5 × 10ⁿ，位置按 ln 摆（等比间隔等距）', () => {
    expect(canLog([1, 2])).toBe(true)
    expect(canLog([0, 2])).toBe(false)
    expect(canLog([])).toBe(false)
    const plot = equityPlot([100, 1000], 'log', 100, { top: 0, bottom: 0 }, (i) => i)
    const y = (value: number) => plot.ticks.find((tick) => tick.value === value)!.y
    // 100 → 200 与 200 → 500 的比不同，但 100 → 1000 的中点是 √(100×1000)：ln 等距。
    expect(y(100) - y(1000)).toBeGreaterThan(0)
    expect(plot.yAt(Math.sqrt(100 * 1000))).toBeCloseTo((plot.yAt(100) + plot.yAt(1000)) / 2, 6)
    // 线性对照：中点是算术平均。
    const lin = equityPlot([100, 1000], 'linear', 100, { top: 0, bottom: 0 }, (i) => i)
    expect(lin.yAt(550)).toBeCloseTo((lin.yAt(100) + lin.yAt(1000)) / 2, 6)
  })

  it('有 ≤ 0 的值时要求对数也退回线性：不出 NaN，线性中点还是算术平均', () => {
    const plot = equityPlot([-5, 10], 'log', 100, { top: 0, bottom: 0 }, (i) => i)
    expect(Number.isFinite(plot.yAt(0))).toBe(true)
    expect(plot.yAt(2.5)).toBeCloseTo((plot.yAt(-5) + plot.yAt(10)) / 2, 6)
  })

  it('回撤纵轴：0 在顶，最深在底；没有回撤时全在顶', () => {
    expect(drawdownY(0, -10, 50, 4)).toBe(4)
    expect(drawdownY(-10, -10, 50, 4)).toBe(50)
    expect(drawdownY(-3, 0, 50, 4)).toBe(4)
  })

  it('默认横轴刻度：头尾都在，均分', () => {
    const ticks = defaultTimeTicks(0, 100, 5, (t) => `t${t}`)
    expect(ticks.map((tick) => tick.label)).toEqual(['t0', 't25', 't50', 't75', 't100'])
    expect(defaultTimeTicks(5, 5, 5, String)).toEqual([])
  })
})

describe('EquityCurve 的画法（组件卡 EquityCurve）', () => {
  const labels = {
    drawdown: '回撤',
    time: '时刻',
    scale: { group: '纵轴', linear: '线性', log: '对数' },
    brush: { start: '起', end: '止', window: '窗' },
    actions: { group: '图工具', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
  }
  const render = (points: EquityCurvePoint[], extra: Partial<Parameters<typeof EquityCurve>[0]> = {}) =>
    renderToStaticMarkup(
      <EquityCurve
        points={points}
        title="权益曲线"
        hint="口径"
        name="权益"
        label="曲线"
        axis={(v) => v.toFixed(2)}
        formatTime={(t) => String(t)}
        labels={labels}
        {...extra}
      />,
    )
  const points = [point(100, 0, 0), point(110, 0, 1), point(104, -6, 2), point(120, 0, 3)]

  it('回撤面是纹理（pattern）不是实色；权益线一条；末点标最终值，别的不标', () => {
    const html = render(points)
    const pattern = html.match(/<pattern id="([^"]+)"/)?.[1]
    expect(pattern).toBeTruthy()
    expect(html).toMatch(new RegExp(`data-slot="equity-dd-area"[^>]*fill="url\\(#${pattern}\\)"`))
    expect(html.match(/data-slot="equity-line"/g)).toHaveLength(1)
    expect(html.match(/data-slot="end-marker"/g)).toHaveLength(1)
    expect(html.match(/k-ck-end-value">([^<]*)</)?.[1]).toBe('120.00')
    expect(html).toContain('role="slider"')
    expect(html).toContain('title="口径"')
  })

  it('基准线：给了画一条虚线并写图例；不给就没有', () => {
    expect(render(points)).not.toContain('equity-bench')
    const html = render(points, { benchmark: { name: '基准', values: [100, 101, 102, 103] } })
    expect(html.match(/data-slot="equity-bench"/g)).toHaveLength(1)
    expect(html).toContain('基准')
  })

  it('没有回撤：没有回撤面；一条平线也画得出，不出 NaN', () => {
    expect(render([point(100, 0, 0), point(110, 0, 1)])).not.toContain('equity-dd-area')
    expect(render([point(100, 0, 0), point(100, 0, 1)])).not.toMatch(/NaN|Infinity/)
  })

  it('没有点就什么都不画', () => {
    expect(render([])).toBe('')
  })
})
