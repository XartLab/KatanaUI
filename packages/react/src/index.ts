// SPDX-License-Identifier: MIT
// @katana-ui/react 的出口：应用只从这里引（dependency-cruiser 的 ui-only-via-entry）。样式走 `@katana-ui/react/tokens.css` 与 `@katana-ui/react/ui.css`，
// 动效参数走 `@katana-ui/react/motion`。

export { cn } from './lib/cn.ts'
export { focusRing, focusRingInset } from './lib/focus.ts'
export { useHoverOpen } from './lib/hover-open.ts'
export { InlineOverlays } from './lib/overlay.tsx'

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './primitives/accordion.tsx'
export { Alert, AlertDescription, AlertTitle, alertVariants } from './primitives/alert.tsx'
export { Button, buttonVariants, type ButtonSize } from './primitives/button.tsx'
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
export { Input, inputVariants, type InputSize } from './primitives/input.tsx'
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
export {
  ToggleGroup,
  ToggleGroupItem,
  toggleGroupVariants,
  toggleItemVariants,
  type ToggleGroupSize,
} from './primitives/toggle-group.tsx'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, tooltipContentClass } from './primitives/tooltip.tsx'
export { MultiSelect } from './patterns/multi-select.tsx'
export { ChipGroup, type ChipGroupLabels, type ChipGroupProps, type ChipItem } from './patterns/chip-group.tsx'
export { FilterBar, type FilterBarLabels, type FilterBarProps } from './patterns/filter-bar.tsx'
export {
  DEFAULT_RENDERING,
  RENDERING_LABELS_ZH,
  RenderingSettings,
  applyRendering,
  readRendering,
  type RenderingSettingsLabels,
  type RenderingSettingsProps,
  type RenderingSettingsValue,
} from './patterns/rendering-settings.tsx'
export {
  DEFAULT_FONTS,
  FONT_CATALOG,
  fontVariables,
  fontsFor,
  type FontChoice,
  type FontKind,
  type FontOption,
  type FontRole,
} from './patterns/font-catalog.ts'
export { SideNav, type SideNavGroup, type SideNavItem, type SideNavProps } from './patterns/side-nav.tsx'
export {
  fitsWidth,
  fontFor,
  measureText,
  resetTextMeasure,
  textHeight,
  truncateText,
  wrapText,
} from './lib/text-measure.ts'
export {
  LIVE_ENTER_MS,
  LIVE_FLASH_GAP_MS,
  LIVE_FLASH_MS,
  LIVE_REORDER_MS,
  useEnterMarks,
  useFlipList,
  useStatusFlash,
  useValueFlash,
  type FlashDirection,
  type ValueFlash,
} from './lib/live.ts'
export {
  ViewSwitcher,
  type ViewOption,
  type ViewSwitcherLabels,
  type ViewSwitcherProps,
} from './patterns/view-switcher.tsx'
export {
  applyFilters,
  conditionText,
  matchCondition,
  type FilterCondition,
  type FilterField,
  type FilterOperator,
  type FilterPreset,
} from './patterns/filter-bar-model.ts'
export { DateRangePicker, type DateRangeLabels, type DateRangePickerProps } from './patterns/date-range-picker.tsx'
export type { DateRange, RangePreset, WeekStart } from './patterns/date-range-model.ts'
export { TreeView, type TreeNode, type TreeViewProps } from './patterns/tree-view.tsx'
export {
  RowActionMenuItems,
  RowActions,
  RowContextMenu,
  symbolMenu,
  type RowAction,
  type RowActionsProps,
  type RowContextMenuProps,
  type SymbolMenuInput,
} from './patterns/row-actions.tsx'
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
// 状态语气（G0 定义在 lib/severity.ts，G3 起 Led、StatusIcon、Toast、Tag、Lcd 的 tone 用它）：只导出类型。
export type { Severity, SeverityExt } from './lib/severity.ts'
export { Tag, type TagProps, type TagSize } from './katana/tag.tsx'
export { Kbd } from './katana/kbd.tsx'
export {
  ShortcutRecorder,
  type ShortcutRecorderLabels,
  type ShortcutRecorderProps,
} from './patterns/shortcut-recorder.tsx'
export { SymbolMark, symbolMarkLetters, type SymbolMarkProps } from './katana/symbol-mark.tsx'
export { BadgeGroup, type BadgeItem } from './katana/badge.tsx'
export { RollingText, rollSlots, rollStrip } from './katana/rolling-text.tsx'
export { Scrubber, scrubSnap, scrubValueAt, type ScrubberProps } from './katana/scrubber.tsx'
export { NumberInput, type NumberInputProps } from './patterns/number-input.tsx'
export { DateTimeInput, type DateTimeInputProps, type DateTimeLabels } from './patterns/date-time-input.tsx'
export { Skeleton } from './katana/skeleton.tsx'
export {
  MeasuredSkeleton,
  type MeasuredSkeletonDataProps,
  type MeasuredSkeletonPlainProps,
  type MeasuredSkeletonProps,
} from './katana/measured-skeleton.tsx'
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
// 加载态的唯一入口是 Loading（G3）：LoadingBoundary（= 不给 pending）与 LoadingView（= 给 phase）留一个版本作兼容。
export { Loading, LoadingBoundary, type LoadingProps } from './katana/loading.tsx'
export { LoadingView, type LoadingLabels, type LoadingTexts } from './katana/loading-view.tsx'
export { LOADING_TIMEOUT_MS, type LoadingPhase } from './katana/loading-gate.ts'

