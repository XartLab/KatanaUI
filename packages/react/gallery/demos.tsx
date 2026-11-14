// SPDX-License-Identifier: MIT
import type { ComponentType } from 'react'
import { DateTimeInputDemo, NumberInputDemo, SkeletonDemo } from './pages/fields'
import { BadgeDemo, DotMatrixDemo, KbdDemo, LcdDemo, LedDemo, RollingTextDemo } from './pages/readouts'
import { ContextMenuOpen, DialogOpen, DropdownMenuOpen, PopoverOpen, SelectOpen, TooltipOpen } from './pages/open'
import { ChangeTextDemo, PnlTextDemo, QuantFormatDemo } from './pages/quant'
import { DataGridDemo, EmptyStateDemo, EstimateBadgeDemo, ToolbarDemo } from './pages/blocks'
import { AlertDemo, ProgressDemo, ToastDemo } from './pages/feedback'
import { ComboboxDemo, CommandDemo } from './pages/pickers'
import { HoldToConfirmDemo } from './pages/arc-controls'
import { FieldDemo, HoverCardDemo, ScrollAreaDemo, SeparatorDemo, SheetDemo } from './pages/structure'
import {
  AiStatusDemo,
  ArcadePixelDemo,
  DeleteButtonDemo,
  MatrixOrbDemo,
  NotificationBellDemo,
  PasswordInputDemo,
  StatusIconDemo,
} from './pages/rare'
import {
  CodeBlockDemo,
  DurationPickerDemo,
  StepPlayerDemo,
  TaskListDemo,
  ThemeSelectorDemo,
  WebSearchDemo,
} from './pages/rare2'
import {
  GaugeBarDemo,
  PriceTagDemo,
  QuoteCardDemo,
  QuoteTableDemo,
  RangeBarDemo,
  RatingGaugeDemo,
  SparklineDemo,
  TreemapDemo,
} from './pages/quotes'
import { AccordionDemo, TabsDemo } from './pages/layout'
import { ContextMenuDemo, DialogDemo, DropdownMenuDemo, PopoverDemo, TooltipDemo } from './pages/overlays'
import {
  ButtonDemo,
  CheckboxDemo,
  InputDemo,
  MultiSelectDemo,
  SelectDemo,
  SliderDemo,
  SwitchDemo,
  ToggleGroupDemo,
} from './pages/forms'

/** 每一页的实时预览，键是 registry.ts 里的页 id（registry.test.ts 核对两边一一对应）。 */
export const DEMOS: Readonly<Record<string, ComponentType>> = {
  button: ButtonDemo,
  input: InputDemo,
  select: SelectDemo,
  'multi-select': MultiSelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  'toggle-group': ToggleGroupDemo,
  slider: SliderDemo,
  tooltip: TooltipDemo,
  popover: PopoverDemo,
  dialog: DialogDemo,
  'dropdown-menu': DropdownMenuDemo,
  'context-menu': ContextMenuDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  led: LedDemo,
  lcd: LcdDemo,
  'dot-matrix': DotMatrixDemo,
  'rolling-text': RollingTextDemo,
  badge: BadgeDemo,
  kbd: KbdDemo,
  'number-input': NumberInputDemo,
  'date-time-input': DateTimeInputDemo,
  skeleton: SkeletonDemo,
  toast: ToastDemo,
  alert: AlertDemo,
  progress: ProgressDemo,
  sheet: SheetDemo,
  'hover-card': HoverCardDemo,
  command: CommandDemo,
  combobox: ComboboxDemo,
  separator: SeparatorDemo,
  'scroll-area': ScrollAreaDemo,
  field: FieldDemo,
  'change-text': ChangeTextDemo,
  'pnl-text': PnlTextDemo,
  'quant-format': QuantFormatDemo,
  'data-grid': DataGridDemo,
  'empty-state': EmptyStateDemo,
  toolbar: ToolbarDemo,
  'estimate-badge': EstimateBadgeDemo,
  'password-input': PasswordInputDemo,
  'hold-to-confirm': HoldToConfirmDemo,
  'delete-button': DeleteButtonDemo,
  'notification-bell': NotificationBellDemo,
  'status-icon': StatusIconDemo,
  'ai-status': AiStatusDemo,
  'matrix-orb': MatrixOrbDemo,
  'arcade-pixel': ArcadePixelDemo,
  'step-player': StepPlayerDemo,
  'theme-selector': ThemeSelectorDemo,
  'code-block': CodeBlockDemo,
  'web-search': WebSearchDemo,
  'task-list': TaskListDemo,
  'duration-picker': DurationPickerDemo,
  sparkline: SparklineDemo,
  'gauge-bar': GaugeBarDemo,
  treemap: TreemapDemo,
  'price-tag': PriceTagDemo,
  'quote-card': QuoteCardDemo,
  'range-bar': RangeBarDemo,
  'rating-gauge': RatingGaugeDemo,
  'quote-table': QuoteTableDemo,
}

/**
 * 浮层类页的「打开的样子」（设计系统包的预览在页上的预览后面再摆一份）：Radix 的 open 加不进 Portal，高度是摆出来后在浏览器里量的（卡片里留给打开内容的高度）。
 * 页上的实时预览是触发器，打开靠点它；这里只给静态渲染用，所以不在 DEMOS 里（registry.test 的预览对账不看它）。
 */
export const OPEN_DEMOS: Readonly<Record<string, { Demo: ComponentType; height: number }>> = {
  tooltip: { Demo: TooltipOpen, height: 80 },
  popover: { Demo: PopoverOpen, height: 160 },
  dialog: { Demo: DialogOpen, height: 260 },
  'dropdown-menu': { Demo: DropdownMenuOpen, height: 240 },
  'context-menu': { Demo: ContextMenuOpen, height: 220 },
  select: { Demo: SelectOpen, height: 160 },
}
