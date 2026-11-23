// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { highestBoard, reasonRows, type ReasonGroup } from './reason-group-model.ts'

const groups: ReasonGroup[] = [
  {
    id: 'a',
    reason: 'A',
    items: [
      { code: '1', name: 'x', board: 3, change: 10 },
      { code: '2', name: 'y', board: 1, change: 10 },
    ],
  },
  { id: 'b', reason: 'B', items: [{ code: '3', name: 'z', board: 2, change: 10 }] },
]

describe('涨停原因分组的摊平', () => {
  it('组头加组内个股，次序照传入', () => {
    expect(reasonRows(groups, [], new Set()).map((row) => row.id)).toEqual(['g:a', 's:a:1', 's:a:2', 'g:b', 's:b:3'])
  })
  it('收起只留组头，筛选只留选中的原因', () => {
    expect(reasonRows(groups, [], new Set(['a'])).map((row) => row.id)).toEqual(['g:a', 'g:b', 's:b:3'])
    expect(reasonRows(groups, ['b'], new Set()).map((row) => row.id)).toEqual(['g:b', 's:b:3'])
  })
  it('最高板', () => expect(highestBoard(groups[0]!)).toBe(3))
})
