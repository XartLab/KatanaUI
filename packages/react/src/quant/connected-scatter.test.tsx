// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ConnectedScatter } from './connected-scatter.tsx'
import { arrowHead, moveScatter, scatterLayout, type ScatterSeries } from './scatter-model.ts'

const view = {
  actionLabels: { group: '操作', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
  tableLabel: '表',
  tableHead: ['名称', '值'],
}

const frame = { width: 200, height: 100, left: 20, top: 10, right: 20, bottom: 20 }
const series: ScatterSeries[] = [
  {
    id: 'a',
    label: '甲',
    points: [
      { x: 0, y: 0, label: 'a0' },
      { x: 10, y: 10, label: 'a1' },
      { x: 20, y: 20, label: 'a2' },
    ],
  },
  { id: 'b', label: '乙', points: [{ x: 10, y: 5, label: 'b0' }] },
]

describe('scatterLayout', () => {
  const layout = scatterLayout(series, frame, { xDomain: [0, 20], yDomain: [0, 20] })
  it('点落在像素框里：x 从左到右、y 向上为大', () => {
    expect(layout.series[0]!.points).toEqual([
      { x: 20, y: 80 },
      { x: 100, y: 45 },
      { x: 180, y: 10 },
    ])
    expect(layout.series[1]!.points).toEqual([{ x: 100, y: 62.5 }])
  })
  it('终点箭头：尖在终点，沿最后一段方向；单点没有箭头', () => {
    const arrow = layout.series[0]!.arrow!
    expect(arrow[0]).toEqual([180, 10])
    expect(arrow[1]![0]).toBeLessThan(180)
    expect(layout.series[1]!.arrow).toBeNull()
  })
  it('刻度落在范围里，不给范围时放宽 5% 且盖住全体点', () => {
    expect(layout.xTicks.map((t) => t.value)).toEqual([0, 5, 10, 15, 20])
    const auto = scatterLayout(series, frame)
    expect(auto.series[0]!.points[0]!.x).toBeGreaterThan(frame.left)
    expect(auto.series[0]!.points[2]!.x).toBeLessThan(frame.width - frame.right)
  })
})

describe('arrowHead', () => {
  it('长度为 0 的方向没有箭头；向右的箭头底边在尖的左边、上下对称', () => {
    expect(arrowHead({ x: 5, y: 5 }, 0, 0, 8)).toBeNull()
    const arrow = arrowHead({ x: 50, y: 50 }, 3, 0, 8)!
    expect(arrow[0]).toEqual([50, 50])
    expect(arrow[1]![0]).toBe(42)
    expect(arrow[2]![0]).toBe(42)
    expect(arrow[1]![1] + arrow[2]![1]).toBeCloseTo(100, 10)
  })
})

describe('moveScatter', () => {
  const counts = [3, 2]
  it('左右沿时间走、到头不绕回；上下换轨迹落在最后一个点；Home / End', () => {
    expect(moveScatter([0, 1], 'ArrowRight', counts)).toEqual([0, 2])
    expect(moveScatter([0, 2], 'ArrowRight', counts)).toEqual([0, 2])
    expect(moveScatter([0, 0], 'ArrowLeft', counts)).toEqual([0, 0])
    expect(moveScatter([0, 2], 'ArrowDown', counts)).toEqual([1, 1])
    expect(moveScatter([1, 1], 'ArrowDown', counts)).toEqual([1, 1])
    expect(moveScatter([1, 1], 'ArrowUp', counts)).toEqual([0, 1])
    expect(moveScatter([0, 1], 'Home', counts)).toEqual([0, 0])
    expect(moveScatter([0, 0], 'End', counts)).toEqual([0, 2])
    expect(moveScatter([0, 0], 'x', counts)).toBeNull()
  })
})

describe('ConnectedScatter', () => {
  const html = renderToStaticMarkup(
    <ConnectedScatter {...view} series={series} label="波动与收益" axes={{ x: '波动', y: '收益' }} />,
  )
  it('每个点一个带整句名的图形，只有一个在 Tab 序里（默认第一条的最后一个点），起点终点有标记', () => {
    expect(html.match(/role="img"/g)).toHaveLength(4)
    expect(html).toContain('aria-label="a1"')
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html).toMatch(/data-kind="end"[^>]*aria-label="a2"[^>]*tabindex="0"|aria-label="a2"[^>]*tabindex="0"/)
    expect(html).toContain('data-kind="start"')
    expect(html).toContain('--series-1')
    expect(html).toContain('--series-2')
  })
})
