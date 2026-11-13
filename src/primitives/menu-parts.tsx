// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 随 context-menu 一起用 `shadcn add` 生成（#1797），行为底座是 Radix；
// 拷进来以后归我们改：下拉菜单与右键菜单共用的皮肤和零件在这里，两个文件各管自己的 Radix 底座（决策记录 0049）。
import { ChevronRightIcon } from 'lucide-react'
import { createContext, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { focusRingInset } from '../lib/focus'

// 菜单的样子：照 OpenMarket tb-interval-dropdown / tb-panels（2026-10-05 实测）。容器圆角 overlay · 6px 内边 · 7% 白边 · 0 16 48 + 0 2 8 阴影；
// 行 30 高 · 圆角 6 · 12.5px，悬停 4% 白，子菜单展开 7% 白；分组小标题 10px 大写字距；快捷键是 kbd 方块。动效是我们的：从触发处轻升（theme/motion.css）。
// 类名里的 k-pop* 是钩子（浏览器测试与深色主题的样式按它找），本身没有规则；对齐列的规则在 theme/menu.css。
//
// 二级菜单的规矩是 #1832 定的，内建在这里，调用方不用再传：
//   - 位置：开在父项右边（Radix 的 SubContent 固定 side=right、align=start），sideOffset 2 与顶层菜单一致；
//     alignOffset -7 = 容器 6px 内边 + 1px 边，把二级菜单往上抬这么多，两个第一项才对齐。
//   - 悬停：指针停在父项上 100ms 开，斜着移向子菜单靠 Radix 自带的安全三角（pointer grace，300ms）不误收。
//     数字是 Radix 的实现值，不是我们的配置：@radix-ui/react-menu 2.2.1 dist/index.mjs 的 SubTrigger onPointerMove 里 setTimeout(..., 100)，2026-11-13 读。
//   - 键盘：→ / Enter / Space 打开，← 关闭回到父项（Radix 的 SUB_OPEN_KEYS / SUB_CLOSE_KEYS）。
//   - 层数：最多两层（顶层 + 一个子菜单），不做三层（decisions.md 2026-11-13）。组件不拦着，调用方守这条。
//   - 箭头：父项行尾 ChevronRight 13px，ink-300；全应用统一用它，不手写文字 ›。

export const MENU_SIDE_OFFSET = 2
export const SUBMENU_SIDE_OFFSET = 2
export const SUBMENU_ALIGN_OFFSET = -7

/** 可用高度取 Radix Popper 给的 --radix-popper-available-height（菜单、弹层内容都继承得到）。 */
export const menuContainerClass =
  'k-pop k-text-body z-50 max-h-[min(var(--radix-popper-available-height),calc(100dvh-16px))] min-w-[180px] overflow-x-hidden overflow-y-auto rounded-[var(--radius-overlay)] border border-white/7 bg-surface-4 p-1.5 leading-none text-ink-2 outline-0 shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)]'

export const menuRowClass = cn(
  'k-pop-item relative flex h-[30px] cursor-pointer items-center justify-between gap-3 rounded-[6px] px-2 whitespace-nowrap text-ink-2 select-none',
  'transition-[background-color,color] duration-100 data-[highlighted]:bg-white/4 data-[highlighted]:text-ink',
  // 禁用的行仍收指针事件（它的 title 要能悬停出来），只是不高亮、不可选：Radix 自己不让禁用项取焦点。
  'data-[disabled]:cursor-default data-[disabled]:bg-transparent data-[disabled]:text-ink-3 data-[disabled]:opacity-60',
  '[&_svg]:shrink-0',
  focusRingInset,
)

/** 单选 / 勾选行：勾选列在左，文字靠左（快捷键与提示由里面的 ml-auto 推到右端）。 */
export const menuCheckRowClass = cn(
  menuRowClass,
  'justify-start data-[state=checked]:font-medium data-[state=checked]:text-ink',
)

/** 分组小标题：是文字，用 ink-200（10px 的 ink-300 落在弹层底 bg-400 上是 4.45:1，过不了 axe 的 4.5，#1832）。 */
export const menuGroupLabelClass = 'k-pop-group k-text-micro px-2 pt-2 pb-1 leading-normal text-ink-2 uppercase'

export const menuSeparatorClass = 'k-pop-sep -mx-1.5 my-1 h-px bg-white/7'

/** 行里的文字（带图标时图标在它前面）：占满剩下的宽，把快捷键、提示推到右端。 */
export function MenuItemLabel({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span data-slot="menu-label" className={cn('k-pop-label flex flex-1 items-center gap-2', className)} {...props} />
  )
}

/** 图标列：固定 16px 宽，没有图标的行文字缩进同样的量（theme/menu.css）。 */
export function MenuItemIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="menu-icon"
      className={cn('k-pop-icon inline-grid w-4 flex-none place-items-center', className)}
      {...props}
    />
  )
}