// 学自 rare-ui 的交互、本仓库重写的件（#1861）：密钥输入、原地确认的危险按钮、带未读数的铃、状态图标、行内 AI 状态、点阵状态球。
export { PasswordInput, type PasswordInputLabels, type PasswordInputProps } from './patterns/password-input.tsx'
export { DeleteButton, type DeleteButtonLabels, type DeleteButtonProps } from './patterns/delete-button.tsx'
export { HoldToConfirm, type HoldToConfirmLabels, type HoldToConfirmProps } from './patterns/hold-to-confirm.tsx'
export { NotificationBell, type NotificationBellProps } from './katana/notification-bell.tsx'
export { StatusIcon, type StatusIconStatus, type StatusIconTone } from './katana/status-icon.tsx'
export { AiStatus, type AiStatusProps, type AiStatusState, type AiStatusValue } from './katana/ai-status.tsx'
export { MatrixOrb, type MatrixOrbProps } from './katana/matrix-orb.tsx'
export type { OrbState } from './katana/matrix-orb-model.ts'

// 第二批（#1861）：里程表式数字滚动（升级 RollingText，见上）、分步进度条、主题选择、代码块、联网检索来源、任务清单、时长选择。
export {
  StepPlayer,
  type StepPlayerLabels,
  type StepPlayerProps,
  type StepPlayerSize,
  type StepPlayerStep,
} from './katana/step-player.tsx'
export {
  ThemeSelector,
  type ThemeOption,
  type ThemePalette,
  type ThemeSelectorProps,
} from './patterns/theme-selector.tsx'
export { CodeBlock, type CodeBlockLabels, type CodeBlockProps } from './katana/code-block.tsx'
export { JsonViewer, type JsonViewerLabels, type JsonViewerProps } from './katana/json-viewer.tsx'
export {
  WebSearch,
  WebSearchCitation,
  type WebSearchProps,
  type WebSearchCitationProps,
  type WebSearchLabels,
  type WebSearchStatus,
  type WebSource,
} from './katana/web-search.tsx'
export { TaskList, type Task, type TaskListLabels, type TaskListProps } from './patterns/task-list.tsx'
export {
  DurationPicker,
  type DurationPickerLabels,
  type DurationPickerProps,
  type DurationValue,
} from './patterns/duration-picker.tsx'
export { useHoverIntent } from './lib/hover-intent.ts'
export { useScrubber, type UseScrubberOptions } from './lib/use-scrubber.ts'
export {
  usePersistedState,
  readPersisted,
  type PersistedStateOptions,
  type StorageLike,
} from './lib/use-persisted-state.ts'
export { useSavedViews, type SavedView, type UseSavedViewsOptions } from './lib/use-saved-views.ts'

