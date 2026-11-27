// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  GROUP_ROW_HEIGHT,
  listRowHeight,
  TITLE_MAX_LINES,
  VIRTUAL_THRESHOLD,
  type RowFonts,
  type RowInput,
} from './news-feed-rows.ts'

const fonts: RowFonts = {
  lineHeight: 16,
  title: '600 12px sans-serif',
  source: '600 12px sans-serif',
  meta: '500 12px sans-serif',
  num: '500 12px sans-serif',
  tag: '500 11px sans-serif',
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

describe('标题后的标签与来源数占宽', () => {
  // 36 个汉字：在够宽的行里是一行，标签与来源数一占就折成两行。
  const title = '标题文字'.repeat(9)
  it('没有标签与来源数时与以前一样（不多算一点宽）', () => {
    expect(listRowHeight(input(title, { tags: [], sourcesText: undefined }), fonts, 700)).toBe(
      listRowHeight(input(title), fonts, 700),
    )
  })
  it('标签与来源数占掉标题的宽：同一个标题加上它们以后不会更矮，在临界宽度上会多折一行', () => {
    const plain = input(title)
    const extras = input(title, { tags: ['公告', '利好'], sourcesText: '3 源' })
    const widths = Array.from({ length: 40 }, (_, i) => 560 + i * 10)
    const heights = widths.map((w) => [listRowHeight(plain, fonts, w), listRowHeight(extras, fonts, w)] as const)
    expect(heights.every(([a, b]) => b >= a)).toBe(true)
    expect(heights.some(([a, b]) => b > a)).toBe(true)
  })
  it('标签与来源数最多占 body 的一半：再多也不会把标题挤成 0 宽', () => {
    const many = input(title, { tags: Array.from({ length: 20 }, () => '很长很长的标签文字') })
    const height = listRowHeight(many, fonts, 700)
    expect(height).toBeLessThanOrEqual(8 + 1 + TITLE_MAX_LINES * 16)
  })
  it('组小标题是固定的 24px', () => {
    expect(GROUP_ROW_HEIGHT).toBe(24)
  })
})