/** 行尾的小字提示（「未实装」之类）。 */
export function MenuItemHint({ className, ...props }: ComponentProps<'span'>) {
  return <span data-slot="menu-hint" className={cn('k-pop-hint inline-flex gap-1 text-ink-2', className)} {...props} />
}

/** 勾选列：固定 10px 宽，勾是强调色；没有勾的行不占这一列（theme/menu.css 把它们的文字对齐过来）。 */
export function MenuCheckColumn({ children }: { children: ReactNode }) {
  return (
    <span
      data-slot="menu-check"
      aria-hidden="true"
      className="k-pop-check flex w-[10px] flex-none items-center justify-center text-brand [font-size:var(--text-caption-size)]"
    >
      {children}
    </span>
  )
}

/** 快捷键方块：照 OpenMarket tb-panels__key。20 高 · 圆角 4 · 6% 白底 12% 白边 · 10.5px 500。 */
export function MenuShortcut({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="menu-shortcut"
      className={cn(
        'k-kbd k-text-caption ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-white/12 bg-white/6 px-1 leading-none font-medium text-ink-2',
        className,
      )}
      {...props}
    />
  )
}

/** 二级触发器行尾的箭头：全应用统一用它（ChevronRight 13px，ink-300）。 */
export function SubmenuArrow() {
  return (
    <span aria-hidden="true" data-slot="menu-more" className="k-pop-more ml-auto inline-flex text-ink-3">
      <ChevronRightIcon className="size-[13px]" />
    </span>
  )
}

/**
 * 二级菜单的开合由我们自己持有（Radix 的 Sub 支持受控），为的是 Esc：二级开着时 Esc 只收这一级、焦点回父项，不收整串菜单（#1832）。
 * Radix 的 SubContent 在 Esc 上调的是根菜单的 onClose（整串关），没有只关一级的选项；它自己的「← 关闭并回到父项」只在焦点
 * 落在二级里、且按键冒得到 SubContent 时才生效（面板目录的搜索框会截住按键），也不管指针悬停打开、焦点还在父项上的情形。
 * 所以 Esc 走 SubContent 的 onEscapeKeyDown：preventDefault 挡住 Radix 的整串关，自己把这一级 open 置 false 并把焦点还给父项。
 * @radix-ui/react-menu 2.2.1 dist/index.mjs 的 MenuSubContent / DismissableLayer，2026-11-13 读。
 */
export type SubState = {
  open: boolean
  setOpen: (open: boolean) => void
  trigger: HTMLElement | null
  setTrigger: (element: HTMLElement | null) => void
}
export const SubStateContext = createContext<SubState | null>(null)

/** Sub 的开合：调用方没传 open 就自己持有；onOpenChange 照常通知。 */
export function useSubState({
  open,
  defaultOpen = false,
  onOpenChange,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [inner, setInner] = useState(defaultOpen)
  const [trigger, setTrigger] = useState<HTMLElement | null>(null)
  const current = open ?? inner
  const setOpen = (next: boolean) => {
    setInner(next)
    onOpenChange?.(next)
  }
  return {
    open: current,
    onOpenChange: setOpen,
    state: { open: current, setOpen, trigger, setTrigger } satisfies SubState,
  }
}

/**
 * SubContent 的 onEscapeKeyDown：只收这一级，焦点回父项。这一级已经在收起（淡出 120ms 内它仍是最上层）时再按 Esc，放行给 Radix：
 * 收整串菜单，不然快按两下 Esc 第二下被收起中的二级吞掉，上一级留着。
 */
export function closeSubOnEscape(sub: SubState | null, event: KeyboardEvent) {
  if (!sub?.open) return
  event.preventDefault()
  sub.setOpen(false)
  sub.trigger?.focus()
}

/**
 * 菜单收起时 Radix 把焦点还给触发器。选中的那一项若已经把焦点放到别处（打开聊天面板并聚焦输入框、开对话框……），就别再抢回来。
 * 焦点还在菜单里或在 body 上（Esc、点外面）时照 Radix 的默认走。
 */
export function keepMovedFocus(handler?: (event: Event) => void) {
  return (event: Event) => {
    handler?.(event)
    if (event.defaultPrevented) return
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== document.body && !active.closest('[role="menu"]')) {
      event.preventDefault()
    }
  }
}
