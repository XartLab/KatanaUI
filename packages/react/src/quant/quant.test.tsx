// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ChangeText, PnlText } from './index.ts'

// 件的结构：涨跌色在浏览器里读计算后的颜色（e2e/ui-gallery.spec.ts，含 data-updown="cn" 互换）；这里查服务端渲染出的标记与文字。

describe('ChangeText', () => {
  it('涨：带 + 号的文字，tone=up；跌：tone=down；平：tone=flat', () => {
    expect(renderToStaticMarkup(<ChangeText value={1.234} />)).toMatch(/data-tone="up"[^>]*>\+1\.23%</)
    expect(renderToStaticMarkup(<ChangeText value={-0.5} />)).toMatch(/data-tone="down"[^>]*>-0\.50%</)
    expect(renderToStaticMarkup(<ChangeText value={0} />)).toMatch(/data-tone="flat"[^>]*>0\.00%</)
  })

  it('颜色只读 --pnl-up / --pnl-down，不写死绿或红', () => {
    const html = renderToStaticMarkup(<ChangeText value={1} />)
    expect(html).toContain('text-(--pnl-up)')
    expect(html).toContain('text-(--pnl-down)')
    expect(html).not.toMatch(/signal-(green|red)|#[0-9a-f]{3,6}/i)
  })

  it('箭头可选：开了写 ▲ / ▼（读屏忽略），平不写；类名与别的属性透传', () => {
    expect(renderToStaticMarkup(<ChangeText value={1} arrow />)).toContain('aria-hidden="true"')
    expect(renderToStaticMarkup(<ChangeText value={1} arrow />)).toContain('▲')
    expect(renderToStaticMarkup(<ChangeText value={-1} arrow />)).toContain('▼')
    expect(renderToStaticMarkup(<ChangeText value={0} arrow />)).not.toMatch(/▲|▼/)
    expect(renderToStaticMarkup(<ChangeText value={1} className="w-full" title="x" />)).toMatch(/class="[^"]*w-full"/)
  })

  it('位数由调用方传', () => {
    expect(renderToStaticMarkup(<ChangeText value={1.23456} digits={3} />)).toContain('+1.235%')
  })
})

describe('PnlText', () => {
  it('文字是调用方格式化好的，方向由 value 定；字符串里的「−」当负号', () => {
    expect(renderToStaticMarkup(<PnlText value="12.5">+12.5 USDT</PnlText>)).toMatch(
      /data-tone="up"[^>]*>\+12\.5 USDT</,
    )
    expect(renderToStaticMarkup(<PnlText value={'−3'}>{'−3'}</PnlText>)).toContain('data-tone="down"')
    expect(renderToStaticMarkup(<PnlText value={null}>—</PnlText>)).toContain('data-tone="flat"')
  })

  it('亏损额写成正数时用 tone 盖掉；as 可以换成 strong', () => {
    const html = renderToStaticMarkup(
      <PnlText value={120} tone="down" as="strong">
        120.00
      </PnlText>,
    )
    expect(html).toContain('data-tone="down"')
    expect(html.startsWith('<strong')).toBe(true)
  })
})
