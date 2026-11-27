// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { UptimeBars } from './uptime-bars.tsx'
import { countStatuses, moveCell, uptimeShare, type UptimeCell } from './uptime-bars-model.ts'

const view = {
  actionLabels: { group: '操作', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
  tableLabel: '表',
  tableHead: ['名称', '值'],
}

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
  const html = renderToStaticMarkup(<UptimeBars {...view} cells={cells} label="行情源 近 4 天" idle="可用率 33%" />)
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

describe('图右上三件', () => {
  it('表格视图按钮总有；导出与全屏的回调不给就没有那两个按钮', () => {
    const html = renderToStaticMarkup(<UptimeBars {...view} cells={cells} label="x" />)
    expect(html).toContain('data-action="table"')
    expect(html).not.toContain('data-action="export"')
    expect(html).not.toContain('data-action="fullscreen"')
    expect(renderToStaticMarkup(<UptimeBars {...view} cells={cells} label="x" onExport={() => {}} />)).toContain(
      'data-action="export"',
    )
  })
  it('复制图（#87）：给了 onCopyImage 与 actionLabels.copyImage 才出相机钮', () => {
    expect(renderToStaticMarkup(<UptimeBars {...view} cells={cells} label="x" onCopyImage={() => {}} />)).not.toContain(
      'data-action="copy-image"',
    )
    const labels = { ...view.actionLabels, copyImage: '复制图片' }
    expect(
      renderToStaticMarkup(
        <UptimeBars {...view} actionLabels={labels} cells={cells} label="x" onCopyImage={() => {}} />,
      ),
    ).toContain('data-action="copy-image"')
  })
})

describe('状态灯加词', () => {
  const words = { up: '正常', degraded: '降级', down: '断开', none: '无数据' }
  it('countStatuses 数每种状态的格数', () => {
    expect(countStatuses(cells)).toEqual({ up: 1, degraded: 1, down: 1, none: 1 })
    expect(countStatuses([])).toEqual({ up: 0, degraded: 0, down: 0, none: 0 })
  })
  it('给了 statusLabels 就画四行「灯 词 格数」，条两端写时间；不给就没有', () => {
    const html = renderToStaticMarkup(
      <UptimeBars
        {...view}
        cells={cells}
        label="x"
        statusLabels={words}
        availability="33.3 %"
        range={['2026-11-12', '2026-11-15']}
      />,
    )
    for (const word of Object.values(words)) expect(html).toContain(word)
    expect(html.match(/data-legend=/g)).toHaveLength(4)
    expect(html).toContain('33.3 %')
    expect(html).toContain('2026-11-15')
    expect(renderToStaticMarkup(<UptimeBars {...view} cells={cells} label="x" />)).not.toContain('data-legend')
  })
})
