// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  PENDING_DELAY_MS,
  PENDING_MIN_MS,
  SPIN_TURN_MS,
  createDelayedFlag,
  remainingToWholeTurn,
} from './delayed-flag.ts'

// 「晚出、出了就留够」的规则（kubai Vibe Design Tips 017，#251）：300ms 内结束的等待不出；出了的至少留 500ms。假计时器推时间。

describe('createDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })
  const make = (delay = PENDING_DELAY_MS, min = PENDING_MIN_MS) => {
    const changes: boolean[] = []
    const flag = createDelayedFlag({ delay, min }, (visible) => changes.push(visible))
    return { flag, changes }
  }

  it('默认值：300ms 后出，至少留 500ms', () => {
    expect(PENDING_DELAY_MS).toBe(300)
    expect(PENDING_MIN_MS).toBe(500)
  })

  it('on 满 delay 才出：差 1ms 不出', () => {
    const { flag, changes } = make()
    flag.set(true)
    vi.advanceTimersByTime(299)
    expect(changes).toEqual([])
    expect(flag.visible).toBe(false)
    vi.advanceTimersByTime(1)
    expect(changes).toEqual([true])
    expect(flag.visible).toBe(true)
  })

  it('不到 delay 就结束：旗子从不出现', () => {
    const { flag, changes } = make()
    flag.set(true)
    vi.advanceTimersByTime(299)
    flag.set(false)
    vi.advanceTimersByTime(5000)
    expect(changes).toEqual([])
  })

  it('出了以后结束得早：留到出现后满 min 才收（出现 10ms 就结束，还要留 490ms）', () => {
    const { flag, changes } = make()
    flag.set(true)
    vi.advanceTimersByTime(300)
    vi.advanceTimersByTime(10)
    flag.set(false)
    expect(changes).toEqual([true])
    vi.advanceTimersByTime(489)
    expect(flag.visible).toBe(true)
    vi.advanceTimersByTime(1)
    expect(changes).toEqual([true, false])
  })

  it('出了很久才结束：立刻收', () => {
    const { flag, changes } = make()
    flag.set(true)
    vi.advanceTimersByTime(1200)
    flag.set(false)
    expect(changes).toEqual([true, false])
  })

  it('留着的时候又变成在等：取消收起，旗子一直留着', () => {
    const { flag, changes } = make()
    flag.set(true)
    vi.advanceTimersByTime(310)
    flag.set(false)
    vi.advanceTimersByTime(100)
    flag.set(true)
    vi.advanceTimersByTime(5000)
    expect(changes).toEqual([true])
    expect(flag.visible).toBe(true)
  })

  it('dispose 以后不再回调', () => {
    const { flag, changes } = make()
    flag.set(true)
    flag.dispose()
    vi.advanceTimersByTime(5000)
    expect(changes).toEqual([])
  })

  it('选项可以用函数取：下一次 set 用新的 delay', () => {
    const options = { delay: 300, min: 500 }
    const changes: boolean[] = []
    const flag = createDelayedFlag(
      () => options,
      (visible) => changes.push(visible),
    )
    options.delay = 100
    flag.set(true)
    vi.advanceTimersByTime(100)
    expect(changes).toEqual([true])
  })
})

describe('remainingToWholeTurn', () => {
  it('刚开始转：至少还要转一整圈；在整圈上：0；半圈：还要半圈', () => {
    expect(SPIN_TURN_MS).toBe(640)
    expect(remainingToWholeTurn(0, 640)).toBe(640)
    expect(remainingToWholeTurn(640, 640)).toBe(0)
    expect(remainingToWholeTurn(320, 640)).toBe(320)
    expect(remainingToWholeTurn(700, 640)).toBe(580)
    expect(remainingToWholeTurn(1280, 640)).toBe(0)
  })
  it('周期不合法：0', () => {
    expect(remainingToWholeTurn(100, 0)).toBe(0)
  })
})
