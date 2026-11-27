// SPDX-License-Identifier: MIT
// 文字动效共用的切分与排序小函数（纯函数，单测在 split.test.ts）。
// 按字切用字形簇（Intl.Segmenter），免得 emoji、带音标的字被劈成两半；没有 Segmenter 的环境退回按码点切。

export type StaggerOrder = 'forward' | 'center' | 'edges'

export function segmentGraphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(value), (entry) => entry.segment)
  }
  return Array.from(value)
}

/** 第 index 个（共 count 个）的错峰序号：forward 是 0、1、2…；center 离中心越远越晚；edges 离两端越远越晚（从两头往中间合）。 */
export function staggerStep(index: number, count: number, order: StaggerOrder): number {
  if (order === 'center') return Math.abs(index - (count - 1) / 2)
  if (order === 'edges') return Math.min(index, count - 1 - index)
  return index
}

/** 按行切：给了 lines 用 lines，否则按换行切文字。 */
export function splitLines(text: string | undefined, lines: readonly string[] | undefined): string[] {
  if (lines) return [...lines]
  return text ? text.split('\n') : []
}
