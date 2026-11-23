// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  filterOptions,
  matchRanges,
  queryTokens,
  splitByRanges,
  stepActive,
  tagComboboxKeyAction,
  toggleId,
  type TagComboboxKeyContext,
} from './tag-combobox-model.ts'

const OPTIONS = [
  { label: 'Aisha Khan', description: 'Design lead' },
  { label: 'Hannah Fischer', description: 'Product manager' },
  { label: 'Jonas Weber', description: 'Engineering manager' },
  { label: 'Tomás Silva', description: 'Engineer' },
  { label: '均值回归', keywords: ['mean reversion'] },
]

describe('queryTokens / matchRanges', () => {
  it('词按空白拆开、折叠大小写与重音', () => {
    expect(queryTokens('  An  TOMÁS ')).toEqual(['an', 'tomas'])
    expect(queryTokens('   ')).toEqual([])
  })

  it('命中区间按原文下标：大小写不分，同一个词出现几次标几次，相接的合并', () => {
    expect(matchRanges('Hannah', ['an'])).toEqual([[1, 3]])
    expect(matchRanges('banana', ['an'])).toEqual([[1, 5]])
    expect(matchRanges('an x an', ['an'])).toEqual([
      [0, 2],
      [5, 7],
    ])
    expect(matchRanges('Hannah Fischer', ['han', 'nah'])).toEqual([[0, 6]])
    expect(matchRanges('Aisha', [])).toEqual([])
  })

  it('重音不分：搜 tomas 标出 Tomás 整个词，下标仍是原文的', () => {
    expect(matchRanges('Tomás Silva', ['tomas'])).toEqual([[0, 5]])
    expect(matchRanges('Tomás Silva', ['as'])).toEqual([[3, 5]])
  })
})

describe('filterOptions', () => {
  it('空搜索词全留，次序不变', () => {
    expect(filterOptions(OPTIONS, '').map((row) => row.index)).toEqual([0, 1, 2, 3, 4])
    expect(filterOptions(OPTIONS, '   ')).toHaveLength(5)
  })

  it('「an」只留含 an 的行（主文字或说明里有都算），并给出命中区间', () => {
    const rows = filterOptions(OPTIONS, 'an')
    // 均值回归 的 keywords「mean reversion」里有 an：能搜到，但 keywords 不显示所以不标。
    expect(rows.map((row) => row.option.label)).toEqual(['Aisha Khan', 'Hannah Fischer', 'Jonas Weber', '均值回归'])
    expect(rows[3]!.labelRanges).toEqual([])
    expect(rows[0]!.labelRanges).toEqual([[8, 10]])
    expect(rows[1]!.labelRanges).toEqual([[1, 3]])
    // Jonas Weber 的主文字没有 an，说明「Engineering manager」里有：只标说明。
    expect(rows[2]!.labelRanges).toEqual([])
    expect(rows[2]!.descriptionRanges.length).toBeGreaterThan(0)
  })

  it('几个词都要命中（跨主文字与说明），keywords 能搜但不标', () => {
    expect(filterOptions(OPTIONS, 'hannah manager').map((row) => row.index)).toEqual([1])
    const byKeyword = filterOptions(OPTIONS, 'reversion')
    expect(byKeyword.map((row) => row.index)).toEqual([4])
    expect(byKeyword[0]!.labelRanges).toEqual([])
  })

  it('没有匹配时是空列表', () => {
    expect(filterOptions(OPTIONS, 'zzz')).toEqual([])
  })
})

describe('splitByRanges', () => {
  it('按命中区间切段，命中的是 hit', () => {
    expect(splitByRanges('Hannah', [[1, 3]])).toEqual([
      { text: 'H', hit: false },
      { text: 'an', hit: true },
      { text: 'nah', hit: false },
    ])
    expect(splitByRanges('abc', [])).toEqual([{ text: 'abc', hit: false }])
  })
})

describe('stepActive / toggleId', () => {
  it('高亮首尾相接；当前不在列表里时，往下落第一项、往上落最后一项', () => {
    const ids = ['a', 'b', 'c']
    expect(stepActive(ids, 'a', 1)).toBe('b')
    expect(stepActive(ids, 'c', 1)).toBe('a')
    expect(stepActive(ids, 'a', -1)).toBe('c')
    expect(stepActive(ids, null, 1)).toBe('a')
    expect(stepActive(ids, 'x', -1)).toBe('c')
    expect(stepActive([], 'a', 1)).toBeNull()
  })

  it('切换：没选的接在末尾，已选的去掉', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('tagComboboxKeyAction', () => {
  const base: TagComboboxKeyContext = { open: true, hasRows: true, draft: '', count: 3, picked: null }
  const act = (key: string, patch: Partial<TagComboboxKeyContext> = {}) =>
    tagComboboxKeyAction(key, { ...base, ...patch })

  it('↑ ↓：列表关着先开，开着移高亮；没有行不动', () => {
    expect(act('ArrowDown', { open: false })).toEqual({ type: 'open' })
    expect(act('ArrowDown')).toEqual({ type: 'move', delta: 1 })
    expect(act('ArrowUp')).toEqual({ type: 'move', delta: -1 })
    expect(act('ArrowDown', { hasRows: false })).toBeNull()
  })

  it('Enter：开着且有行才切换；选中着标签或没有行时不切换，但开着就吞掉（不提交表单）；关着交给浏览器', () => {
    expect(act('Enter')).toEqual({ type: 'toggle' })
    expect(act('Enter', { open: false })).toBeNull()
    expect(act('Enter', { hasRows: false })).toEqual({ type: 'swallow' })
    expect(act('Enter', { picked: 1 })).toEqual({ type: 'swallow' })
  })

  it('Esc：先收列表，再取消标签选中', () => {
    expect(act('Escape')).toEqual({ type: 'close' })
    expect(act('Escape', { open: false, picked: 2 })).toEqual({ type: 'unpick' })
    expect(act('Escape', { open: false })).toBeNull()
  })

  it('Backspace：输入空时第一次选中最后一个标签，第二次删掉；有字时交给浏览器', () => {
    expect(act('Backspace')).toEqual({ type: 'pick', index: 2 })
    expect(act('Backspace', { picked: 2 })).toEqual({ type: 'remove', index: 2 })
    expect(act('Backspace', { draft: 'an' })).toBeNull()
    expect(act('Backspace', { count: 0 })).toBeNull()
  })

  it('Delete 只删选中的标签', () => {
    expect(act('Delete', { picked: 0 })).toEqual({ type: 'remove', index: 0 })
    expect(act('Delete')).toBeNull()
  })

  it('← →：在标签间移；→ 过了最后一个回输入框；输入有字时 ← 是移光标', () => {
    expect(act('ArrowLeft')).toEqual({ type: 'pick', index: 2 })
    expect(act('ArrowLeft', { picked: 2 })).toEqual({ type: 'pick', index: 1 })
    expect(act('ArrowLeft', { picked: 0 })).toEqual({ type: 'pick', index: 0 })
    expect(act('ArrowLeft', { draft: 'a' })).toBeNull()
    expect(act('ArrowRight', { picked: 1 })).toEqual({ type: 'pick', index: 2 })
    expect(act('ArrowRight', { picked: 2 })).toEqual({ type: 'unpick' })
    expect(act('ArrowRight')).toBeNull()
  })

  it('别的键不管', () => {
    expect(act('a')).toBeNull()
    expect(act('Tab')).toBeNull()
  })
})
