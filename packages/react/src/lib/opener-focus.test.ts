// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { openerOf } from './opener-focus.ts'

// Safari 与 Mac Firefox 点按钮不给按钮焦点，打开时 activeElement 是 body：不能记它，不然关闭时拦下 Radix 回触发器（KatanaUI #242）。
// 单测跑在 Node 里，没有 DOM：给一个最小的 HTMLElement，让 instanceof 成立。
globalThis.HTMLElement ??= class {} as unknown as typeof HTMLElement
const element = () => Object.create(HTMLElement.prototype) as HTMLElement

describe('openerOf', () => {
  const body = element()

  it('拿着焦点的是 body 或没有：不记，交给 Radix 回触发器', () => {
    expect(openerOf(body, body)).toBeNull()
    expect(openerOf(null, body)).toBeNull()
  })

  it('拿着焦点的是别的元素：记下它', () => {
    const button = element()
    expect(openerOf(button, body)).toBe(button)
  })
})
