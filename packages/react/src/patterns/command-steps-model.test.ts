// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vitest'
import {
  checkState,
  filterOptions,
  moveActive,
  selectedTags,
  sentenceTags,
  stepBack,
  toggleAll,
  toggleId,
  type PaletteOption,
} from './command-steps-model.ts'

const OPTIONS: PaletteOption[] = [
  { id: 'eng', label: 'Engineering', description: '12 employees', keywords: ['dev'] },
  { id: 'prod', label: 'Product & Design', description: '4 employees' },
  { id: 'sales', label: 'Sales' },
  { id: 'ops', label: 'Ops', disabled: true },
]

describe('filterOptions', () => {
  test('空输入全留，且不是同一个数组', () => {
    const all = filterOptions(OPTIONS, '  ')
    expect(all).toEqual(OPTIONS)
    expect(all).not.toBe(OPTIONS)
  })
  test('标签、说明、关键词都认，不分大小写', () => {
    expect(filterOptions(OPTIONS, 'ENGI').map((o) => o.id)).toEqual(['eng'])
    expect(filterOptions(OPTIONS, '4 emp').map((o) => o.id)).toEqual(['prod'])
    expect(filterOptions(OPTIONS, 'dev').map((o) => o.id)).toEqual(['eng'])
    expect(filterOptions(OPTIONS, 'zzz')).toEqual([])
  })
})

describe('toggleId / checkState / toggleAll', () => {
  test('toggleId 不改原数组', () => {
    const before = ['a']
    expect(toggleId(before, 'b')).toEqual(['a', 'b'])
    expect(toggleId(before, 'a')).toEqual([])
    expect(before).toEqual(['a'])
  })
  test('全选三态：无 / 部分 / 全，没有可选项是 false', () => {
    const ids = ['a', 'b', 'c']
    expect(checkState(ids, [])).toBe(false)
    expect(checkState(ids, ['b'])).toBe('mixed')
    expect(checkState(ids, ['c', 'b', 'a'])).toBe(true)
    expect(checkState([], ['a'])).toBe(false)
  })
  test('点全选：部分或无 → 全勾；全勾 → 全不勾', () => {
    const ids = ['a', 'b', 'c']
    expect(toggleAll(['b'], ids)).toEqual(['b', 'a', 'c'])
    expect(toggleAll([], ids)).toEqual(['a', 'b', 'c'])
    expect(toggleAll(ids, ids)).toEqual([])
  })
  test('筛选时全选只动可见的，被筛掉的已选项保留', () => {
    expect(toggleAll(['x'], ['a', 'b'])).toEqual(['x', 'a', 'b'])
    expect(toggleAll(['x', 'a', 'b'], ['a', 'b'])).toEqual(['x'])
  })
})

describe('selectedTags / sentenceTags', () => {
  test('标签次序照选项表，不照点的先后', () => {
    expect(selectedTags(OPTIONS, ['sales', 'eng', 'ghost'])).toEqual([
      { id: 'eng', label: 'Engineering' },
      { id: 'sales', label: 'Sales' },
    ])
  })
  test('两个选项同名时 id 仍不同（头部标签用 id 当 key）', () => {
    const twins: PaletteOption[] = [
      { id: 'a1', label: 'Main account' },
      { id: 'a2', label: 'Main account' },
    ]
    const ids = selectedTags(twins, ['a1', 'a2']).map((tag) => tag.id)
    expect(new Set(ids).size).toBe(2)
  })
  test('超过上限的折成个数', () => {
    expect(sentenceTags(['a', 'b'])).toEqual({ shown: ['a', 'b'], hidden: 0 })
    expect(sentenceTags(['a', 'b', 'c', 'd', 'e'], 3)).toEqual({ shown: ['a', 'b', 'c'], hidden: 2 })
  })
})

describe('moveActive', () => {
  test('首尾相接', () => {
    expect(moveActive(0, -1, 3)).toBe(2)
    expect(moveActive(2, 1, 3)).toBe(0)
    expect(moveActive(1, 1, 3)).toBe(2)
    expect(moveActive(0, 1, 0)).toBe(0)
  })
})

describe('stepBack', () => {
  const ids = ['region', 'dept']
  test('第一步退回命令列表', () => {
    expect(stepBack({ id: 'payroll', index: 0, selections: { region: ['us'] } }, ids)).toBeNull()
  })
  test('后面的步退一步：清掉离开的这步，留下更早的', () => {
    expect(stepBack({ id: 'payroll', index: 1, selections: { region: ['us'], dept: ['eng'] } }, ids)).toEqual({
      id: 'payroll',
      index: 0,
      selections: { region: ['us'] },
    })
  })
})
