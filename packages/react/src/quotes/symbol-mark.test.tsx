// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SymbolMark, symbolMarkLetters } from './symbol-mark.tsx'

describe('品种徽标', () => {
  it('字母：代码里的拉丁字母前 2 个；没有字母取名称首字，再没有取代码首字符', () => {
    expect(symbolMarkLetters('BTCUSDT')).toBe('BT')
    expect(symbolMarkLetters('aapl', 'Apple')).toBe('AA')
    expect(symbolMarkLetters('600519', '贵州茅台')).toBe('贵')
    expect(symbolMarkLetters('00700')).toBe('0')
  })

  it('没有 src 画字母圆标，读屏名用 name；有 src 画 img', () => {
    const letters = renderToStaticMarkup(<SymbolMark code="600519" name="贵州茅台" />)
    expect(letters).toContain('data-kind="letters"')
    expect(letters).toContain('aria-label="贵州茅台"')
    expect(letters).not.toContain('<img')
    const image = renderToStaticMarkup(<SymbolMark code="BTC" src="/x.svg" size={28} />)
    expect(image).toContain('data-kind="image"')
    expect(image).toContain('<img')
    expect(image).toContain('aria-label="BTC"')
    expect(image).toContain('width:28px')
  })

  it('symbol 是新名（code 旧名照认）；size 取 sm | md，字号交给 css 的 data-size，不内联', () => {
    const sm = renderToStaticMarkup(<SymbolMark symbol="AAPL" />)
    expect(sm).toContain('aria-label="AAPL"')
    expect(sm).toContain('data-size="sm"')
    expect(sm).toContain('width:18px')
    expect(sm).not.toContain('font-size')
    const md = renderToStaticMarkup(<SymbolMark symbol="AAPL" size="md" />)
    expect(md).toContain('data-size="md"')
    expect(md).toContain('width:28px')
    expect(renderToStaticMarkup(<SymbolMark code="TSLA" size={14} />)).toContain('data-size="sm"')
  })

  it('字母按规整后的代码取（#95）：600519.SH → 名称首字，BINANCE:BTCUSDT → BT', () => {
    const a = renderToStaticMarkup(<SymbolMark symbol="600519.SH" name="贵州茅台" />)
    expect(a).toContain('>贵</span>')
    expect(a).toContain('aria-label="贵州茅台"')
    expect(renderToStaticMarkup(<SymbolMark symbol="BINANCE:BTCUSDT" />)).toContain('>BT</span>')
    expect(renderToStaticMarkup(<SymbolMark symbol="sh600519" />)).toContain('>6</span>')
    expect(renderToStaticMarkup(<SymbolMark symbol="AAPL.O" />)).toContain('>AA</span>')
    // 读屏名仍是原样代码。
    expect(renderToStaticMarkup(<SymbolMark symbol="AAPL.O" />)).toContain('aria-label="AAPL.O"')
  })
})
