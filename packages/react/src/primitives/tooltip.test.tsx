// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { readFileSync } from 'node:fs'
import type { ReactElement } from 'react'
import { TOOLTIP_DELAY_MS, TOOLTIP_SKIP_MS, TooltipProvider } from './tooltip.tsx'

// 悬停时间的真浏览器断言（500ms 出、400ms 内邻居立即换、离开再进重新等）在 e2e/ui-gallery.spec.ts「提示时间」；
// 这里守住数值只在 TooltipProvider 一处：默认值对、可被调用方显式覆盖、件里不再自带常量（kubai Vibe Design Tips 025，#251）。
// TooltipProvider 外面套了一层「在 Provider 里」的上下文，里面那个才是 Radix 的 Provider：取它的属性。
const radixProps = (element: ReactElement) =>
  (element.props as { children: ReactElement }).children.props as { delayDuration: number; skipDelayDuration: number }

describe('TooltipProvider 悬停时间', () => {
  it('默认停 500ms 出，出过以后 400ms 内邻居立即出', () => {
    expect(TOOLTIP_DELAY_MS).toBe(500)
    expect(TOOLTIP_SKIP_MS).toBe(400)
    const props = radixProps(TooltipProvider({}))
    expect(props.delayDuration).toBe(TOOLTIP_DELAY_MS)
    expect(props.skipDelayDuration).toBe(TOOLTIP_SKIP_MS)
  })

  it('调用方显式给的值照用', () => {
    const props = radixProps(TooltipProvider({ delayDuration: 0, skipDelayDuration: 0 }))
    expect(props.delayDuration).toBe(0)
    expect(props.skipDelayDuration).toBe(0)
  })

  it('Toolbar 与 DecimalField 不再自带时间常量', () => {
    for (const file of ['../blocks/toolbar/toolbar.tsx', '../quant/decimal-field.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(source, file).not.toMatch(/TIP_DELAY_MS|delayDuration=|skipDelayDuration=/)
    }
  })
})
