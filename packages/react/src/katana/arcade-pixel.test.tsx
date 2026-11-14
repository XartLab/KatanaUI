// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ARCADE_SPRITES, ArcadePixel } from './arcade-pixel'

describe('ArcadePixel', () => {
  it('画布装饰（aria-hidden），文字另放 sr-only 给读屏', () => {
    const html = renderToStaticMarkup(<ArcadePixel text="GAME OVER" />)
    expect(html).toMatch(/<div aria-hidden="true"[^>]*><canvas /)
    expect(html).toContain('<span class="sr-only">GAME OVER</span>')
  })

  it('按 5x7 字体算出尺寸：6 个字 = 6*5 + 5 列、7 行', () => {
    const html = renderToStaticMarkup(<ArcadePixel text="KATANA" pixelSize={4} gap={1} />)
    // 35 列 * 5 - 1 = 174，7 行 * 5 - 1 = 34
    expect(html).toContain('height:34px;width:174px')
  })

  it('精灵优先于文字；没有文字时读屏名是 pixel art', () => {
    const html = renderToStaticMarkup(<ArcadePixel sprite={ARCADE_SPRITES.heart} />)
    expect(html).toContain('<span class="sr-only">pixel art</span>')
  })
})