// 分割线（#1901）：一条 role=separator 的线，键盘、拖动、吸附、双击复位；工作区的格子分割线用它。
export { Splitter, type SplitterProps } from './primitives/splitter.tsx'
export { clampSplitRatio, DEFAULT_SNAP_POINTS, snapSplitRatio, splitKeyRatio } from './primitives/splitter-model.ts'

// 报价与行情类的件（#1884）：迷你图、进度条、矩形树图（后三件从应用的分析视图提来）；行内价格标签、报价卡与一排、区间条、评级仪表是新做的。
// 功能参照 TradingView 小组件，只取「给用户看什么、怎么交互」，不嵌、不抄（用户 2026-11-14 定：我们做自己的）。分组页签行情表在 patterns/。
export {
  Sparkline,
  sparkPoints,
  sparkTone,
  type SparkAxis,
  type SparklineProps,
  type SparklineVariant,
} from './katana/sparkline.tsx'
export { MiniChart, type MiniChartProps } from './katana/mini-chart.tsx'
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
  type TreemapLayoutOptions,
} from './katana/treemap-model.ts'
export { PriceTag, type PriceTagProps } from './katana/price-tag.tsx'
export { QuoteCard, QuoteStrip, type QuoteCardProps, type QuoteStripProps } from './katana/quote-card.tsx'
export {
  CompareBar,
  RangeBar,
  rangeShare,
  type CompareBarProps,
  type CompareBarSide,
  type RangeBarProps,
} from './katana/range-bar.tsx'
export { RatingGauge, type RatingGaugeProps } from './katana/rating-gauge.tsx'
export { ratingAngle, ratingZone } from './katana/rating-gauge-model.ts'
export { quoteTone, type QuoteTone } from './katana/quote-tone.ts'

// 分布与关系类的件（#1918）：功能参照 Arc（uiarc.dev，2026-11-14 读），实现原创。
export { UptimeBars, type UptimeBarsProps } from './quant/uptime-bars.tsx'
export { uptimeShare, type UptimeCell, type UptimeStatus } from './quant/uptime-bars-model.ts'
export {
  RangeHistogramSlider,
  type RangeHistogramSliderLabels,
  type RangeHistogramSliderProps,
} from './patterns/range-histogram-slider.tsx'
export { histogramBins } from './patterns/range-histogram-model.ts'

// 文字动效（改自 SmoothUI，MIT；各文件头写明出处与归并关系）。
export {
  TEXT_REVEAL_EASES,
  TEXT_REVEAL_PRESETS,
  TextReveal,
  type TextRevealBy,
  type TextRevealEase,
  type TextRevealFrom,
  type TextRevealOrder,
  type TextRevealPreset,
  type TextRevealProps,
} from './motion/text/text-reveal.tsx'
export { TextSwap, type TextSwapProps, type TextSwapVariant } from './motion/text/text-swap.tsx'
export { WordBuild, type WordBuildFrom, type WordBuildProps } from './motion/text/word-build.tsx'
export { TypewriterText, type TypewriterTextProps } from './motion/text/typewriter-text.tsx'
export {
  ScrambleText,
  scrambleFrame,
  type ScrambleSettle,
  type ScrambleTextProps,
  type ScrambleTrigger,
} from './motion/text/scramble-text.tsx'
export {
  TextMorph,
  morphTokens,
  type TextMorphAlign,
  type TextMorphMode,
  type TextMorphProps,
  type TextMorphTag,
} from './motion/text/text-morph.tsx'
export { ShineText, type ShineTextProps } from './motion/text/shine-text.tsx'
export { WaveText, type WaveTextProps } from './motion/text/wave-text.tsx'
export { ScrollRevealParagraph, type ScrollRevealParagraphProps } from './motion/text/scroll-reveal-paragraph.tsx'
export {
  KineticTypeScroll,
  type KineticTypeScrollAlign,
  type KineticTypeScrollProps,
  type ScrollOffsetTuple,
} from './motion/text/kinetic-type-scroll.tsx'
export {
  PerspectiveText3D,
  splitDepthSegments,
  type PerspectiveText3DProps,
  type PerspectiveTextDriver,
  type PerspectiveTextSplit,
} from './motion/text/perspective-text-3d.tsx'
export { GravityLetters, type GravityLettersProps, type GravityLettersTrigger } from './motion/text/gravity-letters.tsx'
export {
  RansomNote,
  createSeededRandom,
  ransomScraps,
  type RansomNoteAnimate,
  type RansomNoteProps,
} from './motion/text/ransom-note.tsx'

