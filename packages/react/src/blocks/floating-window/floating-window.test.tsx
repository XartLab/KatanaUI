// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { FloatingWindow, isFloatingWindowSupported, useFloatingWindow } from './floating-window.tsx'
import { watchPipClose } from './pip-window.ts'
import { arrowDelta, clampPosition } from './floating-window-model.ts'

const labels = { close: '关闭悬浮窗', move: '移动悬浮窗' }
const render = (props: { open: boolean; inPageOnly?: boolean }) =>
  renderToStaticMarkup(
    <FloatingWindow {...props} title="下单" labels={labels} placeholder={<p>已在悬浮窗</p>}>
      <button type="button">买入</button>
    </FloatingWindow>,
  )

// 单测在 Node 里跑：没有 window，注入 / 删掉 documentPictureInPicture 的办法是给 window 放一个桩。
const withWindow = (pip?: object) => vi.stubGlobal('window', pip ? { documentPictureInPicture: pip } : {})
afterEach(() => vi.unstubAllGlobals())

describe('FloatingWindow 选哪种窗', () => {
  it('浏览器没有 documentPictureInPicture：开着时走页内浮层（popover、role=dialog、关闭钮、占位）', () => {
    withWindow()
    expect(isFloatingWindowSupported()).toBe(false)
    const html = render({ open: true })
    expect(html).toContain('data-mode="overlay"')
    expect(html).toContain('popover="manual"')
    expect(html).toMatch(/role="dialog"[^>]*aria-label="下单"/)
    expect(html).toContain('aria-label="关闭悬浮窗"')
    expect(html).toContain('aria-label="移动悬浮窗"')
    expect(html).toContain('已在悬浮窗')
  })

  it('浏览器有 documentPictureInPicture：开着时先留在原处等窗（真窗口在 effect 里请求）', () => {
    withWindow({ requestWindow: async () => ({}) })
    expect(isFloatingWindowSupported()).toBe(true)
    const html = render({ open: true })
    expect(html).toContain('data-mode="docked"')
    expect(html).not.toContain('popover')
    expect(html).not.toContain('已在悬浮窗')
  })

  it('inPageOnly：有 PiP 也只用页内浮层；关着时永远在原处', () => {
    withWindow({ requestWindow: async () => ({}) })
    expect(render({ open: true, inPageOnly: true })).toContain('data-mode="overlay"')
    expect(render({ open: false })).toContain('data-mode="docked"')
    withWindow()
    expect(render({ open: false })).not.toContain('popover')
  })

  it('服务端没有 window：当作不支持，不报错', () => {
    expect(isFloatingWindowSupported()).toBe(false)
  })
})

describe('useFloatingWindow().supported', () => {
  const Probe = () => <span data-supported={String(useFloatingWindow().supported)} />

  it('服务端与水合那一遍渲染时不读 window：有 PiP 也是 false，避免服务端与客户端输出对不上', () => {
    withWindow({ requestWindow: async () => ({}) })
    expect(isFloatingWindowSupported()).toBe(true)
    expect(renderToStaticMarkup(<Probe />)).toContain('data-supported="false"')
  })
})

describe('用户关 PiP 窗', () => {
  const fakeWindow = () => {
    const listeners = new Map<string, () => void>()
    return {
      listeners,
      win: {
        addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
        removeEventListener: (type: string, fn: () => void) => {
          if (listeners.get(type) === fn) listeners.delete(type)
        },
      },
    }
  }

  it('pagehide：先搬回内容（release）再回调 onClose（notify）', () => {
    const { listeners, win } = fakeWindow()
    const order: string[] = []
    watchPipClose(
      win,
      () => order.push('release'),
      () => order.push('notify'),
    )
    listeners.get('pagehide')!()
    expect(order).toEqual(['release', 'notify'])
  })

  it('宿主不接 onClose（notify 是空操作）：内容照样搬回', () => {
    const { listeners, win } = fakeWindow()
    const release = vi.fn()
    watchPipClose(win, release, () => {})
    listeners.get('pagehide')!()
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('notify 抛错也不影响已经搬回；摘掉监听后程序关窗不再回调', () => {
    const { listeners, win } = fakeWindow()
    const release = vi.fn()
    const off = watchPipClose(win, release, () => {
      throw new Error('宿主的 onClose 出错')
    })
    expect(() => listeners.get('pagehide')!()).toThrow('宿主的 onClose 出错')
    expect(release).toHaveBeenCalledTimes(1)
    off()
    expect(listeners.has('pagehide')).toBe(false)
  })
})

describe('页内浮层的位置', () => {
  const size = { width: 300, height: 200 }
  const viewport = { width: 1000, height: 800 }

  it('夹进视口：四边都不出去', () => {
    expect(clampPosition({ left: -50, top: -9 }, size, viewport)).toEqual({ left: 0, top: 0 })
    expect(clampPosition({ left: 900, top: 790 }, size, viewport)).toEqual({ left: 700, top: 600 })
    expect(clampPosition({ left: 120, top: 80 }, size, viewport)).toEqual({ left: 120, top: 80 })
  })

  it('浮层比视口大：贴左上，不出现负坐标', () => {
    expect(clampPosition({ left: 50, top: 50 }, { width: 1200, height: 900 }, viewport)).toEqual({ left: 0, top: 0 })
  })

  it('方向键：8px，Shift 32px；别的键是 null', () => {
    expect(arrowDelta('ArrowLeft', false)).toEqual({ dx: -8, dy: 0 })
    expect(arrowDelta('ArrowDown', true)).toEqual({ dx: 0, dy: 32 })
    expect(arrowDelta('Enter', false)).toBeNull()
  })
})
