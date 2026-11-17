// SPDX-License-Identifier: MIT
// 文档站目录的图标（用户 2026-11-17：「要有图标 logo 等东西」「大分组有，小分组没 logo」）：只给大分组配图标，条目不带。
// 图标用包里已有的 lucide-react（ISC）。logo 是 KatanaUI 自己画的标：方框里一道斜刃。

import {
  Coins,
  Puzzle,
  Rocket,
  Blocks,
  BookOpen,
  ChartCandlestick,
  Compass,
  Gauge,
  Layers,
  LayoutGrid,
  MessageSquare,
  Palette,
  PanelsTopLeft,
  Ruler,
  Sigma,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react'

export const GROUP_ICONS: Record<string, LucideIcon> = {
  start: Rocket,
  foundations: Palette,
  tokens: Coins,
  patterns: Puzzle,
  forms: TextCursorInput,
  overlays: Layers,
  layout: PanelsTopLeft,
  readouts: Gauge,
  feedback: MessageSquare,
  quotes: ChartCandlestick,
  quant: Sigma,
  blocks: Blocks,
  library: BookOpen,
  design: Ruler,
  cards: LayoutGrid,
  overview: Compass,
}

/** KatanaUI 的标：圆角方框里一道斜刃，刃口用品牌橙。 */
export function KatanaMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="17" height="17" rx="4.5" fill="var(--bg-300)" stroke="var(--line-200)" />
      <path d="M5.5 14.5 14.5 5.5" stroke="var(--ink-100)" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M11.8 5.5h2.7v2.7"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.5 11.2 8.8 14.5" stroke="var(--ink-300)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