// 表单与输入补件（改自 SmoothUI，MIT）：多行文本、单选、单个开关按钮、勾选组、输入框附件组、一次性验证码、动效开关与变形图标。
export { Textarea } from './primitives/textarea.tsx'
export { RadioGroup, RadioGroupItem } from './primitives/radio-group.tsx'
export { Toggle } from './primitives/toggle.tsx'
export { CheckboxGroup, CheckboxGroupItem } from './primitives/checkbox-group.tsx'
export { InputGroup, InputGroupAddon, InputGroupText } from './primitives/input-group.tsx'
export { OtpField } from './primitives/otp-field.tsx'
export { MorphToggle } from './primitives/morph-toggle.tsx'
export { MorphIcon, MORPH_ICON_VARIANTS, type MorphIconVariant } from './motion/icon/morph-icon.tsx'
// AI 对话类件（src/ai/，多数改自 SmoothUI，MIT）：推理、工具调用、diff、审批、对话、输入框、计划、分支。
export type { AiState } from './ai/ai-core.ts'
export { AiReasoning, type AiReasoningLabels, type AiReasoningProps } from './ai/ai-reasoning.tsx'
export { AiToolCall, type AiToolCallLabels, type AiToolCallProps, type AiToolCallStatus } from './ai/ai-tool-call.tsx'
export { AiDiff, type AiDiffLabels, type AiDiffLine, type AiDiffLineKind, type AiDiffProps } from './ai/ai-diff.tsx'
export { AiApproval, type AiApprovalFact, type AiApprovalOption, type AiApprovalProps } from './ai/ai-approval.tsx'
export { AiContextMeter, type AiContextBreakdownItem, type AiContextMeterProps } from './ai/ai-context-meter.tsx'
export { AiMessage, type AiMessageAuthor, type AiMessageLabels, type AiMessageProps } from './ai/ai-message.tsx'
export { AiResponse, type AiResponseCitation, type AiResponseProps } from './ai/ai-response.tsx'
export { AiConversation, type AiConversationProps } from './ai/ai-conversation.tsx'
export {
  AiPromptInput,
  type AiPromptAttachment,
  type AiPromptInputLabels,
  type AiPromptInputProps,
} from './ai/ai-prompt-input.tsx'
export { AiSuggestions, type AiSuggestion, type AiSuggestionsProps } from './ai/ai-suggestions.tsx'
export { AiArtifact, type AiArtifactLabels, type AiArtifactPane, type AiArtifactProps } from './ai/ai-artifact.tsx'
export {
  AiBranch,
  AiBranchMessages,
  AiBranchNext,
  AiBranchPage,
  AiBranchPrevious,
  AiBranchSelector,
  type AiBranchMessagesProps,
  type AiBranchPageProps,
  type AiBranchProps,
  type AiBranchSelectorProps,
} from './ai/ai-branch.tsx'
export { AiTaskList, type AiTask, type AiTaskListProps, type AiTaskStatus } from './ai/ai-task-list.tsx'
export { AgentAvatar, type AgentAvatarProps } from './ai/agent-avatar.tsx'

