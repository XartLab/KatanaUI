// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { listRowHeight, TITLE_MAX_LINES, VIRTUAL_THRESHOLD, type RowFonts, type RowInput } from './news-feed-rows.ts'

const fonts: RowFonts = {
  lineHeight: 16,
  title: '600 12px sans-serif',
  source: '600 12px sans-serif',
  meta: '500 12px sans-serif',
  num: '500 12px sans-serif',
}
const input = (title: string, extra: Partial<RowInput> = {}): RowInput => ({
  title,
  source: '来源',
  time: '3 分钟前',
  important: false,
  symbolCodes: [],
  symbolStyle: 'stack',
  hasActions: false,
  ...extra,
})

describe('列表行高', () => {
  it('短标题取最小行高 32，没量到宽度（0）时也是 32', () => {
    expect(listRowHeight(input('短'), fonts, 600)).toBe(32)
    expect(listRowHeight(input('长'.repeat(200)), fonts, 0)).toBe(32)
  })
  it('长标题折行但最多 TITLE_MAX_LINES 行；宽度越窄越高（不会更矮）', () => {
    const long = '很长的标题'.repeat(30)
    const wide = listRowHeight(input(long), fonts, 900)
    const narrow = listRowHeight(input(long), fonts, 400)
    expect(narrow).toBeGreaterThanOrEqual(wide)
    expect(narrow).toBe(8 + 1 + TITLE_MAX_LINES * 16)
  })
  it('阈值是 50', () => {
    expect(VIRTUAL_THRESHOLD).toBe(50)
  })
})
