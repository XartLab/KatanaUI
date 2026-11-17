// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { dayKeyIn, hhmm, isoDate, mss } from './date.ts'
import { clamp, extent, pad, pct, signed } from './num.ts'
import { ledOf, statusColor } from './severity.ts'
import { toneColor } from './tone.ts'

// G0 收拢的共用工具：行为照被替换的本地实现（体检 §1），这里钉住边界。
describe('num', () => {
  it('clamp 是 Math.min(max, Math.max(min, value))：min > max 时得 max', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
    expect(clamp(0.5, 2, 1)).toBe(1)
    expect(clamp(Number.NaN, 0, 1)).toBeNaN()
  })

  it('pad、signed、pct', () => {
    expect(pad(7)).toBe('07')
    expect(pad(2026, 4)).toBe('2026')
    expect(pad(12, 4)).toBe('0012')
    expect(signed(1.5)).toBe('+1.5')
    expect(signed(-1.5, (v) => v.toFixed(2))).toBe('-1.50')
    expect(signed(0)).toBe('0')
    expect(pct(1, 4)).toBe('25%')
  })

  it('extent 跳过非有限数，可把 0 包进来，全空是 [0, 1]', () => {
    expect(extent([3, Number.NaN, -2, 5])).toEqual([-2, 5])
    expect(extent([3, 5], true)).toEqual([0, 5])
    expect(extent([])).toEqual([0, 1])
    expect(extent([Number.POSITIVE_INFINITY])).toEqual([0, 1])
  })
})

describe('date', () => {
  it('isoDate、dayKeyIn、hhmm、mss', () => {
    expect(isoDate(Date.UTC(2026, 0, 2, 23))).toBe('2026-01-02')
    expect(dayKeyIn(Date.UTC(2026, 0, 2, 23), 'Asia/Shanghai')).toBe('2026-01-03')
    expect(hhmm(9 * 60 + 5)).toBe('09:05')
    expect(mss(75)).toBe('1:15')
  })
})

describe('severity 与 tone', () => {
  it('ledOf：neutral 与 off 不亮，accent 是亮的强调灯', () => {
    expect([ledOf('neutral'), ledOf('off'), ledOf('accent'), ledOf('ok'), ledOf('warn'), ledOf('danger')]).toEqual([
      'off',
      'off',
      'on',
      'ok',
      'warn',
      'danger',
    ])
  })

  it('取色读 characteristics', () => {
    expect(statusColor('danger')).toBe('var(--k-status-danger-foreground)')
    expect(statusColor('ok', 'borderColor')).toBe('var(--k-status-ok-borderColor)')
    expect(toneColor('up')).toBe('var(--k-tone-up-foreground)')
  })
})