// 照 SmoothUI 搬来与并入的「浮层、导航、展示与布局」一批（MIT，出处见 NOTICE）。
export {
  Avatar,
  AvatarGroup,
  useAvatarSize,
  type AvatarGroupProps,
  type AvatarProps,
  type AvatarSize,
  type AvatarStatusValue,
} from './primitives/avatar.tsx'
export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from './primitives/breadcrumb.tsx'
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './primitives/collapsible.tsx'
export {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from './primitives/menubar.tsx'
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerClass,
} from './primitives/navigation-menu.tsx'
export { Pagination, buildPageRange, type PaginationLabels, type PaginationProps } from './primitives/pagination.tsx'
export {
  AnimatedFileUpload,
  formatBytes,
  type AnimatedFileUploadProps,
  type FileUploadLabels,
} from './patterns/animated-file-upload.tsx'
export { Dock, falloff, type DockItem, type DockProps } from './patterns/dock.tsx'
export { ExpandableCards, type ExpandableCard, type ExpandableCardsProps } from './patterns/expandable-cards.tsx'
export {
  ExpandableNavbar,
  type ExpandableNavbarItem,
  type ExpandableNavbarProps,
} from './patterns/expandable-navbar.tsx'
export { FileTree, type FileTreeItem, type FileTreeProps } from './patterns/file-tree.tsx'
export { FloatingNavbar, type FloatingNavbarItem, type FloatingNavbarProps } from './patterns/floating-navbar.tsx'
export { RichPopover, type RichPopoverProps } from './patterns/rich-popover.tsx'
export {
  TimeMachineStack,
  type TimeMachineStackItem,
  type TimeMachineStackProps,
} from './patterns/time-machine-stack.tsx'
export {
  MacTerminal,
  type MacTerminalLabels,
  type MacTerminalProps,
  type TerminalLine,
  type TerminalLineType,
} from './katana/mac-terminal.tsx'
export {
  FolderReveal,
  type FolderRevealItem,
  type FolderRevealProps,
  type FolderTone,
} from './motion/surface/folder-reveal.tsx'
export { GlassCard, type GlassCardProps } from './motion/surface/glass-card.tsx'
export { GlowHoverCard, type GlowHoverCardProps } from './motion/surface/glow-hover-card.tsx'
export { GooeyPopover, type GooeyPopoverProps } from './motion/surface/gooey-popover.tsx'
export { MorphSurface, type MorphSurfaceProps } from './motion/surface/morph-surface.tsx'
export { TiltCard, type TiltCardProps } from './motion/surface/tilt-card.tsx'

// 照 SmoothUI 搬来的「交易工作台最用得上」一批（MIT，出处见 NOTICE）：信息流进场、行情跑马灯、通知岛、自选置顶、点阵图、角标、加载、滚动进度、拨盘与滑动确认。
export { AnimatedList, type AnimatedListItem, type AnimatedListProps } from './katana/animated-list.tsx'
export { InfiniteSlider, type InfiniteSliderProps } from './katana/infinite-slider.tsx'
export { DynamicIsland, type DynamicIslandProps } from './katana/dynamic-island.tsx'
export { PinnedList, type PinnedListItem, type PinnedListLabels, type PinnedListProps } from './katana/pinned-list.tsx'
export {
  AnimatedAvatarGroup,
  type AnimatedAvatarGroupItem,
  type AnimatedAvatarGroupProps,
} from './katana/animated-avatar-group.tsx'
export { HoverExpand, type HoverExpandItem, type HoverExpandProps } from './katana/hover-expand.tsx'
export {
  DitherChart,
  DITHER_CHART_VARIANTS,
  type DitherChartMatrixOrder,
  type DitherChartPoint,
  type DitherChartProps,
  type DitherChartSeries,
  type DitherChartVariant,
} from './katana/dither-chart.tsx'
export {
  CountBadge,
  type CountBadgePosition,
  type CountBadgeProps,
  type CountBadgeStatus,
} from './katana/count-badge.tsx'
export {
  SwitchboardCard,
  litIndexes,
  type SwitchboardCardProps,
  type SwitchboardLight,
} from './katana/switchboard-card.tsx'
export { AnimatedTags, type AnimatedTagsLabels, type AnimatedTagsProps } from './katana/animated-tags.tsx'
export { ExposureSlider, type ExposureSliderProps } from './katana/exposure-slider.tsx'
export { PowerOffSlide, type PowerOffSlideProps } from './katana/power-off-slide.tsx'
export {
  AnimatedStepper,
  type AnimatedStepperLabels,
  type AnimatedStepperProps,
  type AnimatedStepperStep,
} from './katana/animated-stepper.tsx'
export { Squircle, squirclePath, type SquircleProps } from './katana/squircle.tsx'
export {
  GridLoader,
  GRID_LOADER_PATTERNS,
  type GridLoaderPattern,
  type GridLoaderProps,
  type GridMatrix,
} from './katana/grid-loader.tsx'
export {
  MotionLoader,
  MOTION_LOADER_VARIANTS,
  type MotionLoaderProps,
  type MotionLoaderVariant,
} from './katana/motion-loader.tsx'
export {
  PagePreloader,
  PAGE_PRELOADER_VARIANTS,
  preloaderExitMs,
  type PagePreloaderProps,
  type PagePreloaderVariant,
} from './katana/page-preloader.tsx'
export { ScrollProgress, type ScrollProgressProps } from './katana/scroll-progress.tsx'

