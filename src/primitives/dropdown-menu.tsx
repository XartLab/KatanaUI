// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { focusRingInset } from '../lib/focus'

// 下拉菜单：照 OpenMarket tb-interval-dropdown / tb-panels（2026-10-05 实测）。容器圆角 overlay · 6px 内边 · 7% 白边 · 0 16 48 + 0 2 8 阴影；
// 行 30 高 · 圆角 6 · 12.5px，悬停 4% 白，子菜单展开 7% 白；分组小标题 10px 600 大写字距；快捷键是 kbd 方块。动效是我们的：从触发处轻升（theme/motion.css）。
//
// 二级菜单的规矩是 #1832 定的，内建在这里，调用方不用再传：
//   - 位置：开在父项右边（Radix 的 SubContent 固定 side=right、align=start），sideOffset 2 与顶层菜单一致；
//     alignOffset -7 = 容器 6px 内边 + 1px 边，把二级菜单往上抬这么多，两个第一项才对齐。
//   - 悬停：指针停在父项上 100ms 开，斜着移向子菜单靠 Radix 自带的安全三角（pointer grace，300ms）不误收。
//     数字是 Radix 的实现值，不是我们的配置：@radix-ui/react-menu 2.2.1 dist/index.mjs 的 SubTrigger onPointerMove 里 setTimeout(..., 100)，2026-11-13 读。
//   - 键盘：→ / Enter / Space 打开，← 关闭回到父项（Radix 的 SUB_OPEN_KEYS / SUB_CLOSE_KEYS）。
//   - 层数：最多两层（顶层 + 一个子菜单），不做三层（decisions.md 2026-11-13）。组件不拦着，调用方守这条。
//   - 箭头：父项行尾 ChevronRight 13px，ink-300；全应用统一用它，不手写文字 ›。

const container =
  'k-text-body max-h-[min(var(--radix-dropdown-menu-content-available-height),calc(100dvh-16px))] min-w-[180px] overflow-x-hidden overflow-y-auto rounded-[var(--radius-overlay)] border border-white/7 bg-surface-4 p-1.5 leading-none text-ink-2 outline-0 shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)]'

const row = cn(
  'relative flex h-[30px] cursor-pointer items-center justify-between gap-3 rounded-[6px] px-2 whitespace-nowrap text-ink-2 select-none',
  'transition-colors duration-100 data-[highlighted]:bg-white/4 data-[highlighted]:text-ink',
  'data-[disabled]:pointer-events-none data-[disabled]:bg-transparent data-[disabled]:text-ink-3 data-[disabled]:opacity-60',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  focusRingInset,
)

function DropdownMenu({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuTrigger({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 2,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(container, 'z-50', className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuItem({
  className,
  variant = 'default',
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: 'default' | 'danger' }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(row, 'data-[variant=danger]:text-danger', className)}
      {...props}
    />
  )
}

/** 勾选列：固定 10px 宽，勾是强调色；没有勾的行不占这一列（调用方自己对齐）。 */
function Indicator({ children }: { children: ReactNode }) {
  return (
    <span className="flex w-[10px] flex-none items-center justify-center text-brand">
      <DropdownMenuPrimitive.ItemIndicator>{children}</DropdownMenuPrimitive.ItemIndicator>
    </span>
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(row, 'justify-start data-[state=checked]:font-medium data-[state=checked]:text-ink', className)}
      {...props}
    >
      <Indicator>
        <CheckIcon className="size-[10px]" strokeWidth={3} />
      </Indicator>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(row, 'justify-start data-[state=checked]:font-medium data-[state=checked]:text-ink', className)}
      {...props}
    >
      <Indicator>
        <CircleIcon className="size-[6px] fill-current" />
      </Indicator>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/** 分组小标题：是文字，用 ink-200（10px 的 ink-300 落在弹层底 bg-400 上是 4.45:1，过不了 axe 的 4.5，#1832）。 */
function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn('k-text-micro px-2 pt-2 pb-1 leading-normal text-ink-2 uppercase', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1.5 my-1 h-px bg-white/7', className)}
      {...props}
    />
  )
}

/** 快捷键方块：照 OpenMarket tb-panels__key。20 高 · 圆角 4 · 6% 白底 12% 白边 · 10.5px 500。 */
function DropdownMenuShortcut({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'k-text-caption ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-white/12 bg-white/6 px-1 leading-none font-medium text-ink-2',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(row, 'data-[state=open]:bg-white/7 data-[state=open]:text-ink', className)}
      {...props}
    >
      {children}
      <span aria-hidden="true" className="ml-auto inline-flex text-ink-3">
        <ChevronRightIcon className="size-[13px]" />
      </span>
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  sideOffset = 2,
  alignOffset = -7,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className={cn(container, 'z-50', className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
