// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { UptimeBars } from './uptime-bars'
import { moveCell, uptimeShare, type UptimeCell } from './uptime-bars-model'

const cells: UptimeCell[] = [
  { id: '1', status: 'up', label: '11-12 正常' },
  { id: '2', status: 'down', label: '11-13 断流 3 次' },
  { id: '3', status: 'none', label: '11-14 无数据' },
  { id: '4', status: 'degraded', label: '11-15 降级' },
]

describe('uptimeShare', () => {
  it('只数 up，none 不进分母，degraded 与 down 都不算可用', () => {
    expect(uptimeShare(cells)).toBeCloseTo(1 / 3)
  })
  it('没有数据返回 null', () => {
    expect(uptimeShare([])).toBeNull()
    expect(uptimeShare([{ id: 'x', status: 'none', label: '' }])).toBeNull()
  })
})

describe('moveCell', () => {
  it('左右走、Home / End 跳头尾、到头不绕回、其他键不管', () => {
    expect(moveCell(0, 'ArrowLeft', 4)).toBe(0)
    expect(moveCell(3, 'ArrowRight', 4)).toBe(3)
    expect(moveCell(1, 'ArrowRight', 4)).toBe(2)
    expect(moveCell(2, 'Home', 4)).toBe(0)
    expect(moveCell(2, 'End', 4)).toBe(3)
    expect(moveCell(2, 'a', 4)).toBeNull()
  })
})

describe('UptimeBars', () => {
  const html = renderToStaticMarkup(<UptimeBars cells={cells} label="行情源 近 4 天" idle="可用率 33%" />)
  it('一格一个带整句名的图形，状态写在 data-status，只有最新一格在 Tab 序里', () => {
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="行情源 近 4 天"')
    expect(html.match(/role="img"/g)).toHaveLength(4)
    expect(html).toContain('aria-label="11-13 断流 3 次"')
    expect(html.match(/data-status="down"/g)).toHaveLength(1)
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html.match(/tabindex="-1"/g)).toHaveLength(3)
  })
  it('没有悬停时读数行写 idle', () => {
    expect(html).toContain('可用率 33%')
  })
})
