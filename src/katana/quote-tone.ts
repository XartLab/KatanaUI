// SPDX-License-Identifier: MIT
// 涨跌三态：报价类的件（迷你图、价格标签、报价卡、区间条、行情表）共用。颜色走 token 的 --pnl-up / --pnl-down（两个主题、两种涨跌配色都跟着换），
// 形状上再加一个三角（涨 ▲、跌 ▼），不靠颜色单独表达。

export type QuoteTone = 'up' | 'down' | 'flat'

/** 由一个涨跌数取三态；没有数或不是有限数当作持平。 */
export const quoteTone = (change: number | null | undefined): QuoteTone =>
  typeof change === 'number' && Number.isFinite(change) ? (change > 0 ? 'up' : change < 0 ? 'down' : 'flat') : 'flat'

/** 涨跌旁的三角（读屏不读，涨跌方向由文字里的符号与调用方的 label 表达）。 */
export const TONE_GLYPH: Record<QuoteTone, string> = { up: '▲', down: '▼', flat: '' }
