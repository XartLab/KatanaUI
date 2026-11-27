// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { heatKey, heatLevel, heatMax } from './theme-heat-model.ts'

describe('题材热度矩阵的纯函数', () => {
  it('档位与日历热力图换手视图同一条：⌊只数 / 最大 × 5⌋，封顶 4；0 与没有数据不着色', () => {
    expect(heatLevel(10, 10)).toBe(4)
    expect(heatLevel(5, 10)).toBe(2)
    expect(heatLevel(1, 10)).toBe(0)
    expect(heatLevel(0, 10)).toBeNull()
    expect(heatLevel(undefined, 10)).toBeNull()
  })
  it('最大只数跳过空格', () => {
    expect(heatMax([{ id: 'a', name: 'A', cells: [{ count: 3 }, null, { count: 7 }] }])).toBe(7)
    expect(heatMax([])).toBe(0)
  })
  it('方向键夹在表内，Home / End 到行首行尾', () => {
    expect(heatKey({ row: 0, col: 0 }, 'ArrowUp', 3, 4)).toEqual({ row: 0, col: 0 })
    expect(heatKey({ row: 1, col: 1 }, 'End', 3, 4)).toEqual({ row: 1, col: 3 })
    expect(heatKey({ row: 1, col: 1 }, 'x', 3, 4)).toBeUndefined()
  })
})
