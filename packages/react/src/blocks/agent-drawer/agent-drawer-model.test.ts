// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  ACTIVITY_LEVELS,
  activityCuts,
  activityGrid,
  activityLevel,
  activityLevelByCuts,
  activityMax,
  activityTotal,
  agentStatusTone,
  moveActivity,
  recentFrom,
  runResultTone,
} from './agent-drawer-model.ts'

describe('activityLevel（固定上限的线性档位）', () => {
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
    expect([...levels].toSorted((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
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

describe('activityCuts 与 activityLevelByCuts（默认的分位数档位）', () => {
  it('只看跑过的日子：0 次不进分布，切点升序去重', () => {
    expect(activityCuts([0, 0, 0])).toEqual([])
    expect(activityCuts([])).toEqual([])
    const cuts = activityCuts([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(cuts).toHaveLength(4)
    expect(cuts).toEqual(cuts.toSorted((a, b) => a - b))
    expect(new Set(cuts).size).toBe(cuts.length)
  })
  it('1 到 10 次均匀分布：5 档都出得来，且档位不随次数倒退', () => {
    const counts = Array.from({ length: 10 }, (_, i) => i + 1)
    const cuts = activityCuts(counts)
    const levels = counts.map((count) => activityLevelByCuts(count, cuts))
    expect(new Set(levels)).toEqual(new Set([1, 2, 3, 4, 5]))
    expect(levels).toEqual(levels.toSorted((a, b) => a - b))
  })
  it('离群值：某天跑了 300 次，其余日子仍然分得开，不会全压在 1 档', () => {
    const counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 300]
    const cuts = activityCuts(counts)
    const levels = counts.map((count) => activityLevelByCuts(count, cuts))
    expect(new Set(levels.slice(0, 10)).size).toBeGreaterThanOrEqual(4)
    expect(levels.at(-1)).toBe(5)
    // 对照：线性档位在同一批数据里，1 到 10 次全落在 1 档。
    expect(new Set(counts.slice(0, 10).map((count) => activityLevel(count, 300)))).toEqual(new Set([1]))
  })
  it('全是同一个次数（含每天只跑 1 次）：所有切点相同、严格大于不成立，全部落 1 档，不是 5 档', () => {
    for (const counts of [[1, 1, 1, 1], [12, 12, 12], [3]]) {
      const cuts = activityCuts(counts)
      expect(cuts).toHaveLength(1)
      expect(counts.map((count) => activityLevelByCuts(count, cuts))).toEqual(counts.map(() => 1))
    }
    expect(activityLevelByCuts(1, [])).toBe(1)
  })
  it('只有一天跑过：落 1 档；0 次与坏数据是 0 档', () => {
    expect(activityLevelByCuts(7, activityCuts([0, 0, 7, 0]))).toBe(1)
    expect(activityLevelByCuts(0, [1, 2])).toBe(0)
    expect(activityLevelByCuts(Number.NaN, [1, 2])).toBe(0)
    expect(activityLevelByCuts(-4, [1, 2])).toBe(0)
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
    expect(grid.cuts.length).toBeGreaterThan(0)
  })
  it('默认分位数档位（4 / 12 / 1 次：1 最浅，12 最亮），给 max 时改线性', () => {
    const quantile = activityGrid(days, { from: '2026-11-02', to: '2026-11-15' })
    const levelOf = (grid: typeof quantile, date: string) => grid.cells.find((cell) => cell.date === date)!.level
    expect(levelOf(quantile, '2026-11-10')).toBe(1)
    expect(levelOf(quantile, '2026-11-02')).toBe(3)
    expect(levelOf(quantile, '2026-11-05')).toBe(5)
    const linear = activityGrid(days, { from: '2026-11-02', to: '2026-11-15', max: 12 })
    expect(linear.cuts).toEqual([])
    expect(levelOf(linear, '2026-11-05')).toBe(5)
    expect(levelOf(linear, '2026-11-02')).toBe(2)
  })
  it('带上每个月第一天所在的列', () => {
    const grid = activityGrid([], { from: '2026-10-20', to: '2026-11-15' })
    expect(grid.months).toEqual([
      { col: 0, month: 9 },
      { col: 1, month: 10 },
    ])
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
    expect(grid.cuts).toEqual([])
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
  // 2026-11-04（周三）到 2026-11-30（周一）：首列残（周三起）、末列残（只有周一），中间整周。
  const { cells } = activityGrid([], { from: '2026-11-04', to: '2026-11-30' })
  const at = (date: string) => cells.findIndex((cell) => cell.date === date)
  const date = (index: number | null) => (index === null ? null : cells[index]!.date)
  it('← → 前后一周（同一个星期几），↑ ↓ 前后一天', () => {
    expect(date(moveActivity(cells, at('2026-11-11'), 'ArrowLeft'))).toBe('2026-11-04')
    expect(date(moveActivity(cells, at('2026-11-04'), 'ArrowRight'))).toBe('2026-11-11')
    expect(date(moveActivity(cells, at('2026-11-11'), 'ArrowDown'))).toBe('2026-11-12')
    expect(date(moveActivity(cells, at('2026-11-11'), 'ArrowUp'))).toBe('2026-11-10')
  })
  it('残列没有同一个星期几：← → 取那一列里离得最近的一行，不是死路', () => {
    // 周一（第 2 列）按 ←：首列只有周三起，最近的是周三。
    expect(date(moveActivity(cells, at('2026-11-09'), 'ArrowLeft'))).toBe('2026-11-04')
    // 周日（11-29，倒数第二列）按 →：末列只有周一，最近的是周一。
    expect(date(moveActivity(cells, at('2026-11-29'), 'ArrowRight'))).toBe('2026-11-30')
    // 周五按 ←：首列有周五，仍是同一行。
    expect(date(moveActivity(cells, at('2026-11-13'), 'ArrowLeft'))).toBe('2026-11-06')
  })
  it('第一列按 ←、最后一列按 →、列头按 ↑、列尾按 ↓ 不动', () => {
    expect(moveActivity(cells, at('2026-11-04'), 'ArrowLeft')).toBeNull()
    expect(moveActivity(cells, at('2026-11-30'), 'ArrowRight')).toBeNull()
    expect(moveActivity(cells, at('2026-11-09'), 'ArrowUp')).toBeNull()
    expect(moveActivity(cells, at('2026-11-15'), 'ArrowDown')).toBeNull()
  })
  it('PageUp / PageDown 前后 4 周，残列取最近的行，不够 4 周夹到头尾', () => {
    expect(date(moveActivity(cells, at('2026-11-04'), 'PageDown'))).toBe('2026-11-30')
    expect(date(moveActivity(cells, at('2026-11-30'), 'PageUp'))).toBe('2026-11-04')
    expect(date(moveActivity(cells, at('2026-11-11'), 'PageDown'))).toBe('2026-11-30')
    // 周三（11-11 是第 2 列）再往上 4 周越过首列：夹到首列的周三。
    expect(date(moveActivity(cells, at('2026-11-11'), 'PageUp'))).toBe('2026-11-04')
    // 已经在最后一列再按 PageDown 不动。
    expect(moveActivity(cells, at('2026-11-30'), 'PageDown')).toBeNull()
    // 整周之间：4 周之后同一个星期几。
    const long = activityGrid([], { from: '2026-09-07', to: '2026-11-29' }).cells
    const from = long.findIndex((cell) => cell.date === '2026-09-09')
    expect(long[moveActivity(long, from, 'PageDown')!]!.date).toBe('2026-10-07')
  })
  it('Home / End 到这一行的第一周与最后一周；Ctrl+Home / Ctrl+End 到第一天与最后一天', () => {
    // 周三那一行：首列有 11-04，末列没有，最后一个周三是 11-25。
    expect(date(moveActivity(cells, at('2026-11-18'), 'Home'))).toBe('2026-11-04')
    expect(date(moveActivity(cells, at('2026-11-18'), 'End'))).toBe('2026-11-25')
    // 周一那一行：首列没有周一，第一个周一是 11-09；末列有 11-30。
    expect(date(moveActivity(cells, at('2026-11-16'), 'Home'))).toBe('2026-11-09')
    expect(date(moveActivity(cells, at('2026-11-16'), 'End'))).toBe('2026-11-30')
    expect(moveActivity(cells, at('2026-11-04'), 'Home')).toBeNull()
    expect(moveActivity(cells, at('2026-11-18'), 'Home', true)).toBe(0)
    expect(moveActivity(cells, at('2026-11-18'), 'End', true)).toBe(cells.length - 1)
    expect(moveActivity(cells, 0, 'Home', true)).toBeNull()
  })
  it('Ctrl 加别的键、不是方向键、没有格子都返回 null（调用方不拦，页面照常滚）', () => {
    expect(moveActivity(cells, 0, 'ArrowRight', true)).toBeNull()
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
