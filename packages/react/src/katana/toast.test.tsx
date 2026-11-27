// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastCountdown,
  ToastText,
  ToastTitle,
  ToastViewport,
  countdownOffset,
} from './toast.tsx'

// 读屏语义与撤销零件的结构（kubai Vibe Design Tips 016，#251）。看得见的样子与点击在 e2e/ui-gallery.spec.ts「弹出提示」。
const roleOf = (html: string) => /<div\b[^>]*data-slot="toast"[^>]*>/.exec(html)?.[0].match(/\srole="([^"]*)"/)?.[1]

describe('Toast 读屏', () => {
  it('视口常驻、aria-live=polite：状态提示不打断读屏', () => {
    const html = renderToStaticMarkup(<ToastViewport aria-label="提示" />)
    expect(html).toContain('role="region"')
    expect(html).toContain('aria-live="polite"')
    expect(html).not.toContain('assertive')
  })

  it('neutral、ok 没有 role=alert，warn、danger 单条带 role=alert', () => {
    expect(roleOf(renderToStaticMarkup(<Toast />))).toBeUndefined()
    expect(roleOf(renderToStaticMarkup(<Toast tone="ok" />))).toBeUndefined()
    expect(roleOf(renderToStaticMarkup(<Toast tone="warn" />))).toBe('alert')
    expect(roleOf(renderToStaticMarkup(<Toast tone="danger" />))).toBe('alert')
  })

  it('调用方显式给的 role 盖过默认', () => {
    expect(roleOf(renderToStaticMarkup(<Toast tone="danger" role="status" />))).toBe('status')
  })
})

describe('ToastAction 与 ToastCountdown', () => {
  it('ToastAction 是一个按钮，文字由调用方给，不提交表单', () => {
    const html = renderToStaticMarkup(<ToastAction>撤销</ToastAction>)
    expect(html).toContain('<button')
    expect(html).toContain('type="button"')
    expect(html).toContain('data-slot="toast-action"')
    expect(html).toContain('>撤销<')
  })

  it('倒计时环的 dashoffset 随 remaining 变：1 是整环，0 是空，超出范围收进 0 到 1', () => {
    const circumference = 2 * Math.PI * 6
    expect(countdownOffset(1)).toBeCloseTo(0)
    expect(countdownOffset(0)).toBeCloseTo(circumference)
    expect(countdownOffset(0.5)).toBeCloseTo(circumference / 2)
    expect(countdownOffset(2)).toBeCloseTo(0)
    expect(countdownOffset(-1)).toBeCloseTo(circumference)
    expect(countdownOffset(Number.NaN)).toBeCloseTo(circumference)
    const offsetIn = (remaining: number) =>
      Number(/stroke-dashoffset="([^"]*)"/.exec(renderToStaticMarkup(<ToastCountdown remaining={remaining} />))?.[1])
    expect(offsetIn(0.25)).toBeGreaterThan(offsetIn(0.75))
  })

  it('倒计时环是装饰：aria-hidden，里面没有秒数文字', () => {
    const html = renderToStaticMarkup(<ToastCountdown remaining={0.4} />)
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toMatch(/<text|<title/)
  })

  it('一条动作 toast 能按「图标 · 文字 · 环 · 撤销 · 关闭」拼起来', () => {
    const html = renderToStaticMarkup(
      <Toast>
        <ToastContent>
          <ToastText>
            <ToastTitle>已删除</ToastTitle>
          </ToastText>
          <ToastCountdown remaining={1} />
          <ToastAction>撤销</ToastAction>
          <ToastClose label="关掉" />
        </ToastContent>
      </Toast>,
    )
    const order = ['toast-title', 'toast-countdown"', 'toast-action', 'toast-close'].map((slot) => html.indexOf(slot))
    expect(order.every((index) => index >= 0)).toBe(true)
    expect(order).toEqual(order.toSorted((a, b) => a - b))
  })
})
