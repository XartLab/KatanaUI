// SPDX-License-Identifier: MIT
// settle.ts 自己的测试（不截图）：截止时间要抛错并点名；假时钟、假间隔出错也要换回真的，不拖累同文件后面的测试。
import { afterEach, describe, expect, test } from 'vite-plus/test'
import { settled, withFakeIntervals, withFrameClock } from './settle.ts'

afterEach(() => document.body.replaceChildren())

describe('settled', () => {
  test('throws and names the animation that is still running', async () => {
    const box = document.createElement('div')
    document.body.append(box)
    box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 60_000, id: 'long-fade' })
    await expect(settled({ timeout: 400 })).rejects.toThrow(/still not done after 400ms: long-fade/)
  })

  test('throws when a Radix popper never gets its position', async () => {
    const wrapper = document.createElement('div')
    wrapper.dataset.radixPopperContentWrapper = ''
    wrapper.style.transform = 'translate(0, -200%)'
    document.body.append(wrapper)
    await expect(settled({ timeout: 400 })).rejects.toThrow(/radix popper not positioned/)
  })

  test('returns once a finite animation has ended', async () => {
    const box = document.createElement('div')
    document.body.append(box)
    box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 })
    await settled({ timeout: 2000 })
    expect(document.getAnimations().filter((animation) => animation.playState === 'running')).toHaveLength(0)
  })
})

describe('restoring the real clocks', () => {
  test('withFrameClock puts requestAnimationFrame and performance.now back when the step throws', async () => {
    const request = window.requestAnimationFrame
    const now = performance.now
    await expect(
      withFrameClock(() => {
        expect(window.requestAnimationFrame).not.toBe(request)
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    expect(window.requestAnimationFrame).toBe(request)
    expect(performance.now).toBe(now)
    // 真的帧还会来
    await new Promise((resolve) => requestAnimationFrame(resolve))
  })

  test('withFakeIntervals puts setInterval back when the step throws', async () => {
    const real = window.setInterval
    await expect(
      withFakeIntervals(new Date('2026-11-17T09:00:00'), () => {
        expect(window.setInterval).not.toBe(real)
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    // 只剩 Date 是假的：setInterval 回到真的，会真的触发
    let ticks = 0
    const id = window.setInterval(() => (ticks += 1), 10)
    await new Promise((resolve) => setTimeout(resolve, 80))
    window.clearInterval(id)
    expect(ticks).toBeGreaterThan(0)
  })

  test('withFrameClock steps frames deterministically', async () => {
    let seen = 0
    await withFrameClock((clock) => {
      const loop = () => {
        seen += 1
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
      clock.step(10)
      expect(seen).toBe(10)
    })
  })
})
