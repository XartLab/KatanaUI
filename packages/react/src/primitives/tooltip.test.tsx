// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { readFileSync } from 'node:fs'
import { cloneElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TOOLTIP_DELAY_MS, TOOLTIP_SKIP_MS, TooltipProvider, useTooltipDelay } from './tooltip.tsx'

// 悬停时间的真浏览器断言（500ms 出、400ms 内邻居立即换、离开再进重新等）在 e2e/ui-gallery.spec.ts「提示时间」；
// 这里守住数值只在 TooltipProvider 一处：默认值对、可被调用方显式覆盖、件里不再自带常量（kubai Vibe Design Tips 025，#251）。
// 行为底座是 UI SDK 的 Tooltip（#263）：邻居立即出的时长它自己管，TooltipProvider 的 skipDelayDuration 只留名字；延迟经上下文传给里面的 Tooltip。
const delayIn = (provider?: ReactElement) => {
  const Probe = () => <i data-delay={useTooltipDelay()} />
  const out = renderToStaticMarkup(provider ? cloneElement(provider, {}, <Probe />) : <Probe />)
  return Number(/data-delay="(\d+)"/.exec(out)?.[1])
}

describe('TooltipProvider 悬停时间', () => {
  it('默认停 500ms 出，过了 Provider 也是这个值', () => {
    expect(TOOLTIP_DELAY_MS).toBe(500)
    expect(TOOLTIP_SKIP_MS).toBe(400)
    expect(delayIn()).toBe(TOOLTIP_DELAY_MS)
    expect(delayIn(<TooltipProvider />)).toBe(TOOLTIP_DELAY_MS)
  })

  it('调用方显式给的值照用', () => {
    expect(delayIn(<TooltipProvider delayDuration={0} />)).toBe(0)
    expect(delayIn(<TooltipProvider delayDuration={1200} />)).toBe(1200)
  })

  it('Toolbar 与 DecimalField 不再自带时间常量', () => {
    for (const file of ['../blocks/toolbar/toolbar.tsx', '../quant/decimal-field.tsx']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(source, file).not.toMatch(/TIP_DELAY_MS|delayDuration=|skipDelayDuration=/)
    }
  })
})
