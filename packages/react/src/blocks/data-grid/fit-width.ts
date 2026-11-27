// SPDX-License-Identifier: MIT
import { measureText } from '../../lib/text-measure.ts'
import { resolveCell, type CellEnv, type GridColumn } from './columns.ts'

// 列宽适应内容（Excel 双击列边、TradingView 选股器的做法）：量「列头字」与「当前数据里最宽的格子字」，加上内边距。
// 为什么用 measureText 不用 DOM：行在虚拟滚动里，没画出来的行量不到，而且不能为量宽度插隐藏元素。

/** 适应后最宽 480px，免得一个长备注把表撑出屏。 */
export const FIT_MAX_WIDTH = 480
/** 只量前 1000 行：行再多宽度也由头部几百行决定，量全表会卡。 */
export const FIT_MAX_ROWS = 1000
/** 左右内边距各 8px（.k-grid-cell / .k-grid-col button 的 padding）。 */
const PADDING = 16
/** 表头排序箭头占的位置：gap 4 + 箭头字形约 10；一律预留，排序后列不会再被截。 */
const SORT_ARROW = 14
/** 格子里品种徽标 16px + gap 6；代码与场所标签之间 gap 6。 */
const ICON = 22
const GAP = 6
/** 量到的宽度是估计值（系统字体），多留 2px 免得末位被省略号吃掉。 */
const SLACK = 2

/**
 * 格子用 tabular-nums（等宽数字），canvas 量字不认 font-variant-numeric，量出来的数字偏窄（时间列差十来像素）；
 * 把每个数字换成这个字体里最宽的那个数字再量，等宽数字的宽度就是它。
 */
const widestDigit = new Map<string, string>()
function tabular(text: string, font: string): string {
  if (!/\d/.test(text)) return text
  let digit = widestDigit.get(font)
  if (digit === undefined) {
    digit = '0'
    for (const candidate of '123456789') if (measureText(candidate, font) > measureText(digit, font)) digit = candidate
    widestDigit.set(font, digit)
  }
  return text.replace(/\d/g, digit)
}

/** 列头与格子的字体串（已由 fontFor 按 CSS 拼好）。 */
export type FitFonts = { head: string; sub: string; cell: string; tag: string }

/** custom 列（cell / render 画的内容）拿不到文字，不能适应。 */
export const isFittable = <Row>(column: GridColumn<Row>): boolean =>
  column.type !== 'custom' && column.cell === undefined && column.render === undefined

type FitInput<Row> = {
  column: GridColumn<Row>
  label: string
  sub?: string
  rows: readonly Row[]
  env: CellEnv
  fonts: FitFonts
  /** 表头里有排序按钮时给 true，预留箭头。 */
  sortable: boolean
  minWidth: number
}

/** 一列适应内容后的宽度（整数像素）；custom 列返回 undefined（不改宽）。 */
export function fitColumnWidth<Row>({
  column,
  label,
  sub,
  rows,
  env,
  fonts,
  sortable,
  minWidth,
}: FitInput<Row>): number | undefined {
  if (!isFittable(column)) return undefined
  let widest =
    Math.max(measureText(label, fonts.head), sub ? measureText(sub, fonts.sub) : 0) +
    PADDING +
    (sortable ? SORT_ARROW : 0)
  const count = Math.min(rows.length, FIT_MAX_ROWS)
  for (let at = 0; at < count; at++) {
    const resolved = resolveCell(column, rows[at], env)
    const content = resolved.symbol
      ? measureText(tabular(resolved.symbol.code, fonts.cell), fonts.cell) +
        (resolved.symbol.venue ? GAP + measureText(resolved.symbol.venue, fonts.tag) : 0) +
        (resolved.symbol.icon ? ICON : 0)
      : measureText(tabular(resolved.text, fonts.cell), fonts.cell)
    widest = Math.max(widest, content + PADDING)
  }
  return Math.min(FIT_MAX_WIDTH, Math.max(minWidth, Math.ceil(widest + SLACK)))
}
