// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { BOARD_LIMIT_PERCENT, boardText } from './badge-model.ts'
import { cnLabelsZh, type BoardKind, type BoardMarkLabels } from './labels.ts'

// 板块标记（#110）：主板 / 创业板 / 科创板 / 北交所 / ST。默认只标有特殊涨跌幅限制的写「20cm」「30cm」「ST」（卡片上够用），主板不画；
// display 选 name 写板块名，both 写「创业板 20cm」。kind 取不到写「—」。

export type BoardMarkProps = {
  /**
   * The board; null or missing means unavailable.
   * 板块；空是取不到。
   */
  kind: BoardKind | null | undefined
  /**
   * Writes the price-limit width (and nothing for the main board), the board name, or both.
   * cm 写涨跌幅限制（主板不画），name 写板块名，both 都写。
   */
  display?: 'cm' | 'name' | 'both'
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: BoardMarkLabels
  /** Extra class names. */
  className?: string
}

export function BoardMark({ kind, display = 'cm', labels = cnLabelsZh.board, className }: BoardMarkProps) {
  if (kind === null || kind === undefined || !(kind in BOARD_LIMIT_PERCENT)) {
    return (
      <span className={cn('k-cn-chip k-cn-board', className)} data-slot="board-mark" title={labels.unavailable}>
        —
      </span>
    )
  }
  const text = boardText(kind, labels, display)
  if (text === '') return null
  const limitText = labels.limit(BOARD_LIMIT_PERCENT[kind])
  return (
    <span
      className={cn('k-cn-chip k-cn-board', className)}
      data-slot="board-mark"
      data-kind={kind}
      title={`${labels.kind[kind]} ${limitText}`}
    >
      {text}
    </span>
  )
}
