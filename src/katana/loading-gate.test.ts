// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  LOADING_DELAY_MS,
  LOADING_SLOW_MS,
  LOADING_TIMEOUT_MS,
  MAX_SKELETON_ROWS,
  skeletonRows,
  skeletonWidths,
  startLoadingGate,
} from './loading-gate'

// 骨架的延迟与揭示规则（#1221）、2s / 10s 两个阈值与撑满时的行数（#1234）：500ms 内到了不出骨架；超过才出；出过骨架的才揭示（stop() 为真），没出过的内容直接出现。

describe('startLoadingGate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('500ms 内到了：不出骨架，也不揭示', () => {
    const phase = vi.fn()
    const gate = startLoadingGate(phase)
    vi.advanceTimersByTime(LOADING_DELAY_MS - 1)
    expect(phase).not.toHaveBeenCalled()
    expect(gate.stop()).toBe(false)
    vi.advanceTimersByTime(20_000)
    expect(phase).not.toHaveBeenCalled()
  })

  it('三个时刻依次切换：500ms 出骨架，2s 仍在加载，10s 转超时；差 1ms 都不切', () => {
    const phase = vi.fn()
    const gate = startLoadingGate(phase)
    vi.advanceTimersByTime(LOADING_DELAY_MS - 1)
    expect(phase).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(phase.mock.calls).toEqual([['loading']])
    vi.advanceTimersByTime(LOADING_SLOW_MS - LOADING_DELAY_MS - 1)
    expect(phase).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(phase.mock.calls).toEqual([['loading'], ['slow']])
    vi.advanceTimersByTime(LOADING_TIMEOUT_MS - LOADING_SLOW_MS - 1)
    expect(phase).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1)
    expect(phase.mock.calls).toEqual([['loading'], ['slow'], ['timeout']])
    expect(gate.stop()).toBe(true)
  })

  it('2s 与 10s 是写死的阈值', () => {
    expect(LOADING_DELAY_MS).toBe(500)
    expect(LOADING_SLOW_MS).toBe(2000)
    expect(LOADING_TIMEOUT_MS).toBe(10_000)
  })

  it('停了以后不再切换：数据在 3s 到了，不会再冒出超时', () => {
    const phase = vi.fn()
    const gate = startLoadingGate(phase)
    vi.advanceTimersByTime(3000)
    expect(gate.stop()).toBe(true)
    vi.advanceTimersByTime(20_000)
    expect(phase.mock.calls).toEqual([['loading'], ['slow']])
  })

  it('超时以后才停：骨架出过，内容到了照样揭示', () => {
    const gate = startLoadingGate(vi.fn())
    vi.advanceTimersByTime(12_000)
    expect(gate.stop()).toBe(true)
  })
})

describe('skeletonRows', () => {
  it('高度 H、行高 h：floor(H / h) 行', () => {
    expect(skeletonRows(300, 28, 3)).toBe(10)
    expect(skeletonRows(279, 28, 3)).toBe(9)
    expect(skeletonRows(560, 28, 3)).toBe(20)
  })
  it('封顶 60 行', () => {
    expect(skeletonRows(100_000, 28, 3)).toBe(MAX_SKELETON_ROWS)
    expect(MAX_SKELETON_ROWS).toBe(60)
    expect(skeletonRows(60 * 28, 28, 3)).toBe(60)
  })
  it('没量到（没有高度、高度为 0、行高读不出）：退回用 lines', () => {
    expect(skeletonRows(null, 28, 3)).toBe(3)
    expect(skeletonRows(0, 28, 5)).toBe(5)
    expect(skeletonRows(300, 0, 4)).toBe(4)
    expect(skeletonRows(300, Number.NaN, 4)).toBe(4)
  })
})

describe('skeletonWidths', () => {
  it('默认三行 40% / 100% / 70%', () => {
    expect(skeletonWidths(3)).toEqual([40, 100, 70])
  })
  it('lines 可改：首行 40%、末行 70%、中间满宽；一行取 70%；越界夹到 1–60', () => {
    expect(skeletonWidths(2)).toEqual([40, 70])
    expect(skeletonWidths(5)).toEqual([40, 100, 100, 100, 70])
    expect(skeletonWidths(1)).toEqual([70])
    expect(skeletonWidths(0)).toEqual([70])
    expect(skeletonWidths(99)).toHaveLength(60)
  })
})
