// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import type { GridColumn } from './columns.ts'
import type { GridColumnLayout } from './data-grid-props.ts'
import {
  buildGroups,
  countPassed,
  flattenGroups,
  groupItemId,
  groupKeyOfId,
  normalizeGroupKey,
} from './grouped-model.ts'
import { GroupedTable } from './grouped-table.tsx'

// 分组表（#260）：示例数据，不是行情。
type Row = { id: string; name: string; board: string | null; chg: number; amount: number; promoted: boolean }
const ROWS: Row[] = [
  { id: 'a1', name: 'A1', board: '3', chg: 10, amount: 1, promoted: true },
  { id: 'b1', name: 'B1', board: '2', chg: 10, amount: 5, promoted: true },
  { id: 'b2', name: 'B2', board: '2', chg: 9, amount: 6, promoted: false },
  { id: 'x1', name: 'X1', board: null, chg: 1, amount: 100, promoted: false },
  { id: 'c1', name: 'C1', board: '1', chg: 5, amount: 2, promoted: false },
  { id: 'c2', name: 'C2', board: '1', chg: 4, amount: 3, promoted: true },
  { id: 'c3', name: 'C3', board: '1', chg: 3, amount: 4, promoted: false },
  { id: 'x2', name: 'X2', board: '  ', chg: 0, amount: 200, promoted: false },
]
const columns: GridColumn<Row>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'chg', type: 'change', value: (row) => row.chg },
  { id: 'amount', type: 'number', value: (row) => row.amount },
]
const layout: GridColumnLayout[] = [
  { id: 'name', label: 'Name', width: 120, visible: true },
  { id: 'chg', label: 'Chg%', width: 80, visible: true },
  { id: 'amount', label: 'Amount', width: 80, visible: true },
]
const rowIds = (html: string) => [...html.matchAll(/data-row="([^"]+)"/g)].map((match) => match[1])

describe('分组模型', () => {
  it('没有组键（null、undefined、空白）的行进尾部「其他」，永远在最后', () => {
    expect(normalizeGroupKey('  ')).toBeNull()
    expect(normalizeGroupKey(undefined)).toBeNull()
    expect(normalizeGroupKey(' 2 ')).toBe('2')
    const groups = buildGroups(ROWS, { groupBy: (row) => row.board, order: 'asc' })
    expect(groups.map((group) => group.key)).toEqual(['3', '2', '1', null])
    expect(groups[3]!.rows.map((row) => row.id)).toEqual(['x1', 'x2'])
  })

  it('组按汇总数排序（默认大的在前，默认数是行数）；同数保持首次出现的次序；null 排在有数的后面', () => {
    expect(buildGroups(ROWS, { groupBy: (row) => row.board }).map((group) => group.key)).toEqual(['1', '2', '3', null])
    const byAmount = buildGroups(ROWS, {
      groupBy: (row) => row.board,
      metric: (group) => group.rows.reduce((sum, row) => sum + row.amount, 0),
    })
    // 3 组：1 → 9、2 → 11、3 → 1
    expect(byAmount.map((group) => group.key)).toEqual(['2', '1', '3', null])
    const tie = buildGroups(
      [
        { id: 'p', board: 'P' },
        { id: 'q', board: 'Q' },
      ],
      { groupBy: (row) => row.board },
    )
    expect(tie.map((group) => group.key)).toEqual(['P', 'Q'])
    const nulls = buildGroups(ROWS, {
      groupBy: (row) => row.board,
      metric: (group) => (group.key === '2' ? null : group.count),
      order: 'desc',
    })
    expect(nulls.map((group) => group.key)).toEqual(['1', '3', '2', null])
  })

  it('摊平：标题行在前、行跟在后；标题 id 与组键互相换算；没有行就没有组', () => {
    const items = flattenGroups(buildGroups(ROWS, { groupBy: (row) => row.board, order: 'asc' }))
    expect(items.map((item) => (item.kind === 'group' ? item.id : item.row.id))).toEqual([
      'group:3',
      'a1',
      'group:2',
      'b1',
      'b2',
      'group:1',
      'c1',
      'c2',
      'c3',
      groupItemId(null),
      'x1',
      'x2',
    ])
    expect(groupKeyOfId('group:2')).toBe('2')
    expect(groupKeyOfId(groupItemId(null))).toBeNull()
    expect(groupKeyOfId('a1')).toBeUndefined()
    expect(buildGroups([], { groupBy: () => 'x' })).toEqual([])
    expect(countPassed(ROWS.slice(0, 3), (row) => row.promoted)).toEqual({ k: 2, n: 3 })
  })
})

