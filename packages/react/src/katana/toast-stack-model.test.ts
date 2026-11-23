// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vite-plus/test'
import {
  STACK_GAP,
  STACK_LAYERS,
  STACK_PEEK,
  SWIPE_FLING_MIN,
  SWIPE_FLING_SPEED,
  stackLayout,
  swipeDecision,
} from './toast-stack-model.ts'

describe('stackLayout 收拢', () => {
  const { slots, height } = stackLayout({ heights: [60, 56, 64, 58], expanded: false, toward: -1 })
  test('容器只有最前面一条那么高', () => expect(height).toBe(58))
  test('最前面一条原样', () => {
    expect(slots[3]).toMatchObject({ y: 0, scale: 1, opacity: 1, height: 58, clamped: false, interactive: true })
  })
  test('往后每层上移 8px、缩小、变淡，高度压成最前面那条', () => {
    expect(slots[2]).toMatchObject({ y: -STACK_PEEK, height: 58, clamped: true, interactive: false })
    expect(slots[2]!.scale).toBeCloseTo(0.95)
    expect(slots[1]!.y).toBe(-2 * STACK_PEEK)
    expect(slots[1]!.scale).toBeCloseTo(0.9)
    expect(slots[2]!.opacity).toBeLessThan(slots[3]!.opacity)
    expect(slots[1]!.opacity).toBeLessThan(slots[2]!.opacity)
  })
  test(`最多露 ${STACK_LAYERS} 层：更后面的整条淡掉、停在第 ${STACK_LAYERS} 层的位置`, () => {
    expect(slots[0]!.opacity).toBe(0)
    expect(slots[0]!.y).toBe(slots[1]!.y)
  })
  test('上面两个角往下叠', () => {
    const top = stackLayout({ heights: [60, 60], expanded: false, toward: 1 })
    expect(top.slots[0]!.y).toBe(STACK_PEEK)
  })
  test('没有条目', () =>
    expect(stackLayout({ heights: [], expanded: false, toward: -1 })).toEqual({ slots: [], height: 0 }))
})

describe('stackLayout 展开', () => {
  const { slots, height } = stackLayout({ heights: [60, 56, 64], expanded: true, toward: -1 })
  test('列表：间距 8px，最新的贴边', () => {
    expect(slots.map((s) => s.y)).toEqual([-(64 + STACK_GAP + 56 + STACK_GAP), -(64 + STACK_GAP), 0])
    expect(height).toBe(60 + 56 + 64 + 2 * STACK_GAP)
  })
  test('都是原大小、原不透明度、都能点', () => {
    for (const slot of slots) expect(slot).toMatchObject({ scale: 1, opacity: 1, clamped: false, interactive: true })
  })
  test('一条时展开与收拢没有差别', () => {
    expect(stackLayout({ heights: [60], expanded: true, toward: -1 })).toEqual(
      stackLayout({ heights: [60], expanded: false, toward: -1 }),
    )
  })
})

describe('swipeDecision', () => {
  test('拖过宽度 40%：往那边关', () => {
    expect(swipeDecision({ offset: 140, velocity: 0, width: 340 })).toBe(1)
    expect(swipeDecision({ offset: -140, velocity: 0, width: 340 })).toBe(-1)
  })
  test('不够距离也不够快：弹回', () => {
    expect(swipeDecision({ offset: 100, velocity: 100, width: 340 })).toBe(0)
  })
  test('甩出速度够：不到 40% 也关', () => {
    expect(swipeDecision({ offset: 60, velocity: SWIPE_FLING_SPEED + 1, width: 340 })).toBe(1)
  })
  test('甩的方向与位移相反：不算', () => {
    expect(swipeDecision({ offset: 60, velocity: -(SWIPE_FLING_SPEED + 1), width: 340 })).toBe(0)
  })
  test('手抖：位移小于下限，再快也不关', () => {
    expect(swipeDecision({ offset: SWIPE_FLING_MIN - 1, velocity: 2000, width: 340 })).toBe(0)
  })
  test('没有位移或宽度为 0：0', () => {
    expect(swipeDecision({ offset: 0, velocity: 3000, width: 340 })).toBe(0)
    expect(swipeDecision({ offset: 50, velocity: 0, width: 0 })).toBe(0)
  })
})
