// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { MiniKCardGrid, type MiniKItem } from './mini-k-card-grid.tsx'
import {
  candleDomain,
  candleShapes,
  candleTone,
  changeText,
  gridColumns,
  lastChange,
  validCandles,
  type Candle,
} from './mini-k-model.ts'

// #110 第 2 批第 5 项：选股结果卡片网格。示例数据，蜡烛都是虚构的。
const UP: Candle[] = [
  { open: 10, high: 10.6, low: 9.9, close: 10.5 },
  { open: 10.5, high: 11.2, low: 10.4, close: 11 },
  { open: 11, high: 11.1, low: 10.2, close: 10.4 },
]

describe('小 K 线的纯函数', () => {
  it('candleTone：收高于开涨、低于开跌、相等 flat', () => {
    expect(candleTone({ open: 1, close: 2 })).toBe('up')
    expect(candleTone({ open: 2, close: 1 })).toBe('down')
    expect(candleTone({ open: 2, close: 2 })).toBe('flat')
  })

  it('validCandles 丢掉取不到的数与最高价低于最低价的蜡烛', () => {
    const bad = [...UP, { open: NaN, high: 1, low: 0, close: 1 }, { open: 1, high: 0, low: 2, close: 1 }]
    expect(validCandles(bad)).toHaveLength(3)
    expect(validCandles(null)).toEqual([])
  })

  it('candleShapes：影线覆盖最高到最低，实体盖住开收；价高的蜡烛在上（y 小）', () => {
    const geometry = candleShapes(UP, 120, 56)!
    const [first, second] = geometry.shapes
    expect(first!.wickTop).toBeLessThan(first!.bodyTop)
    expect(first!.wickBottom).toBeGreaterThan(first!.bodyTop + first!.bodyHeight - 1e-9)
    expect(second!.bodyTop).toBeLessThan(first!.bodyTop)
    expect(second!.bodyX).toBeGreaterThan(first!.bodyX)
    expect(geometry.shapes.map((shape) => shape.tone)).toEqual(['up', 'up', 'down'])
    expect(candleDomain([])).toBeNull()
    expect(candleShapes([], 120, 56)).toBeNull()
  })

  it('平盘的蜡烛实体至少 1 高，看得见', () => {
    const shapes = candleShapes([{ open: 5, high: 5, low: 5, close: 5 }], 120, 56)!.shapes
    expect(shapes[0]!.bodyHeight).toBeGreaterThanOrEqual(1)
  })

  it('lastChange / changeText / gridColumns', () => {
    expect(lastChange(UP)).toBeCloseTo(((10.4 - 11) / 11) * 100)
    expect(lastChange(UP.slice(0, 1))).toBeNull()
    expect(changeText(3.214)).toBe('+3.21%')
    expect(changeText(-1.05)).toBe('-1.05%')
    expect(changeText(0)).toBe('0.00%')
    expect(changeText(null)).toBe('—')
    expect(gridColumns(undefined)).toBe(3)
    expect(gridColumns(1)).toBe(2)
    expect(gridColumns(9)).toBe(4)
  })
})

describe('MiniKCardGrid', () => {
  const ITEMS: MiniKItem[] = [
    { code: '000001', name: '示例甲', candles: UP },
    { code: '000002', name: '示例乙', candles: UP.slice(0, 2), change: 5.5, price: 12.3 },
    { code: '000003', name: '示例丙', candles: [] },
  ]

  it('一行几只由 columns 定（2 / 3 / 4），每张卡一个小 K 线；没有蜡烛的卡写「暂无 K 线」', () => {
    for (const columns of [2, 3, 4] as const) {
      const html = renderToStaticMarkup(<MiniKCardGrid items={ITEMS} columns={columns} />)
      expect(html).toContain(`data-columns="${columns}"`)
      expect(html).toContain(`--mink-cols:${columns}`)
    }
    const html = renderToStaticMarkup(<MiniKCardGrid items={ITEMS} />)
    expect(html.match(/data-slot="mini-k-chart"/g)).toHaveLength(2)
    expect(html).toContain('暂无 K 线')
    expect(html.match(/data-slot="mini-k-card"/g)).toHaveLength(3)
  })

  it('涨跌幅：给了就用，没给用最后两根收盘算，算不出写「—」；最新价取最后一根收盘', () => {
    const html = renderToStaticMarkup(<MiniKCardGrid items={ITEMS} />)
    expect(html).toContain('data-slot="mini-k-change">-5.45%<')
    expect(html).toContain('data-slot="mini-k-change">+5.50%<')
    expect(html).toContain('data-slot="mini-k-change">—<')
    expect(html).toContain('data-slot="mini-k-price">10.40<')
    expect(html).toContain('data-slot="mini-k-price">12.30<')
    expect(html).toContain('data-tone="down"')
  })

  it('给了 onSelect 卡片是按钮；不给是普通块；没有票写空态', () => {
    expect(renderToStaticMarkup(<MiniKCardGrid items={ITEMS} onSelect={() => {}} />)).toContain('<button')
    expect(renderToStaticMarkup(<MiniKCardGrid items={ITEMS} />)).not.toContain('<button')
    expect(renderToStaticMarkup(<MiniKCardGrid items={[]} />)).toContain('暂无选股结果')
  })
})
