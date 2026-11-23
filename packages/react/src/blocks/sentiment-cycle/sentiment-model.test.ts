// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { scoreDelta, stageSegments } from './sentiment-model.ts'

describe('情绪周期的纯函数', () => {
  const days = [
    { date: 'a', score: 20, stage: 'ice' },
    { date: 'b', score: 22, stage: 'ice' },
    { date: 'c', score: 40, stage: 'repair' },
    { date: 'd', score: 18, stage: 'ice' },
  ]
  it('相邻同阶段并成一段，第 i 天占 [i, i+1]', () => {
    expect(stageSegments(days)).toEqual([
      { from: 0, to: 2, state: 'ice' },
      { from: 2, to: 3, state: 'repair' },
      { from: 3, to: 4, state: 'ice' },
    ])
  })
  it('昨日差：不够两天给 null', () => {
    expect(scoreDelta(days)).toBe(-22)
    expect(scoreDelta(days.slice(0, 1))).toBeNull()
  })
})