const render = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    <GroupedTable
      columns={columns}
      layout={layout}
      rows={ROWS}
      rowId={(row) => row.id}
      label="Ladder"
      groupBy={(row) => row.board}
      groupHeading={(group) => `${group.key} boards`}
      otherLabel="Ungrouped"
      groupMetric={(group) => Number(group.key)}
      {...extra}
    />,
  )

describe('GroupedTable', () => {
  it('组头带标题、行数与汇总；组按汇总数排；「其他」放最后，标题用 otherLabel', () => {
    const html = render({
      groupSummary: (group: { rows: readonly Row[] }) => {
        const { k, n } = countPassed(group.rows, (row) => row.promoted)
        return `${k}/${n} promoted`
      },
    })
    expect(rowIds(html)).toEqual([
      'group:3',
      'a1',
      'group:2',
      'b1',
      'b2',
      'group:1',
      'c1',
      'c2',
      'c3',
      expect.stringContaining('other'),
      'x1',
      'x2',
    ])
    expect(html).toContain('3 boards')
    expect(html).toContain('Ungrouped')
    expect([...html.matchAll(/data-slot="grid-section-count">(\d+)</g)].map((m) => m[1])).toEqual(['1', '2', '3', '2'])
    expect([...html.matchAll(/data-slot="grid-section-summary">([^<]*)</g)].map((m) => m[1])).toEqual([
      '1/1 promoted',
      '1/2 promoted',
      '1/3 promoted',
      '0/2 promoted',
    ])
  })

  it('收起的组只留组头（组键受控，「其他」的键是空串）；组头不会让调用方的列函数收到合成行', () => {
    const seen: unknown[] = []
    const guarded: GridColumn<Row>[] = [
      {
        id: 'name',
        type: 'text',
        value: (row) => {
          seen.push(row)
          return row.name.toUpperCase()
        },
      },
      ...columns.slice(1),
    ]
    const html = render({ columns: guarded, collapsed: new Set(['2', '']) })
    expect(rowIds(html)).toEqual(['group:3', 'a1', 'group:2', 'group:1', 'c1', 'c2', 'c3', expect.any(String)])
    expect(seen.every((row) => typeof (row as Row).id === 'string' && (row as Row).name !== undefined)).toBe(true)
  })

  it('按列排序：组头与组的次序不动，行在组内排；组内汇总（groupAggregates）与表尾合计只算数据行', () => {
    const html = render({
      sort: { id: 'chg', desc: false },
      onSortChange: () => {},
      groupAggregates: { amount: 'sum' },
      summary: [{ id: 'total', label: 'Total', columns: { amount: 'sum' } }],
    })
    expect(rowIds(html).slice(0, 5)).toEqual(['group:3', 'a1', 'group:2', 'b2', 'b1'])
    const sums = [
      ...html.matchAll(/data-col="amount" class="k-grid-cell k-grid-section-aggregate[^"]*"[^>]*>(.*?)<\/div>/g),
    ].map((m) => m[1]!.replace(/<[^>]+>/g, ''))
    expect(sums).toEqual(['1', '11', '9', '300'])
    // 表尾：全部数据行的金额之和 1+5+6+100+2+3+4+200 = 321
    expect(html).toMatch(/Total[\s\S]*321/)
  })

  it('回调只给数据行：onCollapsedChange 与 onOpen 不会收到合成的组头', () => {
    // 服务端渲染没有点击；这里只确认带上回调不改变结构，真实点击见浏览器测试与文档站页。
    const html = render({ onOpen: () => {}, onCollapsedChange: () => {}, isOpened: () => false })
    expect(html).toContain('aria-expanded="true"')
  })
})
