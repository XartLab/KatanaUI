// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AttributionBars } from './attribution-bars.tsx'
import { attributionBar, attributionRows, attributionScale } from './attribution-model.ts'

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

  it('渲染：编号强调色、点阵列头、已平仓行删除线加行内小标签、汇总行、SOURCE 行，表格视图按钮总有', () => {
    const closed = items.map((item) => (item.key === 'c' ? { ...item, closed: '已平 09-18' } : item))
    const html = renderToStaticMarkup(
      <AttributionBars
        items={closed}
        title="P&L ATTRIBUTION"
        meta={(max) => `归因 · 刻度 ±${max}`}
        label="归因"
        formatValue={String}
        otherLabel={(n) => `其他 ×${n}`}
        formatShare={String}
        shareLabel="占比"
        readouts={[{ key: 'sum', label: '合计', text: '+120', value: 120 }]}
        focusKey="a"
        heads={{ index: 'IDX', item: '项', value: '值', share: '占比 |贡献|', shareTitle: '占总贡献绝对值之和' }}
        footer={{ count: '5 项', source: 'SOURCE · 台账', note: '研究账本不计入' }}
        actionLabels={{ group: '图工具', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' }}
      />,
    )
    expect(html.match(/data-slot="attribution-bar"/g)).toHaveLength(5)
    expect(html).toContain('k-dotfill')
    expect(html).toContain('data-focus="true"')
    expect(html).toContain('data-tone="down"')
    expect(html).toContain('归因 · 刻度 ±300')
    expect(html).toContain('5 项 · 研究账本不计入')
    expect(html).toContain('title="占总贡献绝对值之和"')
    expect(html).toContain('data-closed="true"')
    expect(html).toContain('已平 09-18')
    expect(html).not.toContain('attribution-closed-note')
    expect(html).toContain('data-slot="attribution-readout"')
    expect(html).toContain('SOURCE · 台账')
    expect(html).toContain('P&amp;L ATTRIBUTION')
    expect(html).toContain('aria-label="表格视图"')
    expect(html).not.toContain('导出')
  })
})
