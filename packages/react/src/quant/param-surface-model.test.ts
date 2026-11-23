// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  bestCell,
  gridRange,
  isSpike,
  moveCell,
  surfaceNeighborhood,
  paramValues,
  resolveSlice,
  sliceGrid,
  type SurfacePoint,
} from './param-surface-model.ts'

/** 5×5 网格 + 第三个参数 stop（两档）；sharpe 在 (fast=3, slow=3) 处是一根孤峰，其余是平地。 */
function surface(peak: boolean): SurfacePoint[] {
  const points: SurfacePoint[] = []
  for (const stop of [1, 2])
    for (let fast = 1; fast <= 5; fast++)
      for (let slow = 1; slow <= 5; slow++) {
        const spike = peak && stop === 1 && fast === 3 && slow === 3
        const plateau = !peak && stop === 1 && Math.abs(fast - 3) <= 1 && Math.abs(slow - 3) <= 1
        const centre = !peak && stop === 1 && fast === 3 && slow === 3
        points.push({
          id: `s${stop}f${fast}w${slow}`,
          params: { fast, slow, stop },
          metrics: { sharpe: spike ? 2 : centre ? 1.9 : plateau ? 1.8 : 0.4 + stop * 0.1, dd: 0.1 * fast },
        })
      }
  return points
}
const KEYS = ['fast', 'slow', 'stop']

describe('参数曲面：切片与网格', () => {
  it('参数取值升序去重', () => {
    expect(paramValues(surface(true), 'stop')).toEqual([1, 2])
    expect(paramValues(surface(true), 'fast')).toEqual([1, 2, 3, 4, 5])
  })

  it('其余参数没给取第一个取值；给了不存在的值也回到第一个', () => {
    expect(resolveSlice(surface(true), KEYS, ['fast', 'slow'], {})).toEqual({ stop: 1 })
    expect(resolveSlice(surface(true), KEYS, ['fast', 'slow'], { stop: 2 })).toEqual({ stop: 2 })
    expect(resolveSlice(surface(true), KEYS, ['fast', 'slow'], { stop: 9 })).toEqual({ stop: 1 })
  })

  it('网格只含落在切片上的点，行是 y 列是 x', () => {
    const grid = sliceGrid(surface(true), ['fast', 'slow'], { stop: 2 })
    expect(grid.xs).toEqual([1, 2, 3, 4, 5])
    expect(grid.cells).toHaveLength(5)
    expect(grid.cells[0]![0]!.id).toBe('s2f1w1')
    expect(grid.cells[2]![3]!.params).toMatchObject({ fast: 4, slow: 3, stop: 2 })
    const missing = sliceGrid(
      surface(true).filter((p) => p.id !== 's1f2w2'),
      ['fast', 'slow'],
      { stop: 1 },
    )
    expect(missing.cells[1]![1]).toBeNull()
  })

  it('最优格：max 取最大、min 取最小，同值取靠前；没有有效值是 null', () => {
    const grid = sliceGrid(surface(true), ['fast', 'slow'], { stop: 1 })
    expect(bestCell(grid, 'sharpe', 'max')).toEqual({ xi: 2, yi: 2 })
    expect(bestCell(grid, 'dd', 'min')).toEqual({ xi: 0, yi: 0 })
    expect(bestCell(grid, 'nope', 'max')).toBeNull()
  })
})

describe('参数曲面：邻域稳定度（孤峰判据）', () => {
  it('孤峰：最优格 2.0，八个邻格都是 0.5，保留率 0.25，邻域方差 0', () => {
    const grid = sliceGrid(surface(true), ['fast', 'slow'], { stop: 1 })
    const cell = bestCell(grid, 'sharpe', 'max')!
    const stable = surfaceNeighborhood(grid, cell, 'sharpe', 'max')
    expect(stable.count).toBe(8)
    expect(stable.mean).toBeCloseTo(0.5, 12)
    expect(stable.variance).toBeCloseTo(0, 12)
    expect(stable.retention).toBeCloseTo(0.25, 12)
    expect(isSpike(stable, 0.6)).toBe(true)
  })

  it('平台：周围一圈 1.8、中心 1.8 —— 保留率接近 1，不是孤峰', () => {
    const grid = sliceGrid(surface(false), ['fast', 'slow'], { stop: 1 })
    const cell = bestCell(grid, 'sharpe', 'max')!
    const stable = surfaceNeighborhood(grid, cell, 'sharpe', 'max')
    expect(stable.retention).toBeGreaterThan(0.9)
    expect(isSpike(stable, 0.6)).toBe(false)
  })

  it('方差是总体方差；网格边上的格邻居少', () => {
    const points: SurfacePoint[] = [1, 2, 3].map((fast, i) => ({
      id: `p${i}`,
      params: { fast, slow: 1 },
      metrics: { v: [4, 2, 6][i]! },
    }))
    const grid = sliceGrid(points, ['fast', 'slow'], {})
    const edge = surfaceNeighborhood(grid, { xi: 0, yi: 0 }, 'v', 'max')
    expect(edge.count).toBe(1)
    expect(edge.mean).toBe(2)
    const mid = surfaceNeighborhood(grid, { xi: 1, yi: 0 }, 'v', 'max')
    expect(mid.mean).toBe(5)
    expect(mid.variance).toBe(1)
  })

  it('min 目标：保留率是 中心 / 邻均值；中心非正时算不出', () => {
    const grid = sliceGrid(surface(true), ['fast', 'slow'], { stop: 1 })
    const stable = surfaceNeighborhood(grid, { xi: 0, yi: 0 }, 'dd', 'min')
    expect(stable.retention).toBeGreaterThan(0)
    expect(stable.retention).toBeLessThan(1)
    const zero = surfaceNeighborhood(
      sliceGrid([{ id: 'a', params: { x: 1, y: 1 }, metrics: { v: 0 } }], ['x', 'y'], {}),
      { xi: 0, yi: 0 },
      'v',
      'max',
    )
    expect(zero.count).toBe(0)
    expect(zero.retention).toBeNull()
    expect(isSpike(zero, 0.6)).toBe(false)
  })

  it('值域与方向键', () => {
    const grid = sliceGrid(surface(true), ['fast', 'slow'], { stop: 1 })
    expect(gridRange(grid, 'sharpe')).toEqual({ min: 0.5, max: 2 })
    expect(gridRange(grid, 'nope')).toBeNull()
    expect(moveCell({ xi: 0, yi: 0 }, 'ArrowLeft', 5, 5)).toEqual({ xi: 0, yi: 0 })
    expect(moveCell({ xi: 4, yi: 4 }, 'ArrowDown', 5, 5)).toEqual({ xi: 4, yi: 4 })
    expect(moveCell({ xi: 2, yi: 1 }, 'End', 5, 5)).toEqual({ xi: 4, yi: 1 })
    expect(moveCell({ xi: 2, yi: 1 }, 'x', 5, 5)).toBeNull()
  })
})
