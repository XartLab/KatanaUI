// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { rollStrip } from '../../katana/rolling-text.tsx'

// RollingText 的 ramp（并入 SmoothUI rolling-text 的「转过几个字再落」）：默认 0 不改变原行为，给了才让字母位转过中间字。
describe('RollingText ramp', () => {
  it('默认不转：字母位仍只走一格', () => {
    expect(rollStrip('T', 'A', 'up')).toEqual({ strip: 'A', steps: 1 })
  })
  it('ramp=3：旧字后跟 3 个中间字，共 4 格；同样的换法永远同一串', () => {
    const a = rollStrip('T', 'A', 'up', 3)
    expect(a.steps).toBe(4)
    expect(a.strip.split('\n')).toHaveLength(4)
    expect(a.strip.startsWith('A\n')).toBe(true)
    expect(rollStrip('T', 'A', 'up', 3)).toEqual(a)
  })
  it('跌：旧字在最下', () => {
    expect(rollStrip('T', 'A', 'down', 2).strip.split('\n').at(-1)).toBe('A')
  })
  it('标点与没变的位不转', () => {
    expect(rollStrip('.', ',', 'up', 3)).toEqual({ strip: ',', steps: 1 })
    expect(rollStrip('A', 'A', 'up', 3)).toEqual({ strip: 'A', steps: 1 })
  })
  it('数字位仍是里程表式，不受 ramp 影响', () => {
    expect(rollStrip('9', '7', 'up', 3)).toEqual({ strip: '7\n8', steps: 2 })
  })
})