// 动效：过场、背景、特效与媒体（改自 SmoothUI，MIT；出处见 NOTICE）。WebGL 与 canvas 类只在屏内且标签页可见时跑；WebGL 不可用时各自退回 CSS 或淡入淡出。
export {
  ShaderReveal,
  type ShaderRevealProps,
  type ShaderRevealVariant,
} from './motion/transition/shader-reveal/shader-reveal.tsx'
export {
  SdfBlobTransition,
  type SdfBlobTransitionProps,
  type SdfBlobVariant,
} from './motion/transition/sdf-blob-transition.tsx'
export {
  ApertureBlurTransition,
  type ApertureBlurTransitionProps,
} from './motion/transition/aperture-blur-transition.tsx'
export { ChromaBlurTransition, type ChromaBlurTransitionProps } from './motion/transition/chroma-blur-transition.tsx'
export { AuroraCurtain, type AuroraCurtainProps, type AuroraDirection } from './motion/background/aurora-curtain.tsx'
export { GravityStars, type GravityStarsProps } from './motion/background/gravity-stars.tsx'
export { LiquidMetal, type LiquidMetalProps, type LiquidMetalVariant } from './motion/background/liquid-metal.tsx'
export { Orb, type OrbProps } from './motion/background/orb.tsx'
export {
  PixelFlowField,
  type PixelFlowFieldProps,
  type PixelFlowFieldShape,
} from './motion/background/pixel-flow-field.tsx'
export { BorderBeam, type BorderBeamProps, type BorderBeamRadius } from './motion/effect/border-beam.tsx'
export {
  CursorImageTrail,
  type CursorImageTrailProps,
  type CursorTrailImage,
} from './motion/effect/cursor-image-trail.tsx'
export { DrawingCursor, type DrawingCursorHandle, type DrawingCursorProps } from './motion/effect/drawing-cursor.tsx'
export { EmbossSurface, type EmbossSurfaceProps, type EmbossSurfaceVariant } from './motion/effect/emboss-surface.tsx'
export {
  HolographicFoil,
  type HolographicFoilPattern,
  type HolographicFoilProps,
} from './motion/effect/holographic-foil.tsx'
export {
  MagneticField,
  type MagneticFieldItem,
  type MagneticFieldMode,
  type MagneticFieldProps,
} from './motion/effect/magnetic-field.tsx'
export {
  ParallaxLayers,
  type ParallaxDirection,
  type ParallaxLayer,
  type ParallaxLayersProps,
} from './motion/effect/parallax-layers.tsx'
export {
  ProgressiveBlur,
  type ProgressiveBlurDirection,
  type ProgressiveBlurProps,
} from './motion/effect/progressive-blur.tsx'
export {
  ScrollImageReveal,
  type ScrollImageRevealDirection,
  type ScrollImageRevealMask,
  type ScrollImageRevealProps,
} from './motion/effect/scroll-image-reveal.tsx'
export {
  SvgClipMask,
  type SvgClipMaskAnimate,
  type SvgClipMaskProps,
  type SvgClipMaskShape,
} from './motion/effect/svg-clip-mask.tsx'
export { SvgDrawOnScroll, type SvgDrawOnScrollProps } from './motion/effect/svg-draw-on-scroll.tsx'
export {
  AsciiRender,
  type AsciiColorMode,
  type AsciiRenderProps,
  type AsciiRenderSource,
} from './motion/media/ascii-render.tsx'
export { DitherImage, type DitherAlgorithm, type DitherImageProps } from './motion/media/dither-image.tsx'
export {
  PixelBrushCanvas,
  type PixelBrushCanvasBrush,
  type PixelBrushCanvasHandle,
  type PixelBrushCanvasLabels,
  type PixelBrushCanvasProps,
} from './motion/media/pixel-brush-canvas.tsx'
