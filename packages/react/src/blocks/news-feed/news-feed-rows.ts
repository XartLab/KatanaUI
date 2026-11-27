// SPDX-License-Identifier: MIT
// 新闻流「列表」排法的行高：不渲染就按文字折行算出来，交给虚拟列表（pretext 的典型用法：行高不靠估、不靠渲染后再量、不跳动）。
// 下面的常量全部抄自 theme/news-feed.css 的 `.k-news[data-layout='list']` 一节；改了那边的内距、列宽，这里要一起改（e2e 里有「算的高 = 渲染出来的高」的核对）。
import { fontFor, measureText, textHeight } from '../../lib/text-measure.ts'

/** 条目多于这个数才虚拟化（≤ 这个数时行为与不虚拟化的老写法完全一样）。 */
export const VIRTUAL_THRESHOLD = 50
/** 列表标题最多折几行（超出省略），与 news-feed.css 的列表标题规则同源。 */
export const TITLE_MAX_LINES = 2

// ── 抄自 news-feed.css（list 排法的 .k-news-item）──
const ROW_MIN_HEIGHT = 32 // min-height: 32px（含边框，border-box）
const ROW_PAD_Y = 4 // padding: 4px 8px 的 4px
const ROW_PAD_X = 8 // padding: 4px 8px 的 8px
const ROW_BORDER = 1 // border-bottom: 1px
const META_WIDTH = 148 // grid-template-columns: 148px minmax(0,1fr) auto 的第一列
const COLUMN_GAP = 12 // gap: 12px（三列，两条缝；第三列没内容也占缝）
const META_GAP_X = 8 // .k-news-meta 的 gap: 0 8px
const TIME_MIN_WIDTH = 52 // .k-news-time 的 min-width
const FLAG_WIDTH = 6 // .k-news-flag 6×6
const STACK_SIZE = 22 // 叠放徽标 22×22
const STACK_OVERLAP = 6 // 相邻徽标 margin-left: -6px
const CHIP_HEIGHT = 20 // 胶囊 height: 20px
const CHIP_EXTRA_WIDTH = 2 + 3 + 8 + 14 + 4 // 边框 + 左内距 + 右内距 + 图标 14 + 图标与代码的缝
const CHIP_GAP = 4 // .k-news-symbols 的 gap
const ACTIONS_MARGIN = 64 // 有快捷操作时品种徽标让出的 margin-inline-end
const BODY_GAP = 8 // .k-news-body（列表排法下是 flex）的 gap：标题与标签、来源数那一段之间
const EXTRAS_GAP = 6 // .k-news-extras 的 gap：标签之间、标签与来源数之间
const EXTRAS_MAX_SHARE = 0.5 // .k-news-extras 的 max-width: 50%，再多就裁掉，免得把标题挤没
const TAG_HEIGHT = 18 // .k-news-tag：16px 行高 + 上下边框各 1px
const TAG_EXTRA_WIDTH = 2 * 6 + 2 // .k-news-tag 左右内距各 6px（固定值，不随密度变）+ 左右边框各 1px
/** 组小标题那一行的高度（含下边框），与 theme/news-feed.css 的 .k-news-group 的 height 同源。 */
export const GROUP_ROW_HEIGHT = 24

export type RowFonts = {
  /** 文字行高（px）：取自 --text-data 的行高，随 --k-text-scale 变。 */
  lineHeight: number
  /** 标题（600 字重）、来源（600）、时间与阅读分钟（--text-data 的字重）、品种代码（--font-num）。 */
  title: string
  source: string
  meta: string
  num: string
  /** 标签字：比正文小一号（字号减 1px）、500 字重。 */
  tag: string
}

/** 从滚动区元素读出当前的字号、字重、行高与具名字体（字体与缩放都由 CSS 变量决定，所以每次从元素读）。 */
export function readRowFonts(element: Element): RowFonts {
  const style = getComputedStyle(element)
  const size = Number.parseFloat(style.fontSize) || 12
  const lineHeight = Number.parseFloat(style.lineHeight) || Math.round(size * 1.3333)
  const weight = Number.parseInt(style.fontWeight, 10) || 500
  return {
    lineHeight,
    title: fontFor(600, size, '--font-sans', element),
    source: fontFor(600, size, '--font-sans', element),
    meta: fontFor(weight, size, '--font-sans', element),
    num: fontFor(weight, size, '--font-num', element),
    tag: fontFor(500, size - 1, '--font-sans', element),
  }
}

