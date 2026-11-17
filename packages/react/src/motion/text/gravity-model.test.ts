// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { fallStep, reformStep, type FallWorld, type LetterPhysics } from './gravity-model.ts'

const letter = (patch: Partial<LetterPhysics> = {}): LetterPhysics => ({
  angle: 0,
  angularVel: 0,
  dx: 0,
  dy: 0,
  releaseAt: 0,
  settled: false,
  vx: 0,
  vy: 0,
  ...patch,
})
const world: FallWorld = {
  bounce: 0.35,
  friction: 0.4,
  gravity: 1200,
  floorLimit: 60,
  leftLimit: -100,
  rightLimit: 100,
}

describe('gravity model', () => {
  it('字被重力往下拉，最终停在地面并标记静止', () => {
    const p = letter()
    for (let i = 0; i < 600 && !p.settled; i += 1) fallStep(p, 1 / 60, world)
    expect(p.settled).toBe(true)
    expect(p.dy).toBe(world.floorLimit)
  })

  it('撞墙反弹：越过右墙被拉回墙上，水平速度反向', () => {
    const p = letter({ vx: 5000 })
    fallStep(p, 0.05, world)
    expect(p.dx).toBe(world.rightLimit)
    expect(p.vx).toBeLessThan(0)
  })

  it('回位：弹簧把偏移的字拉回原位，最后吸附为 0', () => {
    const p = letter({ dx: 40, dy: 50, angle: 30, settled: false })
    let moving = true
    for (let i = 0; i < 1200 && moving; i += 1) moving = reformStep(p, 1 / 60)
    expect(moving).toBe(false)
    expect([p.dx, p.dy, p.angle]).toEqual([0, 0, 0])
    expect(p.settled).toBe(true)
  })
})
