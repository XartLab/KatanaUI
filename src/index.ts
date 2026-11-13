// SPDX-License-Identifier: AGPL-3.0-only
// @katanaview/ui 的出口：应用只从这里引（dependency-cruiser 的 ui-only-via-entry）。样式走 `@katanaview/ui/tokens.css` 与 `@katanaview/ui/ui.css`，
// 动效参数走 `@katanaview/ui/motion`。

export { cn } from './lib/cn'
export { focusRing, focusRingInset } from './lib/focus'

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './primitives/accordion'
export { Button, buttonVariants } from './primitives/button'
export { Checkbox } from './primitives/checkbox'
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
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './primitives/popover'
export { Input, inputVariants } from './primitives/input'
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
