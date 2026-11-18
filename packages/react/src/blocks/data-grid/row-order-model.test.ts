// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vite-plus/test'
import {
  applyRowOrder,
  expandMoving,
  mergeVisibleOrder,
  moveRows,
  moveRowsBy,
  normalizeOrder,
} from './row-order-model.ts'

// 手动行序（#77 G7）：自选表的拖动、Alt+↑/↓ 与分节。
const ORDER = ['a', 'b', 'c', 'd', 'e']
// 带分节：S1 下 a b，S2 下 c d，开头有一行没分节的 x。
const SECTIONED = ['x', 'S1', 'a', 'b', 'S2', 'c', 'd']
const isSection = (id: string) => id.startsWith('S')

describe('normalizeOrder', () => {
  test('去掉不在的、新来的接最后', () => {
    expect(normalizeOrder(['c', 'z', 'a'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b'])
    expect(normalizeOrder(undefined, ['a', 'b'])).toEqual(['a', 'b'])
  })
})

describe('moveRows', () => {
  test('挪到某行之前、挪到最后', () => {
    expect(moveRows(ORDER, ['d'], 'b')).toEqual(['a', 'd', 'b', 'c', 'e'])
    expect(moveRows(ORDER, ['a'], null)).toEqual(['b', 'c', 'd', 'e', 'a'])
  })
  test('多选一起挪，保持相对次序', () => {
    expect(moveRows(ORDER, ['e', 'b'], 'a')).toEqual(['b', 'e', 'a', 'c', 'd'])
  })
  test('落在自己身上不动', () => {
    expect(moveRows(ORDER, ['c'], 'c')).toEqual(ORDER)
    expect(moveRows(ORDER, ['c'], 'd')).toEqual(ORDER)
  })
  test('把行拖到分节标题下面就进了那一节', () => {
    expect(moveRows(SECTIONED, ['x'], 'c')).toEqual(['S1', 'a', 'b', 'S2', 'x', 'c', 'd'])
  })
  test('拖分节标题带着整节走，落点吸到节的边界', () => {
    expect(expandMoving(SECTIONED, ['S2'], isSection)).toEqual(['S2', 'c', 'd'])
    expect(moveRows(SECTIONED, ['S2'], 'S1', isSection)).toEqual(['x', 'S2', 'c', 'd', 'S1', 'a', 'b'])
    // 落在别的节中间：吸到那一节的末尾，不拆开它
    expect(moveRows(SECTIONED, ['S2'], 'b', isSection)).toEqual(SECTIONED)
    expect(moveRows(SECTIONED, ['S1'], 'd', isSection)).toEqual(['x', 'S2', 'c', 'd', 'S1', 'a', 'b'])
  })
})

describe('moveRowsBy', () => {
  test('上下一格，到头不动', () => {
    expect(moveRowsBy(ORDER, ['c'], -1)).toEqual(['a', 'c', 'b', 'd', 'e'])
    expect(moveRowsBy(ORDER, ['c'], 1)).toEqual(['a', 'b', 'd', 'c', 'e'])
    expect(moveRowsBy(ORDER, ['a'], -1)).toEqual(ORDER)
    expect(moveRowsBy(ORDER, ['e'], 1)).toEqual(ORDER)
  })
  test('普通行跨过分节标题就换了节', () => {
    expect(moveRowsBy(SECTIONED, ['c'], -1, isSection)).toEqual(['x', 'S1', 'a', 'b', 'c', 'S2', 'd'])
  })
  test('整节上下跨过相邻的一节', () => {
    expect(moveRowsBy(SECTIONED, ['S2'], -1, isSection)).toEqual(['x', 'S2', 'c', 'd', 'S1', 'a', 'b'])
    expect(moveRowsBy(SECTIONED, ['S1'], 1, isSection)).toEqual(['x', 'S2', 'c', 'd', 'S1', 'a', 'b'])
    expect(moveRowsBy(SECTIONED, ['S2'], 1, isSection)).toEqual(SECTIONED)
  })
})

test('applyRowOrder：按次序排，不在次序里的接最后', () => {
  const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  expect(applyRowOrder(rows, (row) => row.id, ['c', 'a']).map((row) => row.id)).toEqual(['c', 'a', 'b'])
})

test('mergeVisibleOrder：过滤中挪行，藏起来的行留在原位', () => {
  // 只看得见 b d：把 d 挪到 b 前
  expect(mergeVisibleOrder(['a', 'b', 'c', 'd'], ['d', 'b'])).toEqual(['a', 'd', 'c', 'b'])
})
