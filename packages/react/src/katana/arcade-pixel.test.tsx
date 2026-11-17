// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ARCADE_SPRITES, ArcadePixel } from './arcade-pixel.tsx'
import { CHARACTER_UNIT_WIDTH, resolveGrid } from './arcade-pixel-sprites.ts'

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

  it('精灵优先于文字；读屏名取 label，其次 text；都没有就整块对读屏隐藏（不带兜底文案）', () => {
    const bare = renderToStaticMarkup(<ArcadePixel sprite={ARCADE_SPRITES.heart} />)
    expect(bare).toMatch(/^<div[^>]* data-slot="arcade-pixel" aria-hidden="true"/)
    expect(bare).not.toContain('sr-only')
    const named = renderToStaticMarkup(<ArcadePixel sprite={ARCADE_SPRITES.heart} text="HI" label="Heart" />)
    expect(named).toContain('<span class="sr-only">Heart</span>')
  })

  it('不写死颜色：默认调色板读 --accent，闪烁层是 k-arcade-flicker（皮肤读 token）', () => {
    const html = renderToStaticMarkup(<ArcadePixel text="A" crt />)
    expect(html).toContain('k-arcade-flicker')
    expect(html).not.toContain('bg-white')
  })
})

describe('arcade-pixel-sprites', () => {
  it('文字按 5x7 排：两个字之间空一列，不认识的字画成空格', () => {
    const grid = resolveGrid(undefined, 'I?')
    expect(grid).toHaveLength(7)
    expect(grid[0]).toHaveLength(5 + 1 + 5)
    expect(resolveGrid(undefined, '中')[3]).toEqual([0, 0, 0, 0, 0])
    expect(CHARACTER_UNIT_WIDTH).toBe(6)
    expect(resolveGrid(ARCADE_SPRITES.heart, 'X')).toBe(ARCADE_SPRITES.heart)
  })
})
