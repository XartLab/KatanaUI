// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  CASCADE_TIMING,
  DwellGuard,
  inSafeZone,
  inTriangle,
  openDelayFor,
  safeBandWidth,
  safeZone,
  submenuSide,
  type Box,
} from './cascade-model.ts'

// 级联菜单的几何与时间（#250，kubai 002）。数值照 issue 抄录：220 / 420 / 1200（80 复查）/ 360，带宽 min(90, max(56, 43%))。

describe('时间常量', () => {
  it('一处具名常量，数值照 002', () => {
    expect(CASCADE_TIMING).toEqual({
      openDelay: 220,
      dragOpenDelay: 420,
      safeWindow: 1200,
      safeRecheck: 80,
      closeDelay: 360,
    })
  })
  it('拖着东西经过 420，普通悬停 220', () => {
    expect(openDelayFor(true)).toBe(420)
    expect(openDelayFor(false)).toBe(220)
  })
})

describe('safeBandWidth：min(90, max(56, 父宽 43%))', () => {
  it('窄菜单取下限 56', () => {
    expect(safeBandWidth(100)).toBe(56)
    expect(safeBandWidth(130)).toBe(56)
  })
  it('中间按 43%', () => {
    expect(safeBandWidth(180)).toBeCloseTo(77.4)
    expect(safeBandWidth(200)).toBeCloseTo(86)
  })
  it('宽菜单取上限 90', () => {
    expect(safeBandWidth(210)).toBe(90)
    expect(safeBandWidth(600)).toBe(90)
  })
})

describe('inTriangle：三条边的叉积同号', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 100, y: -40 }
  const c = { x: 100, y: 60 }
  it('里面的点', () => {
    expect(inTriangle({ x: 50, y: 5 }, a, b, c)).toBe(true)
    expect(inTriangle({ x: 99, y: 0 }, a, b, c)).toBe(true)
  })
  it('外面的点：背离子菜单、超出上下边', () => {
    expect(inTriangle({ x: -5, y: 0 }, a, b, c)).toBe(false)
    expect(inTriangle({ x: 50, y: 60 }, a, b, c)).toBe(false)
    expect(inTriangle({ x: 50, y: -40 }, a, b, c)).toBe(false)
    expect(inTriangle({ x: 0, y: 30 }, a, b, c)).toBe(false)
  })
  it('边上与顶点算里面', () => {
    expect(inTriangle(a, a, b, c)).toBe(true)
    expect(inTriangle({ x: 100, y: 10 }, a, b, c)).toBe(true)
  })
  it('三个顶点绕向相反时结果相同', () => {
    expect(inTriangle({ x: 50, y: 5 }, a, c, b)).toBe(true)
    expect(inTriangle({ x: 50, y: 60 }, a, c, b)).toBe(false)
  })
})

const parent: Box = { left: 0, top: 0, right: 180, bottom: 300 }
const sub: Box = { left: 182, top: 100, right: 362, bottom: 180 }

describe('safeZone 与 inSafeZone', () => {
  it('子菜单在右边：用左边缘的上下两角，保护带是父菜单右侧 43% 宽（到子菜单近边）', () => {
    expect(submenuSide(parent, sub)).toBe('right')
    const zone = safeZone({ x: 150, y: 120 }, parent, sub)
    expect(zone.near).toEqual([
      { x: 182, y: 100 },
      { x: 182, y: 180 },
    ])
    expect(zone.band.from).toBeCloseTo(180 - 77.4)
    expect(zone.band.to).toBe(182)
  })
  it('三角里且在带内：护着', () => {
    const zone = safeZone({ x: 150, y: 120 }, parent, sub)
    expect(inSafeZone({ x: 170, y: 140 }, zone)).toBe(true)
  })
  it('三角里但在带外（父菜单靠左的地方）：不护', () => {
    const zone = safeZone({ x: 10, y: 120 }, parent, sub)
    expect(inSafeZone({ x: 60, y: 130 }, zone)).toBe(false)
  })
  it('在带内但出了三角（直着往下）：不护', () => {
    const zone = safeZone({ x: 150, y: 120 }, parent, sub)
    expect(inSafeZone({ x: 150, y: 200 }, zone)).toBe(false)
  })
  it('子菜单翻到左边：用右边缘，带在父菜单左侧', () => {
    const flipped: Box = { left: -182, top: 100, right: -2, bottom: 180 }
    expect(submenuSide(parent, flipped)).toBe('left')
    const zone = safeZone({ x: 30, y: 120 }, parent, flipped)
    expect(zone.near[0].x).toBe(-2)
    expect(zone.band.to).toBeCloseTo(77.4)
    expect(inSafeZone({ x: 10, y: 130 }, zone)).toBe(true)
    expect(inSafeZone({ x: 150, y: 130 }, zone)).toBe(false)
  })
})

describe('DwellGuard：1200ms 安全窗口', () => {
  it('三角里停在同一行：1199 护着，1200 放行', () => {
    const guard = new DwellGuard<string>()
    expect(guard.judge({ row: 'a', now: 0, inZone: true })).toBe('hold')
    expect(guard.judge({ row: 'a', now: 80, inZone: true })).toBe('hold')
    expect(guard.judge({ row: 'a', now: 1199, inZone: true })).toBe('hold')
    expect(guard.judge({ row: 'a', now: 1200, inZone: true })).toBe('release')
  })
  it('离开三角立即放行', () => {
    const guard = new DwellGuard<string>()
    guard.judge({ row: 'a', now: 0, inZone: true })
    expect(guard.judge({ row: 'a', now: 100, inZone: false })).toBe('release')
  })
  it('换了一行，重新计 1200', () => {
    const guard = new DwellGuard<string>()
    guard.judge({ row: 'a', now: 0, inZone: true })
    expect(guard.judge({ row: 'b', now: 1000, inZone: true })).toBe('hold')
    expect(guard.judge({ row: 'b', now: 2199, inZone: true })).toBe('hold')
    expect(guard.judge({ row: 'b', now: 2200, inZone: true })).toBe('release')
  })
  it('reset 之后从头计', () => {
    const guard = new DwellGuard<string>()
    guard.judge({ row: 'a', now: 0, inZone: true })
    guard.reset()
    expect(guard.judge({ row: 'a', now: 5000, inZone: true })).toBe('hold')
  })
})
