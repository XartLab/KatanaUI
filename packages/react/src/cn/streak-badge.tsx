// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { cnLabelsZh, type StreakLabels } from './labels.ts'
import { normalizeStreak, streakLevel, streakText, type StreakValue } from './badge-model.ts'

// 连板徽标（#110）：首板 / 2板 / 5天3板 / 一进二。高度越高越醒目：只靠语义色调升档（data-level 1 到 4），不收色值；涨色跟 data-updown。
// 文字由 labels 给（默认简体中文，可整份换）。取不到写「—」，reason 放悬停。

export type StreakBadgeProps = {
  /**
   * Boards in a row (1 is the first board); a number, or an object with days, yesterday's boards and a reason. Null or missing means unavailable.
   * 连板数：数字，或带天数、昨日板数、原因的对象；空是取不到。
   */
  streak: number | StreakValue | null | undefined
  /**
   * Writes first board, N boards or N days M boards; `promotion` writes the promotion form (one-to-two) when the previous boards are known.
   * 板数写法（首板 / 2板 / 5天3板），或晋级口径（一进二）。
   */
  form?: 'boards' | 'promotion'
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: StreakLabels
  /** Extra class names. */
  className?: string
}

export function StreakBadge({ streak, form = 'boards', labels = cnLabelsZh.streak, className }: StreakBadgeProps) {
  const value = normalizeStreak(streak)
  const level = streakLevel(value.boards)
  const text = streakText(value, labels, form)
  return (
    <span
      className={cn('k-cn-chip k-cn-streak', className)}
      data-slot="streak-badge"
      data-level={level}
      title={value.boards === null ? (value.reason ?? labels.unavailable) : undefined}
    >
      {text}
    </span>
  )
}
