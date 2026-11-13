// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  SCRUB_COARSE_STEPS,
  SCRUB_SLOW_PX_PER_STEP,
  SCRUB_PX_PER_STEP,
  nudged,
  scrubMode,
  scrubbed,
  tidy,
  typed,
} from './number-field-model'

const range = { min: 0, max: 100, step: 1 }
const none = { shift: false, alt: false }

describe('拖动改值', () => {
  it('常速：向右每 4px 加一档，向左减；不到一档不动', () => {
    expect(scrubbed(50, SCRUB_PX_PER_STEP * 3, 'normal', range)).toBe(53)
    expect(scrubbed(50, -SCRUB_PX_PER_STEP * 3, 'normal', range)).toBe(47)
    expect(scrubbed(50, SCRUB_PX_PER_STEP - 1, 'normal', range)).toBe(50)
  })
  it('Shift 粗调：一格十档', () => {
    expect(scrubbed(50, SCRUB_PX_PER_STEP * 2, 'coarse', range)).toBe(50 + 2 * SCRUB_COARSE_STEPS)
    expect(scrubbed(50, SCRUB_PX_PER_STEP - 1, 'coarse', range)).toBe(50)
  })
  it('Alt 精调（整数步长）：仍按整数走，速度慢十倍，不会调出存不进去的小数', () => {
    expect(scrubbed(50, SCRUB_SLOW_PX_PER_STEP * 2, 'fine', range)).toBe(52)
    expect(scrubbed(50, SCRUB_PX_PER_STEP * 2, 'fine', range)).toBe(50)
  })
  it('Alt 精调（小数步长）：一格是步长的十分之一，没有浮点尾巴', () => {
    const decimal = { min: 0, max: 1, step: 0.1 }
    expect(scrubbed(0.5, SCRUB_PX_PER_STEP * 3, 'fine', decimal)).toBe(0.53)
    expect(scrubbed(0.5, -SCRUB_PX_PER_STEP, 'fine', decimal)).toBe(0.49)
  })
  it('越界夹到范围边上，不越过', () => {
    expect(scrubbed(98, 400, 'normal', range)).toBe(100)
    expect(scrubbed(2, -400, 'normal', range)).toBe(0)
  })
  it('小数步长没有浮点尾巴', () => {
    expect(scrubbed(0.1, SCRUB_PX_PER_STEP * 2, 'normal', { min: 0, max: 1, step: 0.1 })).toBe(0.3)
    expect(tidy(0.30000000000000004, {})).toBe(0.3)
  })
  it('以当前值为基准：合法但没对齐步长的值照样按步长走（0.1 步长 0.5 → 0.6，不跳到 0.5）', () => {
    const coarse = { min: 0, max: 10, step: 0.5 }
    expect(scrubbed(0.1, SCRUB_PX_PER_STEP, 'normal', coarse)).toBe(0.6)
    expect(scrubbed(0.6, -SCRUB_PX_PER_STEP, 'normal', coarse)).toBe(0.1)
  })
  it('修饰键：Shift 粗调、Alt 精调，同时按了 Alt 优先', () => {
    expect(scrubMode({ shift: true, alt: true })).toBe('fine')
    expect(scrubMode({ shift: true, alt: false })).toBe('coarse')
    expect(scrubMode({ shift: false, alt: true })).toBe('fine')
    expect(scrubMode(none)).toBe('normal')
  })
})

describe('方向键', () => {
  it('上下一档；Shift 与 PageUp / PageDown 十档；到头不越界', () => {
    expect(nudged(10, 1, none, range)).toBe(11)
    expect(nudged(10, -1, none, range)).toBe(9)
    expect(nudged(10, 1, { shift: true, alt: false }, range)).toBe(20)
    expect(nudged(10, -1, { shift: true, alt: false }, range)).toBe(0)
    expect(nudged(10, 1, none, range, true)).toBe(20)
    expect(nudged(95, 1, none, range, true)).toBe(100)
    expect(nudged(0, -1, none, range)).toBe(0)
  })
  it('以当前值为基准：没对齐步长的当前值按步长加减，不先拉回网格；到头仍夹进范围', () => {
    const coarse = { min: 0, max: 1, step: 0.5 }
    expect(nudged(0.1, 1, none, coarse)).toBe(0.6)
    expect(nudged(0.6, -1, none, coarse)).toBe(0.1)
    expect(nudged(0.8, 1, none, coarse)).toBe(1)
    expect(nudged(0.1, -1, none, coarse)).toBe(0)
  })
  it('Alt 精调：小数步长是十分之一，整数步长仍是一档', () => {
    expect(nudged(0.5, 1, { shift: false, alt: true }, { min: 0, max: 1, step: 0.1 })).toBe(0.51)
    expect(nudged(10, 1, { shift: false, alt: true }, range)).toBe(11)
  })
})

describe('打字', () => {
  it('不是数不回调；越界夹进范围；不对齐步长', () => {
    expect(typed('', range)).toBeNull()
    expect(typed('-', range)).toBeNull()
    expect(typed('abc', range)).toBeNull()
    expect(typed('250', range)).toBe(100)
    expect(typed('-5', range)).toBe(0)
    expect(typed('12.5', range)).toBe(12.5)
  })
})
