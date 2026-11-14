// SPDX-License-Identifier: MIT
// @katana-ui/react 的出口：应用只从这里引（dependency-cruiser 的 ui-only-via-entry）。样式走 `@katana-ui/react/tokens.css` 与 `@katana-ui/react/ui.css`，
// 动效参数走 `@katana-ui/react/motion`。

export { cn } from './lib/cn.ts'
export { focusRing, focusRingInset } from './lib/focus.ts'
export { useHoverOpen } from './lib/hover-open.ts'
export { InlineOverlays } from './lib/overlay.tsx'

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './primitives/accordion.tsx'
export { Alert, AlertDescription, AlertTitle, alertVariants } from './primitives/alert.tsx'
export { Button, buttonVariants } from './primitives/button.tsx'
export { Checkbox } from './primitives/checkbox.tsx'
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './primitives/command.tsx'
export { menuContainerClass, menuRowClass, menuSeparatorClass } from './primitives/menu-parts.tsx'
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './primitives/context-menu.tsx'
export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './primitives/dialog.tsx'
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './primitives/dropdown-menu.tsx'
export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  useFieldControl,
} from './primitives/field.tsx'
export { HoverCard, HoverCardContent, HoverCardTrigger } from './primitives/hover-card.tsx'
export { Label } from './primitives/label.tsx'
export { useMenuParts } from './primitives/menu-any.tsx'
export { MenuCheckColumn, MenuItemHint, MenuItemIcon, MenuItemLabel } from './primitives/menu-parts.tsx'
export {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './primitives/popover.tsx'
export { Input, inputVariants } from './primitives/input.tsx'
export { Progress } from './primitives/progress.tsx'
export { ScrollArea, ScrollBar } from './primitives/scroll-area.tsx'
export { Separator } from './primitives/separator.tsx'
export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  sheetVariants,
} from './primitives/sheet.tsx'
export {
  Select,
  SelectArrow,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectItemClass,
  selectTriggerVariants,
} from './primitives/select.tsx'
export { Slider } from './primitives/slider.tsx'
export { Switch } from './primitives/switch.tsx'
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from './primitives/tabs.tsx'
export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleItemVariants } from './primitives/toggle-group.tsx'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, tooltipContentClass } from './primitives/tooltip.tsx'
export { MultiSelect } from './patterns/multi-select.tsx'
export { ChipGroup, type ChipGroupProps, type ChipItem } from './patterns/chip-group.tsx'
export { DateRangePicker, type DateRangeLabels, type DateRangePickerProps } from './patterns/date-range-picker.tsx'
export type { DateRange, RangePreset, WeekStart } from './patterns/date-range-model.ts'
export { TreeView, type TreeNode, type TreeViewProps } from './patterns/tree-view.tsx'
export { QuoteTable, type QuoteGroup, type QuoteRow, type QuoteTableProps } from './patterns/quote-table.tsx'
export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from './patterns/combobox.tsx'

// KATANA 自有件（#1860 从 src/ui 搬来）：读数、状态灯、点阵、快捷键方块、徽标、滚动数字、数字框、日期时间框、加载骨架。
export { DotMatrix, DOT_PITCH, DOT_SIZE } from './katana/dot-matrix.tsx'
export { ARCADE_SPRITES, ArcadePixel, type ArcadePixelAnimate, type ArcadePixelProps } from './katana/arcade-pixel.tsx'
export { Lcd, type LcdTone } from './katana/lcd.tsx'
export { Led, LINK_GROUPS, type LedState, type LinkGroup } from './katana/led.tsx'
export { Kbd } from './katana/kbd.tsx'
export {
  ShortcutRecorder,
  type ShortcutRecorderLabels,
  type ShortcutRecorderProps,
} from './katana/shortcut-recorder.tsx'
export { SymbolMark, symbolMarkLetters, type SymbolMarkProps } from './katana/symbol-mark.tsx'
export { BadgeGroup, type BadgeItem } from './katana/badge.tsx'
export { RollingText, rollSlots, rollStrip } from './katana/rolling-text.tsx'
export { NumberInput } from './katana/number-input.tsx'
export { DateTimeInput, type DateTimeLabels } from './katana/date-time-input.tsx'
export { Skeleton } from './katana/skeleton.tsx'
export {
  TOAST_EXIT_MS,
  Toast,
  ToastClear,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
  type ToastPhase,
  type ToastPosition,
} from './katana/toast.tsx'
export { Loading, LoadingBoundary } from './katana/loading.tsx'
export { LoadingView, type LoadingTexts } from './katana/loading-view.tsx'
export type { LoadingPhase } from './katana/loading-gate.ts'

