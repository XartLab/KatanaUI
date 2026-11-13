// SPDX-License-Identifier: MIT
import { Info } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../src/index'
import { recordCall, useCalls } from '../calls'
import { Row } from './parts'

// 浮层的演示。数据和文案都是演示用的。

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Row>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="说明">
              <Info />
            </Button>
          </TooltipTrigger>
          <TooltipContent>封板率 = 封住的 ÷ 触及涨停的</TooltipContent>
        </Tooltip>
      </Row>
    </TooltipProvider>
  )
}

export function PopoverDemo() {
  return (
    <Row>
      <Popover>
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
    </Row>
  )
}

export function DialogDemo() {
  return (
    <Row>
      <Dialog>
        <DialogTrigger asChild>
          <Button>对话框</Button>
        </DialogTrigger>
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
      <TriggerlessDialog />
    </Row>
  )
}

export function DropdownMenuDemo() {
  const [grid, setGrid] = useState(true)
  const [mode, setMode] = useState('normal')
  const calls = useCalls()
  return (
    <Row>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>菜单</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>看板</DropdownMenuLabel>
          <DropdownMenuItem onSelect={recordCall('添加组件')}>
            添加组件 <DropdownMenuShortcut>A</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>编辑布局</DropdownMenuItem>
          <DropdownMenuItem disabled>已禁用的一项</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
            显示网格
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
            <DropdownMenuRadioItem value="normal">正常</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dense">紧凑</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>更多</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>导出为图片</DropdownMenuItem>
              <DropdownMenuItem>导出为 CSV</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="danger">删除看板</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output data-gallery-calls>{JSON.stringify(calls)}</output>
    </Row>
  )
}

export function ContextMenuDemo() {
  const [grid, setGrid] = useState(true)
  const calls = useCalls()
  return (
    <Row>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="gal-ctx" data-gallery-ctx>
            右键这里
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="面板菜单">
          <ContextMenuLabel>面板</ContextMenuLabel>
          <ContextMenuItem onSelect={recordCall('克隆面板')}>
            克隆面板 <ContextMenuShortcut>C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem disabled>已禁用的一项</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
            显示网格
          </ContextMenuCheckboxItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>更多</ContextMenuSubTrigger>
            <ContextMenuSubContent aria-label="更多">
              <ContextMenuItem onSelect={recordCall('导出为图片（右键）')}>导出为图片</ContextMenuItem>
              <ContextMenuItem>导出为 CSV</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
      <output data-gallery-calls>{JSON.stringify(calls)}</output>
    </Row>
  )
}

/** 代码打开的对话框（没有 DialogTrigger）：应用里大多数对话框是这样开的，焦点回位靠 DialogContent 记下的打开前焦点。 */
function TriggerlessDialog() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>代码开的对话框</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel="关闭">
          <DialogHeader>
            <DialogTitle>由代码打开</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>没有触发器；关掉以后焦点回到打开前的按钮。</DialogDescription>
            <input aria-label="示例输入" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>带提示的按钮</Button>
                </TooltipTrigger>
                <TooltipContent>对话框里的提示</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button>取消</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary">确定</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
