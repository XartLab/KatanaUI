// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { applyFilters, conditionText, groupFields, matchCondition, type FilterField } from './filter-bar-model.ts'

describe('matchCondition', () => {
  it('数值运算符', () => {
    expect(matchCondition({ op: 'gt', value: '100' }, 150)).toBe(true)
    expect(matchCondition({ op: 'gt', value: '100' }, 100)).toBe(false)
    expect(matchCondition({ op: 'lte', value: '100' }, 100)).toBe(true)
    expect(matchCondition({ op: 'between', value: '10..100' }, 50)).toBe(true)
    expect(matchCondition({ op: 'between', value: '10..100' }, 5)).toBe(false)
  })
  it('文字运算符与缺值', () => {
    expect(matchCondition({ op: 'eq', value: '科技' }, '科技')).toBe(true)
    expect(matchCondition({ op: 'contains', value: 'AB' }, 'xabx')).toBe(true)
    expect(matchCondition({ op: 'in', value: 'a, b' }, 'b')).toBe(true)
    expect(matchCondition({ op: 'gt', value: '1' }, null)).toBe(false)
    expect(matchCondition({ op: 'gt', value: '1' }, 'abc')).toBe(false)
  })
})

describe('applyFilters', () => {
  const rows = [
    { p: 5, s: 'a' },
    { p: 50, s: 'a' },
    { p: 500, s: 'b' },
  ]
  const get = (row: (typeof rows)[number], f: string) => row[f as 'p']
  it('条件之间是且', () => {
    const c = [
      { id: '1', field: 'p', op: 'gt', value: '10' },
      { id: '2', field: 's', op: 'eq', value: 'a' },
    ]
    expect(applyFilters(rows, c, get)).toEqual([{ p: 50, s: 'a' }])
    expect(applyFilters(rows, [], get)).toHaveLength(3)
  })
})

describe('conditionText / groupFields', () => {
  const field: FilterField = { key: 'p', label: '价格', group: 'G', operators: [{ value: 'gt', label: '大于' }] }
  it('预设写名字，手动写「运算符 值」', () => {
    expect(conditionText({ id: '1', field: 'p', op: 'gt', value: '1', label: '高价股' }, field)).toBe('高价股')
    expect(conditionText({ id: '1', field: 'p', op: 'gt', value: '1' }, field)).toBe('大于 1')
  })
  it('按组归拢并可搜索', () => {
    const fields = [field, { ...field, key: 'q', label: '涨跌', group: undefined }]
    expect(groupFields(fields, '', '其他').map((g) => [g.group, g.fields.length])).toEqual([
      ['G', 1],
      ['其他', 1],
    ])
    expect(groupFields(fields, '涨', '其他')).toHaveLength(1)
  })
})