// 学自 rare-ui 的交互、本仓库重写的件（#1861）：密钥输入、原地确认的危险按钮、带未读数的铃、状态图标、行内 AI 状态、点阵状态球。
export { PasswordInput, type PasswordInputProps } from './katana/password-input.tsx'
export { DeleteButton, type DeleteButtonProps } from './katana/delete-button.tsx'
export { HoldToConfirm, type HoldToConfirmProps } from './katana/hold-to-confirm.tsx'
export { NotificationBell, type NotificationBellProps } from './katana/notification-bell.tsx'
export { StatusIcon, type StatusIconStatus } from './katana/status-icon.tsx'
export { AiStatus, type AiStatusProps, type AiStatusState } from './katana/ai-status.tsx'
export { MatrixOrb, type MatrixOrbProps } from './katana/matrix-orb.tsx'
export type { OrbState } from './katana/matrix-orb-model.ts'

// 第二批（#1861）：里程表式数字滚动（升级 RollingText，见上）、分步进度条、主题选择、代码块、联网检索来源、任务清单、时长选择。
export { StepPlayer, type StepPlayerLabels, type StepPlayerProps, type StepPlayerStep } from './katana/step-player.tsx'
export {
  ThemeSelector,
  type ThemeOption,
  type ThemePalette,
  type ThemeSelectorProps,
} from './katana/theme-selector.tsx'
export { CodeBlock, type CodeBlockProps } from './katana/code-block.tsx'
export { JsonViewer, type JsonViewerLabels, type JsonViewerProps } from './katana/json-viewer.tsx'
export {
  WebSearch,
  WebSearchCitation,
  type WebSearchProps,
  type WebSearchCitationProps,
  type WebSearchStatus,
  type WebSource,
} from './katana/web-search.tsx'
export { TaskList, type Task, type TaskListLabels, type TaskListProps } from './katana/task-list.tsx'
export {
  DurationPicker,
  type DurationPickerLabels,
  type DurationPickerProps,
  type DurationValue,
} from './katana/duration-picker.tsx'
export { useHoverIntent } from './lib/hover-intent.ts'
export { useScrubber, type UseScrubberOptions } from './lib/use-scrubber.ts'

// 报价与行情类的件（#1884）：迷你图、进度条、矩形树图（后三件从应用的分析视图提来）；行内价格标签、报价卡与一排、区间条、评级仪表是新做的。
// 功能参照 TradingView 小组件，只取「给用户看什么、怎么交互」，不嵌、不抄（用户 2026-11-14 定：我们做自己的）。分组页签行情表在 patterns/。
export { Sparkline, sparkPoints, sparkTone, type SparklineProps } from './katana/sparkline.tsx'
export { GaugeBar, type GaugeBarClasses, type GaugeBarProps } from './katana/gauge-bar.tsx'
export { Treemap, type TreemapClasses, type TreemapProps } from './katana/treemap.tsx'
export {
  colorStep,
  layoutTreemap,
  TREEMAP_H,
  TREEMAP_W,
  type TreemapBlock,
  type TreemapCell,
  type TreemapItem,
} from './katana/treemap-model.ts'
export { PriceTag, type PriceTagProps } from './katana/price-tag.tsx'
export { QuoteCard, QuoteStrip, type QuoteCardProps, type QuoteStripProps } from './katana/quote-card.tsx'
export { RangeBar, rangeShare, type RangeBarProps } from './katana/range-bar.tsx'
export { RatingGauge, type RatingGaugeProps } from './katana/rating-gauge.tsx'
export { ratingAngle, ratingZone } from './katana/rating-gauge-model.ts'
export { quoteTone, type QuoteTone } from './katana/quote-tone.ts'

// 分布与关系类的件（#1918）：功能参照 Arc（uiarc.dev，2026-11-14 读），实现原创。
export { UptimeBars, type UptimeBarsProps } from './quant/uptime-bars.tsx'
export { uptimeShare, type UptimeCell, type UptimeStatus } from './quant/uptime-bars-model.ts'
export { RangeHistogramSlider, type RangeHistogramSliderProps } from './patterns/range-histogram-slider.tsx'
export { histogramBins } from './patterns/range-histogram-model.ts'
