// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { commitTags, hasSeparator, splitTags, tagKeyAction } from './tag-input-model.ts'

describe('splitTags / hasSeparator', () => {
  it('逗号（含全角）、分号、换行、制表符都能分开，去掉头尾空白与空段', () => {
    expect(splitTags(' 600519, 000001，300750;\n\t 688981 ,, ')).toEqual(['600519', '000001', '300750', '688981'])
    expect(hasSeparator('600519')).toBe(false)
    expect(hasSeparator('600519\n000001')).toBe(true)
  })
})

describe('commitTags', () => {
  it('收下新的，重复的（不分大小写）不收、记下已有的那个', () => {
    const result = commitTags(['AAPL'], 'aapl, MSFT')
    expect(result.next).toEqual(['AAPL', 'MSFT'])
    expect(result.added).toEqual(['MSFT'])
    expect(result.duplicates).toEqual(['AAPL'])
  })

  it('同一次里打了两遍的只收一个', () => {
    expect(commitTags([], 'TSLA, tsla').next).toEqual(['TSLA'])
  })

  it('normalize 先整理再判重：代码转大写', () => {
    const result = commitTags(['AAPL'], 'msft, aapl', { normalize: (tag) => tag.toUpperCase() })
    expect(result.next).toEqual(['AAPL', 'MSFT'])
    expect(result.duplicates).toEqual(['AAPL'])
  })

  it('validate 不过的不收，原因带回来', () => {
    const validate = (tag: string) => (/^\d{6}$/.test(tag) ? null : '要 6 位数字')
    const result = commitTags([], '600519, abc', { validate })
    expect(result.next).toEqual(['600519'])
    expect(result.rejected).toEqual([{ tag: 'abc', reason: '要 6 位数字' }])
  })

  it('max 封顶：满了的不收，原因是 null', () => {
    const result = commitTags(['a', 'b'], 'c, d', { max: 3 })
    expect(result.next).toEqual(['a', 'b', 'c'])
    expect(result.rejected).toEqual([{ tag: 'd', reason: null }])
  })

  it('不改传进来的数组', () => {
    const current = ['a']
    commitTags(current, 'b')
    expect(current).toEqual(['a'])
  })
})

describe('tagKeyAction', () => {
  const base = { count: 3, picked: null, atStart: false, hasDraft: false }

  it('Enter 有草稿才收；逗号总是收（逗号不进框）', () => {
    expect(tagKeyAction('Enter', { ...base, hasDraft: true })).toEqual({ type: 'commit' })
    expect(tagKeyAction('Enter', base)).toBeNull()
    expect(tagKeyAction(',', base)).toEqual({ type: 'commit' })
  })

  it('光标在框头时 Backspace 先选中最后一个，选中了再按才删', () => {
    expect(tagKeyAction('Backspace', { ...base, atStart: true })).toEqual({ type: 'pick', index: 2 })
    expect(tagKeyAction('Backspace', { ...base, atStart: true, picked: 2 })).toEqual({ type: 'remove', index: 2 })
    expect(tagKeyAction('Delete', { ...base, picked: 0 })).toEqual({ type: 'remove', index: 0 })
    // 光标不在框头：Backspace 归输入框（删字）。
    expect(tagKeyAction('Backspace', base)).toBeNull()
  })

  it('← → 在标签间移，过了最后一个回到输入框；Esc 取消选中', () => {
    expect(tagKeyAction('ArrowLeft', { ...base, atStart: true })).toEqual({ type: 'pick', index: 2 })
    expect(tagKeyAction('ArrowLeft', { ...base, picked: 1 })).toEqual({ type: 'pick', index: 0 })
    expect(tagKeyAction('ArrowLeft', { ...base, picked: 0 })).toBeNull()
    expect(tagKeyAction('ArrowRight', { ...base, picked: 1 })).toEqual({ type: 'pick', index: 2 })
    expect(tagKeyAction('ArrowRight', { ...base, picked: 2 })).toEqual({ type: 'pick', index: null })
    expect(tagKeyAction('ArrowRight', base)).toBeNull()
    expect(tagKeyAction('Escape', { ...base, picked: 1 })).toEqual({ type: 'pick', index: null })
  })

  it('没有标签时 Backspace 与 ← 都归输入框', () => {
    const empty = { ...base, count: 0, atStart: true }
    expect(tagKeyAction('Backspace', empty)).toBeNull()
    expect(tagKeyAction('ArrowLeft', empty)).toBeNull()
  })
})
