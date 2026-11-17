// SPDX-License-Identifier: MIT
// 文档站目录的图标（用户 2026-11-17：「要有图标 logo 等东西」）：每组一个组图标；组件按名字里的关键词挑图标，挑不到用组图标。
// 图标用包里已有的 lucide-react（ISC）。logo 是 KatanaUI 自己画的标：方框里一道斜刃。

import {
  Activity,
  Blocks,
  BookOpen,
  Bot,
  Calendar,
  ChartBar,
  ChartCandlestick,
  ChartLine,
  ChartScatter,
  ChevronsUpDown,
  CircleGauge,
  Clock,
  Columns3,
  Command,
  Compass,
  Database,
  FileText,
  Filter,
  FolderTree,
  Gauge,
  Grid3x3,
  Hash,
  Keyboard,
  Layers,
  LayoutGrid,
  ListChecks,
  ListOrdered,
  Loader,
  Menu,
  MessageSquare,
  MousePointerClick,
  Network,
  Newspaper,
  Palette,
  PanelsTopLeft,
  Radius,
  Ruler,
  Search,
  ShieldAlert,
  Sigma,
  SlidersHorizontal,
  Space,
  Sparkles,
  Square,
  SunMedium,
  Table,
  Tag,
  Terminal,
  TextCursorInput,
  ToggleLeft,
  TrendingUp,
  Type,
  Waves,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export const GROUP_ICONS: Record<string, LucideIcon> = {
  foundations: Palette,
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

export const FOUNDATION_ICONS: Record<string, LucideIcon> = {
  foundations: Layers,
  color: Palette,
  typography: Type,
  spacing: Space,
  radius: Radius,
  shadow: SunMedium,
  border: Square,
  density: Columns3,
  characteristics: Tag,
}

/** 按名字里的关键词挑图标，前面的规则优先。 */
const RULES: readonly [RegExp, LucideIcon][] = [
  [/heatmap|treemap|galaxy|matrix|dot-matrix|grid-3/i, Grid3x3],
  [/calendar|date/i, Calendar],
  [/news/i, Newspaper],
  [/scatter|slope|connected/i, ChartScatter],
  [/bar|histogram|ridgeline|quantile|attribution|horizon|ladder|sankey|flow/i, ChartBar],
  [/curve|series|spark|brush|line|vintage|equity|chart|regime/i, ChartLine],
  [/gauge|meter|rating|lcd|led|consensus/i, CircleGauge],
  [/table|grid|watchlist|list|ledger|queue/i, Table],
  [/filter|chip|view-switcher|column-set/i, Filter],
  [/search|combobox|command/i, Search],
  [/select|dropdown|menu|context/i, ChevronsUpDown],
  [/switch|toggle|checkbox/i, ToggleLeft],
  [/slider|range|duration|number|decimal|scrubber/i, SlidersHorizontal],
  [/shortcut|kbd|keyboard/i, Keyboard],
  [/button|hold|delete|row-actions/i, MousePointerClick],
  [/input|field|password|text/i, TextCursorInput],
  [/time|clock|step-player|timeline|rolling/i, Clock],
  [/tree|accordion/i, FolderTree],
  [/tabs|workspace|panel|splitter|sheet|status-bar|toolbar|side-nav|separator|scroll/i, PanelsTopLeft],
  [/dialog|popover|tooltip|hover-card|overlay/i, Layers],
  [/toast|alert|bell|notification|empty|progress|skeleton/i, MessageSquare],
  [/loading|loader/i, Loader],
  [/ai|orb|web-search|prompt/i, Sparkles],
  [/system-monitor|uptime|monitor/i, Activity],
  [/decision|hypothesis|transmission|strategy/i, Workflow],
  [/code|json/i, Terminal],
  [/quote|price|change|pnl|performance|key-stats|peer|symbol|tone/i, TrendingUp],
  [/badge|tag|estimate/i, Tag],
  [/format|quant-format/i, Hash],
  [/theme|rendering/i, Palette],
  [/task/i, ListChecks],
  [/arcade|pixel/i, Bot],
  [/network|graph/i, Network],
  [/data/i, Database],
  [/order|rank/i, ListOrdered],
  [/menu/i, Menu],
  [/command/i, Command],
  [/risk|alert/i, ShieldAlert],
  [/doc|readme|spec/i, FileText],
  [/wave/i, Waves],
]

export function iconFor(id: string, group: string): LucideIcon {
  return RULES.find(([pattern]) => pattern.test(id))?.[1] ?? GROUP_ICONS[group] ?? Square
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
