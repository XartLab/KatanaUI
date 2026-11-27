// SPDX-License-Identifier: MIT
// 运行模式徽标：模拟 / 回放 / 前向测试 / 实盘四块牌，样子分明，不混。
// 为什么四种形状都不同而不只是换色：fixture、模拟、回放、实盘不能被看成一个模式（KATANAview 底线），
// 色盲或截图灰度时也要分得出——每种带自己的图形（虚线框、倒带、前进箭头、实心脉动点），实盘是实心底加粗字，最醒目。
// 文字由调用方传，包里没有语言。
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'

export type RunMode = 'paper' | 'replay' | 'forward' | 'live'

export const RUN_MODES: readonly RunMode[] = ['paper', 'replay', 'forward', 'live']

export type RunModeBadgeProps = {
  /**
   * Which mode to show: paper, replay, forward or live.
   * 现在是哪种模式。
   */
  mode: RunMode
  /**
   * One word per mode, written by the caller (for example Paper, Replay, Forward, Live).
   * 四种模式各一个词，如「模拟」「回放」「前向测试」「实盘」。
   */
  labels: Readonly<Record<RunMode, string>>
  /**
   * A short extra text after the word, such as the replay date.
   * 牌上词后面的一小段补充（如回放日期），可省。
   */
  detail?: string
  /** Extra class name on the root. */
  className?: string
}

// 图形各画各的（16 方格，描边用 currentColor）。
const GLYPH: Record<RunMode, ReactNode> = {
  // 虚线方框：假的、练习的。
  paper: <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" strokeDasharray="2 2" />,
  // 双三角倒带。
  replay: <path d="M8.5 4 3 8l5.5 4zM14 4 8.5 8l5.5 4z" />,
  // 向右的箭头加竖线：从这一刻往前走。
  forward: <path d="M3 8h8M8 4.5 11.5 8 8 11.5M13.5 3.5v9" />,
  // 实心圆加外环：正在对真钱发单。
  live: (
    <>
      <circle cx="8" cy="8" r="2.6" fill="currentColor" />
      <circle cx="8" cy="8" r="5.6" />
    </>
  ),
}

export function RunModeBadge({ mode, labels, detail, className }: RunModeBadgeProps) {
  return (
    <span className={cn('k-run-mode', className)} data-slot="run-mode-badge" data-mode={mode}>
      <svg
        className="k-run-mode-glyph"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {GLYPH[mode]}
      </svg>
      <span className="k-run-mode-text">{labels[mode]}</span>
      {detail !== undefined && <span className="k-run-mode-detail">{detail}</span>}
    </span>
  )
}