export type RowInput = {
  title: string
  source: string
  /** 已按 labels.ago 排好的相对时间文字。 */
  time: string
  /** 已按 labels.read 排好的文字；没有就不传。 */
  read?: string
  important: boolean
  symbolCodes: readonly string[]
  symbolStyle: 'stack' | 'chips'
  hasActions: boolean
  /** 标题后的标签文字（按顺序）；没有就不传。 */
  tags?: readonly string[]
  /** 已按 labels.sourceCount 排好的来源数文字（来源数大于 1 才有）；没有就不传。 */
  sourcesText?: string
}

/** 元信息列（148px、flex-wrap）：按顺序 时间、来源、阅读分钟、重要标记，贪心折行，返回行数。 */
function metaLines(input: RowInput, fonts: RowFonts): number {
  const widths = [
    Math.max(TIME_MIN_WIDTH, measureText(input.time, fonts.meta)),
    measureText(input.source, fonts.source),
  ]
  if (input.read) widths.push(measureText(input.read, fonts.meta))
  if (input.important) widths.push(FLAG_WIDTH)
  let lines = 1
  let used = 0
  for (const width of widths) {
    if (used > 0 && used + META_GAP_X + width > META_WIDTH) {
      lines += 1
      used = width
    } else used += (used > 0 ? META_GAP_X : 0) + width
  }
  return lines
}

/** 品种徽标列（grid 的 auto 列）的宽与高。胶囊排法按单行算（代码短，实际不折）。 */
function symbolsBox(input: RowInput, fonts: RowFonts): { width: number; height: number } {
  const count = input.symbolCodes.length
  if (count === 0) return { width: 0, height: 0 }
  if (input.symbolStyle === 'stack')
    return { width: count * STACK_SIZE - (count - 1) * STACK_OVERLAP, height: STACK_SIZE }
  const width =
    input.symbolCodes.reduce((sum, code) => sum + CHIP_EXTRA_WIDTH + measureText(code, fonts.num), 0) +
    (count - 1) * CHIP_GAP
  return { width, height: CHIP_HEIGHT }
}

/** 标题后面那一段（标签加来源数）的宽度，已按最多占 EXTRAS_MAX_SHARE 封顶；没有就是 0。bodyWidth 是 .k-news-body 的宽。 */
function extrasWidth(input: RowInput, fonts: RowFonts, bodyWidth: number): number {
  const widths = (input.tags ?? []).map((tag) => measureText(tag, fonts.tag) + TAG_EXTRA_WIDTH)
  if (input.sourcesText) widths.push(measureText(input.sourcesText, fonts.meta))
  if (widths.length === 0) return 0
  const natural = widths.reduce((sum, width) => sum + width, 0) + (widths.length - 1) * EXTRAS_GAP
  return Math.min(natural, Math.max(0, bodyWidth) * EXTRAS_MAX_SHARE)
}

/** 一行（含下边框）的高度，宽度是 .k-news-items 的宽（滚动区去掉滚动条）。 */
export function listRowHeight(input: RowInput, fonts: RowFonts, width: number): number {
  if (width <= 0) return ROW_MIN_HEIGHT
  const symbols = symbolsBox(input, fonts)
  const margin = symbols.width > 0 && input.hasActions ? ACTIONS_MARGIN : 0
  const bodyWidth = width - 2 * ROW_PAD_X - META_WIDTH - 2 * COLUMN_GAP - symbols.width - margin
  const extras = extrasWidth(input, fonts, bodyWidth)
  const titleWidth = bodyWidth - (extras > 0 ? extras + BODY_GAP : 0)
  const titleLines = Math.min(
    TITLE_MAX_LINES,
    Math.max(
      1,
      Math.round(textHeight(input.title, fonts.title, Math.max(1, titleWidth), fonts.lineHeight) / fonts.lineHeight),
    ),
  )
  const content = Math.max(
    titleLines * fonts.lineHeight,
    metaLines(input, fonts) * fonts.lineHeight,
    symbols.height,
    input.tags?.length ? TAG_HEIGHT : 0,
  )
  return Math.max(ROW_MIN_HEIGHT, ROW_PAD_Y * 2 + ROW_BORDER + content)
}
