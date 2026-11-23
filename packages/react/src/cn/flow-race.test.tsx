// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { FlowRace } from './flow-race.tsx'
import {
  flowDomain,
  flowLines,
  flowPath,
  flowX,
  rankLines,
  spreadFlowLabels,
  type FlowSeries,
} from './flow-race-model.ts'
import { parseClock } from './session.ts'

// #110 第 2 批第 4 项：板块资金多线图。示例数据，板块与金额都是虚构的。
const mk = (key: string, name: string, values: [string, number | null][]): FlowSeries => ({
  key,
  name,
  points: values.map(([time, value]) => ({ time, value })),
})
const SERIES: FlowSeries[] = [
  mk('a', '示例甲', [
    ['09:30', 0],
    ['11:30', 3e8],
    ['13:00', 3.5e8],
    ['15:00', 5e8],
  ]),
  mk('b', '示例乙', [
    ['09:30', 0],
    ['11:30', -1e8],
    ['15:00', -2e8],
  ]),
  mk('c', '示例丙', [
    ['09:30', 0],
    ['11:30', 2e8],
    ['15:00', 4.9e8],
  ]),
  mk('d', '示例丁', [
    ['09:30', 0],
    ['11:30', 1e7],
    ['11:45', null],
  ]),
]

describe('资金多线图的纯函数', () => {
  it('flowX：09:30 在 0、15:00 在 1，11:30 与 13:00 贴在一起（午休不占宽度），09:30 前丢掉', () => {
    expect(flowX(parseClock('09:30'))).toBe(0)
    expect(flowX(parseClock('15:00'))).toBe(1)
    expect(flowX(parseClock('11:30'))).toBe(0.5)
    expect(flowX(parseClock('13:00'))).toBe(0.5)
    expect(flowX(parseClock('09:20'))).toBeNull()
    expect(flowX(null)).toBeNull()
  })

  it('rankLines：按最新值从大到小；最新值取不到的排最后（不当 0）', () => {
    const ranked = rankLines(flowLines(SERIES))
    expect(ranked.map((line) => line.key)).toEqual(['a', 'c', 'd', 'b'])
    const blank = rankLines(flowLines([mk('x', '空', [['10:00', null]]), mk('y', '负', [['10:00', -5]])]))
    expect(blank.map((line) => line.key)).toEqual(['y', 'x'])
  })

  it('flowDomain 含 0；flowPath 遇到取不到的点断线', () => {
    const lines = flowLines(SERIES)
    const domain = flowDomain(lines)!
    expect(domain[0]).toBeLessThan(-2e8)
    expect(domain[1]).toBeGreaterThan(5e8)
    const d = flowPath(lines[3]!, domain, 100, 100)
    expect(d.match(/M/g)).toHaveLength(1)
    const broken = flowLines([
      mk('z', 'z', [
        ['09:30', 1],
        ['10:00', null],
        ['10:30', 2],
      ]),
    ])[0]!
    expect(flowPath(broken, [0, 2], 100, 100).match(/M/g)).toHaveLength(2)
    expect(flowDomain([])).toBeNull()
  })

  it('spreadFlowLabels：挤在一起的标签被推开到至少 gap，次序不变，不出界', () => {
    const out = spreadFlowLabels([100, 101, 102, 103], 18, 9, 231)
    for (let i = 1; i < out.length; i++) expect(out[i]! - out[i - 1]!).toBeGreaterThanOrEqual(18 - 1e-9)
    expect(out[0]!).toBeGreaterThanOrEqual(9)
    // 贴着下沿的一组被往上推。
    const low = spreadFlowLabels([229, 230, 231], 18, 9, 231)
    expect(low.at(-1)!).toBeLessThanOrEqual(231)
    expect(low[0]!).toBeLessThan(229)
    // 放不下就压小间距，仍不出界、不重叠。
    const tight = spreadFlowLabels([0, 0, 0, 0, 0], 18, 0, 20)
    expect(tight.at(-1)!).toBeLessThanOrEqual(20)
    expect(new Set(tight).size).toBe(5)
    expect(spreadFlowLabels([], 18, 0, 10)).toEqual([])
  })
})

describe('FlowRace', () => {
  it('右端标签按最新值排名：1 是最大者，写名字与带正负号的万 / 亿', () => {
    const html = renderToStaticMarkup(<FlowRace series={SERIES} />)
    const labels = [...html.matchAll(/data-slot="flow-label" data-key="(\w)" data-rank="(\d)"/g)].map(
      (m) => `${m[2]}${m[1]}`,
    )
    expect(labels).toEqual(['1a', '2c', '3d', '4b'])
    expect(html).toContain('+5.00亿')
    expect(html).toContain('-2.00亿')
    expect(html.match(/data-slot="flow-line"/g)).toHaveLength(4)
    expect(html).toContain('data-slot="flow-line" data-key="b" data-rank="4" data-tone="down"')
  })

  it('limit 只留前几名；没有序列写空态', () => {
    expect(renderToStaticMarkup(<FlowRace series={SERIES} limit={2} />).match(/data-slot="flow-line"/g)).toHaveLength(2)
    expect(renderToStaticMarkup(<FlowRace series={[]} />)).toContain('暂无资金数据')
  })
})
