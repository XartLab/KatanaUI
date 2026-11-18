// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870）；
// 行为底座是 cmdk 1.1.1（https://github.com/pacocoursey/cmdk ，MIT，Copyright (c) 2022 Paco Coursey，2026-11-14 读）：搜索过滤、↑↓ 走行、回车选中、分组都是它做的。
// 拷进来以后归我们改：尺寸、颜色按我们的 token 重写（决策记录 0049）。
import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import { SearchIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog.tsx'
import { menuRowBaseClass } from './menu-parts.tsx'

// 命令面板与可搜索列表的底座：一个输入框加一串过滤出来的行，焦点一直在输入框里，↑↓ 移动高亮（data-selected），回车选中。
// 过滤是 cmdk 的（按行的 value 与 keywords 模糊匹配）；自己排名的（应用里的命令搜索）传 shouldFilter={false}，行的先后照传进来的。
// 读屏：输入框是 combobox（名字取 Command 的 label，cmdk 用 aria-labelledby 指向它，所以输入框自己的 aria-label 不起作用；CommandDialog 把 title 当 label），列表是 listbox，行是 option，aria-selected 说的是当前高亮的那一行（不是「已选」）。
// 行的皮肤跟菜单行一个样（30 高、悬停 4% 白）；文案（占位、没有结果、对话框的标题）都由调用方传，包里不写字。
function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'k-text-body flex h-full w-full flex-col overflow-hidden text-(color:--k-content-body-foreground)',
        className,
      )}
      {...props}
    />
  )
}

/** 命令面板对话框：title 与 description 读屏用（不显示），所以必填；内容放 CommandInput、CommandList。 */
function CommandDialog({
  title,
  description,
  children,
  className,
  commandProps,
  ...props
}: ComponentProps<typeof Dialog> & {
  /** Title for screen readers (not shown, required). */
  title: string
  /** Description for screen readers (not shown, required). */
  description: string
  /** Extra class name on the dialog content. */
  className?: string
  /** Props passed to the Command inside. */
  commandProps?: ComponentProps<typeof CommandPrimitive>
}) {
  return (
    <Dialog {...props}>
      <DialogContent className={cn('overflow-hidden p-0', className)}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command label={title} {...commandProps}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-10 shrink-0 items-center gap-2 border-b border-(color:--k-separable-subtle-borderColor) px-3"
    >
      <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-(color:--k-content-secondary-foreground)" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'k-text-body h-full w-full border-0 bg-transparent text-(color:--k-content-primary-foreground) outline-0 placeholder:text-(color:--k-content-secondary-foreground) disabled:cursor-not-allowed disabled:opacity-45',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto p-1.5', className)}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('k-text-data py-6 text-center text-(color:--k-content-secondary-foreground)', className)}
      {...props}
    />
  )
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden [&_[cmdk-group-heading]]:k-text-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:leading-normal [&_[cmdk-group-heading]]:text-(color:--k-content-body-foreground) [&_[cmdk-group-heading]]:uppercase',
        className,
      )}
      {...props}
    />
  )
}

// 分隔线不用 cmdk 的 Separator：它写死 role="separator"，放在 listbox 里不合 ARIA（listbox 只许 option 与 group，axe aria-required-children）。
// 这里是纯装饰的 role="none"，行为照 cmdk：有搜索词时不画（alwaysRender 除外）。
function CommandSeparator({
  className,
  alwaysRender = false,
  ...props
}: ComponentProps<'div'> & {
  /** Keep the line while a search is typed (cmdk hides separators during a search by default). */
  alwaysRender?: boolean
}) {
  const searching = useCommandState((state) => state.search !== '')
  if (searching && !alwaysRender) return null
  return (
    <div
      data-slot="command-separator"
      cmdk-separator=""
      role="none"
      className={cn('-mx-1.5 my-1 h-px bg-(--k-overlay-borderColor)', className)}
      {...props}
    />
  )
}

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        menuRowBaseClass,
        // cmdk 的行总带 data-disabled（"true" / "false"），禁用态只认 ="true"。
        'justify-start data-[selected=true]:bg-(--k-selectable-subtle-background-hover) data-[selected=true]:text-(color:--k-content-primary-foreground) data-[disabled=true]:pointer-events-none data-[disabled=true]:text-(color:--k-content-secondary-foreground) data-[disabled=true]:opacity-45 [&_svg:not([class*=size-])]:size-4',
        className,
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('k-text-caption ml-auto text-(color:--k-content-secondary-foreground)', className)}
      {...props}
    />
  )
}

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
}
