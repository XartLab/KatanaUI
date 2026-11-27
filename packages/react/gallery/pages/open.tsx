// SPDX-License-Identifier: MIT
import { Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../src/index'

// 浮层「打开的样子」（设计系统包的预览用，ds/render.tsx 包在 InlineOverlays 里渲染）：用 Radix 的 open 把内容摆出来，内容不进 Portal，
// 位置由预览的版面类（gallery/preview.css 的 .ds-open）摆在触发器下面。文案与数据都是演示用的。

export function TooltipOpen() {
  return (
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="说明">
            <Info />
          </Button>
        </TooltipTrigger>
        <TooltipContent>封板率 = 封住的 ÷ 触及涨停的</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function PopoverOpen() {
  return (
    <Popover open>
      <PopoverTrigger asChild>
        <Button>弹层</Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>取数口径</PopoverTitle>
          <PopoverDescription>交易日没选时，按数据集默认的最近一个交易日取。</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}

export function DialogOpen() {
  return (
    <Dialog open modal={false}>
      <DialogContent closeLabel="关闭">
        <DialogHeader>
          <DialogTitle>恢复默认布局</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>这块看板会回到模板的排法，你加的格子会被移除。</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button>取消</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">恢复</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AlertDialogOpen() {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>平掉 BTCUSDT 多单</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>按市价卖出 0.250 张，成交后不能撤回。</AlertDialogDescription>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="danger">平仓</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DropdownMenuOpen() {
  return (
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger asChild>
        <Button>菜单</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>看板</DropdownMenuLabel>
        <DropdownMenuItem>
          添加组件 <DropdownMenuShortcut>A</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>已禁用的一项</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>显示网格</DropdownMenuCheckboxItem>
        <DropdownMenuItem variant="danger">删除看板</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ContextMenuOpen() {
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div className="gal-ctx">右键这里</div>
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="面板菜单" forceMount>
        <ContextMenuLabel>面板</ContextMenuLabel>
        <ContextMenuItem>
          克隆面板 <ContextMenuShortcut>C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>已禁用的一项</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>显示网格</ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function SelectOpen() {
  return (
    <Select open value="candles">
      <SelectTrigger aria-label="图表类型" style={{ width: 160 }}>
        <SelectValue>K 线</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="line">折线</SelectItem>
        <SelectItem value="candles">K 线</SelectItem>
        <SelectItem value="bars">美国线</SelectItem>
      </SelectContent>
    </Select>
  )
}
