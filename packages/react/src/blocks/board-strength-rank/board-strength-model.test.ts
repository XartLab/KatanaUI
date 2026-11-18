// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { rankBoards } from './board-strength-model.ts'

describe('板块强度排名', () => {
  it('按强度从高到低，同分保持传入次序；变化 = 上期名次 − 本期名次，新上榜是 null', () => {
    const ranked = rankBoards([
      { id: 'a', name: 'A', strength: 50, prevRank: 1 },
      { id: 'b', name: 'B', strength: 80, prevRank: 3 },
      { id: 'c', name: 'C', strength: 50 },
    ])
    expect(ranked.map((b) => [b.id, b.rank, b.move])).toEqual([
      ['b', 1, 2],
      ['a', 2, -1],
      ['c', 3, null],
    ])
  })
})
