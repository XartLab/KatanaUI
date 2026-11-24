// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  ACTIVITY_LEVELS,
  activityGrid,
  activityLevel,
  activityMax,
  activityTotal,
  agentStatusTone,
  moveActivity,
  recentFrom,
  runResultTone,
} from './agent-drawer-model.ts'

describe('activityLevel', () => {
  it('0 次是 0 档；跑过的按占 max 的比例分 1 到 5 档，向上取整', () => {
    expect(activityLevel(0, 10)).toBe(0)
    expect(activityLevel(1, 10)).toBe(1)
    expect(activityLevel(2, 10)).toBe(1)
    expect(activityLevel(3, 10)).toBe(2)
    expect(activityLevel(5, 10)).toBe(3)
    expect(activityLevel(7, 10)).toBe(4)
    expect(activityLevel(9, 10)).toBe(5)
    expect(activityLevel(10, 10)).toBe(5)
  })
  it('5 档都出得来：1 到 max 之间每一档至少有一个次数', () => {
    const levels = new Set(Array.from({ length: 20 }, (_, i) => activityLevel(i + 1, 20)))
    expect([...levels].toSorted()).toEqual([1, 2, 3, 4, 5])
    expect(ACTIVITY_LEVELS).toBe(5)
  })
  it('超过 max 封顶 5 档；负数与非有限数当没跑；max 不是正数时跑过的算 1 档', () => {
    expect(activityLevel(50, 10)).toBe(5)
    expect(activityLevel(-3, 10)).toBe(0)
    expect(activityLevel(Number.NaN, 10)).toBe(0)
    expect(activityLevel(4, 0)).toBe(1)
    expect(activityLevel(4, Number.NaN)).toBe(1)
  })
})

describe('activityMax 与 activityTotal', () => {
  const days = [
    { date: '2026-11-02', count: 3 },
    { date: '2026-11-03', count: 12 },
    { date: '2026-11-04', count: -1 },
  ]
  it('最大值与总数不计负数与非有限数', () => {
    expect(activityMax(days)).toBe(12)
    expect(activityTotal(days)).toBe(15)
    expect(activityMax([])).toBe(0)
    expect(activityTotal([{ date: '2026-11-02', count: Number.NaN }])).toBe(0)
  })
})

describe('activityGrid', () => {
  // 2026-11-02 是周一：两周十四天正好两列。
  const days = [
    { date: '2026-11-02', count: 4 },
    { date: '2026-11-05', count: 12 },
    { date: '2026-11-10', count: 1 },
  ]
  it('一列一周、一行一个星期，缺的日子是 0 次', () => {
    const grid = activityGrid(days, { from: '2026-11-02', to: '2026-11-15' })
    expect(grid.cols).toBe(2)
    expect(grid.cells).toHaveLength(14)
    expect(grid.rows).toHaveLength(7)
    expect(grid.rows.every((row) => row.length === 2)).toBe(true)
    const thursday = grid.rows[3]![0]!
    expect(thursday).toMatchObject({ date: '2026-11-05', count: 12, level: 5, col: 0, row: 3 })
    expect(grid.cells.find((cell) => cell.date === '2026-11-03')).toMatchObject({ count: 0, level: 0 })
    expect(grid.max).toBe(12)
  })
  it('不给区间取数据里最早与最晚的一天；区间外的数据不画；重复日期相加', () => {
    const grid = activityGrid([...days, { date: '2026-11-02', count: 2 }, { date: '2026-12-31', count: 9 }], {
      from: '2026-11-02',
      to: '2026-11-10',
    })
    expect(grid.cells.map((cell) => cell.date)[0]).toBe('2026-11-02')
    expect(grid.cells.at(-1)!.date).toBe('2026-11-10')
    expect(grid.cells[0]!.count).toBe(6)
    expect(activityGrid(days).cells.at(-1)!.date).toBe('2026-11-10')
  })
  it('区间不从周一开始时第一列只有后几个星期；给 max 时按它分档', () => {
    const grid = activityGrid([{ date: '2026-11-04', count: 5 }], { from: '2026-11-04', to: '2026-11-09', max: 10 })
    expect(grid.cols).toBe(2)
    expect(grid.rows[0]!.map((cell) => cell.date)).toEqual(['2026-11-09'])
    expect(grid.cells[0]).toMatchObject({ date: '2026-11-04', row: 2, level: 3 })
    expect(grid.max).toBe(10)
  })
  it('没有数据是空格子', () => {
    expect(activityGrid([])).toMatchObject({ cols: 0, cells: [] })
  })
})

describe('recentFrom', () => {
  it('末日往前数 N 周，含末日共 7N 天', () => {
    expect(recentFrom('2026-11-23', 12)).toBe('2026-09-01')
    expect(recentFrom('2026-11-23', 1)).toBe('2026-11-17')
  })
})

describe('moveActivity', () => {
  const grid = activityGrid([{ date: '2026-11-02', count: 1 }], { from: '2026-11-04', to: '2026-11-17' })
  const { cells } = grid
  const at = (date: string) => cells.findIndex((cell) => cell.date === date)
  it('← → 前后一周，↑ ↓ 前后一天', () => {
    expect(cells[moveActivity(cells, at('2026-11-11'), 'ArrowLeft')!]!.date).toBe('2026-11-04')
    expect(cells[moveActivity(cells, at('2026-11-04'), 'ArrowRight')!]!.date).toBe('2026-11-11')
    expect(cells[moveActivity(cells, at('2026-11-11'), 'ArrowDown')!]!.date).toBe('2026-11-12')
    expect(cells[moveActivity(cells, at('2026-11-11'), 'ArrowUp')!]!.date).toBe('2026-11-10')
  })
  it('Home / End 到第一天与最后一天', () => {
    expect(moveActivity(cells, at('2026-11-11'), 'Home')).toBe(0)
    expect(moveActivity(cells, 0, 'End')).toBe(cells.length - 1)
  })
  it('这个方向没有格子或不是方向键返回 null（调用方不拦，页面照常滚）', () => {
    expect(moveActivity(cells, at('2026-11-04'), 'ArrowLeft')).toBeNull()
    expect(moveActivity(cells, at('2026-11-17'), 'ArrowDown')).toBeNull()
    expect(moveActivity(cells, at('2026-11-09'), 'ArrowUp')).toBeNull()
    expect(moveActivity(cells, 0, 'Home')).toBeNull()
    expect(moveActivity(cells, 0, 'a')).toBeNull()
    expect(moveActivity([], 0, 'ArrowLeft')).toBeNull()
  })
})

describe('语气', () => {
  it('在跑是 progress（不是 accent），暂停 warn，停用 neutral', () => {
    expect(agentStatusTone('running')).toBe('progress')
    expect(agentStatusTone('paused')).toBe('warn')
    expect(agentStatusTone('disabled')).toBe('neutral')
  })
  it('运行结果：成功 ok、失败 danger、在跑 progress、取消 neutral', () => {
    expect(runResultTone('ok')).toBe('ok')
    expect(runResultTone('failed')).toBe('danger')
    expect(runResultTone('running')).toBe('progress')
    expect(runResultTone('cancelled')).toBe('neutral')
  })
})
