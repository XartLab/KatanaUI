// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { collapsedItems, type FitItem } from './blocks/index.ts'

const item = (id: string, width: number, priority = 0, pinned = false): FitItem => ({ id, width, priority, pinned })

describe('collapsedItems：宽度不够时收起哪些项', () => {
  const items = [item('a', 100, 3), item('b', 100, 1), item('c', 100, 2), item('d', 100, 1)]

  it('放得下就一项不收', () => {
    expect(collapsedItems(items, 400, 0, 28)).toEqual([])
  })

  it('先收优先级最低的，同级收排在后面的；收起后要留出「…」按钮的宽度', () => {
    // 400 → 放不下 4 项 + 0：收 d（同为 1，排后）剩 300 + 28 = 328 ≤ 340
    expect(collapsedItems(items, 340, 0, 28)).toEqual(['d'])
    // 再窄：连 b 一起收
    expect(collapsedItems(items, 240, 0, 28)).toEqual(['b', 'd'])
  })

  it('pinned 的项不收，放不下也不裁', () => {
    const pinned = [item('live', 150, 0, true), item('x', 100, 5)]
    expect(collapsedItems(pinned, 100, 0, 28)).toEqual(['x'])
  })

  it('项间距算进宽度', () => {
    expect(collapsedItems([item('a', 100), item('b', 100)], 210, 10, 28)).toEqual([])
    expect(collapsedItems([item('a', 100), item('b', 100)], 210, 20, 28)).toEqual(['b'])
  })
})
