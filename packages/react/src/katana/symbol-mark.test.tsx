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
})
