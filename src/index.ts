// SPDX-License-Identifier: MIT
// @katanaview/ui 的出口：应用只从这里引（dependency-cruiser 的 ui-only-via-entry）。样式走 `@katanaview/ui/tokens.css` 与 `@katanaview/ui/ui.css`，
// 动效参数走 `@katanaview/ui/motion`。

export { cn } from './lib/cn'
export { focusRing, focusRingInset } from './lib/focus'
export { useHoverOpen } from './lib/hover-open'
export { InlineOverlays } from './lib/overlay'

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './primitives/accordion'
export { Alert, AlertDescription, AlertTitle, alertVariants } from './primitives/alert'
export { Button, buttonVariants } from './primitives/button'
export { Checkbox } from './primitives/checkbox'
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
} from './primitives/command'
export { menuContainerClass, menuRowClass, menuSeparatorClass } from './primitives/menu-parts'
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
} from './primitives/context-menu'
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
} from './primitives/dialog'
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
} from './primitives/dropdown-menu'
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
} from './primitives/field'
export { HoverCard, HoverCardContent, HoverCardTrigger } from './primitives/hover-card'
export { Label } from './primitives/label'
export { useMenuParts } from './primitives/menu-any'
export { MenuCheckColumn, MenuItemHint, MenuItemIcon, MenuItemLabel } from './primitives/menu-parts'
export {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './primitives/popover'
export { Input, inputVariants } from './primitives/input'
export { Progress } from './primitives/progress'
export { ScrollArea, ScrollBar } from './primitives/scroll-area'
export { Separator } from './primitives/separator'
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
} from './primitives/sheet'
export {
  Select,
  SelectArrow,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectItemClass,
  selectTriggerVariants,
} from './primitives/select'
export { Slider } from './primitives/slider'
export { Switch } from './primitives/switch'
export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from './primitives/tabs'
export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleItemVariants } from './primitives/toggle-group'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, tooltipContentClass } from './primitives/tooltip'
export { MultiSelect } from './patterns/multi-select'
export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from './patterns/combobox'

// KATANA 自有件（#1860 从 src/ui 搬来）：读数、状态灯、点阵、快捷键方块、徽标、滚动数字、数字框、日期时间框、加载骨架。
export { DotMatrix, DOT_PITCH, DOT_SIZE } from './katana/dot-matrix'
export { Lcd, type LcdTone } from './katana/lcd'
export { Led, LINK_GROUPS, type LedState, type LinkGroup } from './katana/led'
export { Kbd } from './katana/kbd'
export { BadgeGroup, type BadgeItem } from './katana/badge'
export { RollingText, rollSlots, rollStrip } from './katana/rolling-text'
export { NumberInput } from './katana/number-input'
export { DateTimeInput, type DateTimeLabels } from './katana/date-time-input'
export { Skeleton } from './katana/skeleton'
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
} from './katana/toast'
export { Loading, LoadingBoundary } from './katana/loading'
export { LoadingView, type LoadingTexts } from './katana/loading-view'
export type { LoadingPhase } from './katana/loading-gate'

// 学自 rare-ui 的交互、本仓库重写的件（#1861）：密钥输入、原地确认的危险按钮、带未读数的铃、状态图标、行内 AI 状态、点阵状态球。
export { PasswordInput, type PasswordInputProps } from './katana/password-input'
export { DeleteButton, type DeleteButtonProps } from './katana/delete-button'
export { NotificationBell, type NotificationBellProps } from './katana/notification-bell'
export { StatusIcon, type StatusIconStatus } from './katana/status-icon'
export { AiStatus, type AiStatusProps, type AiStatusState } from './katana/ai-status'
export { MatrixOrb, type MatrixOrbProps } from './katana/matrix-orb'
export type { OrbState } from './katana/matrix-orb-model'

// 第二批（#1861）：里程表式数字滚动（升级 RollingText，见上）、分步进度条、主题选择、代码块、联网检索来源、任务清单、时长选择。
export { StepPlayer, type StepPlayerLabels, type StepPlayerProps, type StepPlayerStep } from './katana/step-player'
export { ThemeSelector, type ThemeOption, type ThemePalette, type ThemeSelectorProps } from './katana/theme-selector'
export { CodeBlock, type CodeBlockProps } from './katana/code-block'
export {
  WebSearch,
  WebSearchCitation,
  type WebSearchProps,
  type WebSearchCitationProps,
  type WebSearchStatus,
  type WebSource,
} from './katana/web-search'
export { TaskList, type Task, type TaskListLabels, type TaskListProps } from './katana/task-list'
export {
  DurationPicker,
  type DurationPickerLabels,
  type DurationPickerProps,
  type DurationValue,
} from './katana/duration-picker'
export { useHoverIntent } from './lib/hover-intent'
