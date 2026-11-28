// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import { Tabs as TabsRoot, TabsList as TabsListRoot, TabsPanel, TabsTab } from '@ui-sdk/react/tabs'
import { createContext, use, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { part, legacyState } from '../lib/legacy-attrs.ts'
import { rovingKeys } from '../lib/roving-keys.ts'
import type { SlotOverride } from '../lib/slot-name.ts'
import { focusRingInset } from '../lib/focus.ts'

// 页签：外观照现有的小号分段（OpenMarket pill-container：2px 内边 · 圆角 8 · 4% 白底，选中块圆角 6），
// 选中块是一块跟着当前页签滑的底（tabs-pill，位置量出来写在行内，弹簧走 --ease-snappy，见 theme/motion.css）。
// 选中项的字用 --seg-on-ink（对容器底 ≥ 3:1，#477），未选中的用 ink-200（ink-300 压在 4–5% 白的底上只有 4.4:1，#473）。
// 悬停提亮只给未选中的：选中项悬停时 enabled:hover 的特异性比 data-[state=active] 高，字会从 --seg-on-ink 掉成主文字色，压在选中块上对比度比静止态低（#221）。
// line 变体没有底块，选中项底下一道强调色的线。只做横排。
/** bare：不带间距，样子全由调用方的类名给（应用里自带皮肤的页签条，#1797 把 Base UI 的 Tabs 换过来时外观原样保留）。 */
// 页签列要知道是不是自动激活：方向键走到的页签自动选中（默认），或只移焦点（manual）。
const ActivationContext = createContext<'automatic' | 'manual'>('automatic')

function Tabs({
  className,
  bare,
  activationMode,
  onValueChange,
  'data-slot': slot = 'tabs',
  ...props
}: Omit<ComponentProps<typeof TabsRoot>, 'activation' | 'value' | 'defaultValue' | 'onValueChange'> & {
  /** Skip the skin. */
  bare?: boolean
  /** The selected tab's value (controlled). */
  value?: string
  /** The selected tab's value at first (uncontrolled). */
  defaultValue?: string
  /** Called with the chosen tab's value. */
  onValueChange?: (value: string) => void
  /** automatic (default): arrow keys select as they move; manual: they only move focus, Enter or Space selects. */
  activationMode?: 'automatic' | 'manual'
} & SlotOverride) {
  return (
    <ActivationContext value={activationMode ?? 'automatic'}>
      <TabsRoot
        render={part('div', { slot })}
        activation={activationMode}
        onValueChange={(next) => {
          if (next !== null) onValueChange?.(next)
        }}
        className={cn(!bare && 'flex flex-col gap-2', className)}
        {...props}
      />
    </ActivationContext>
  )
}

const tabsListVariants = cva('group/tabs-list relative', {
  variants: {
    /** Skin: line, default, or bare (no skin, the caller's class names style it). */
    variant: {
      default:
        'inline-flex h-8 w-fit items-center justify-center gap-0.5 rounded-[var(--radius-control)] bg-(--k-selectable-subtle-groupBackground) p-0.5',
      line: 'inline-flex h-8 w-fit items-center justify-center gap-1 border-b border-(color:--k-container-subtle-borderColor)',
      // 不带皮肤，样子由调用方的类名给。
      bare: '',
    },
  },
  defaultVariants: { variant: 'default' },
})

type Pill = { left: number; top: number; width: number; height: number }

function TabsList({
  className,
  variant = 'default',
  children,
  'data-slot': slot = 'tabs-list',
  onKeyDown,
  ...props
}: Omit<ComponentProps<typeof TabsListRoot>, 'children'> &
  VariantProps<typeof tabsListVariants> &
  SlotOverride & {
    /** The tab triggers. */
    children?: ReactNode
  }) {
  const list = useRef<HTMLDivElement>(null)
  const activation = use(ActivationContext)
  // 当前页签的位置与大小：量出来给底块用。换页签时改的是页签上的 data-state（UI SDK 的 data-selected 旁边补回的原值，见 lib/legacy-attrs.ts），所以盯着这个属性；列表变宽变窄也重量。
  const [pill, setPill] = useState<Pill | null>(null)
  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const place = () => {
      const active = element.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]')
      setPill(
        active
          ? { left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight }
          : null,
      )
    }
    place()
    const states = new MutationObserver(place)
    states.observe(element, { attributes: true, attributeFilter: ['data-state'], subtree: true })
    const size = new ResizeObserver(place)
    size.observe(element)
    return () => {
      states.disconnect()
      size.disconnect()
    }
  }, [])
  return (
    <TabsListRoot
      ref={list}
      render={part('div', { slot, extra: (p) => ({ 'aria-orientation': p['data-orientation'] }) })}
      data-variant={variant}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        rovingKeys(list.current, event, {
          items: (root) => [...root.querySelectorAll<HTMLElement>('[role="tab"]')],
          axis: 'horizontal',
          activate: activation === 'automatic',
        })
      }}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {variant === 'default' && pill ? (
        <span
          aria-hidden="true"
          data-slot="tabs-pill"
          className="pointer-events-none absolute top-0 left-0 rounded-[var(--radius-control)] bg-(--seg-on-bg)"
          style={{ width: pill.width, height: pill.height, translate: `${pill.left}px ${pill.top}px` }}
        />
      ) : null}
      {children}
    </TabsListRoot>
  )
}

function TabsTrigger({
  className,
  bare,
  'data-slot': slot = 'tabs-trigger',
  ...props
}: ComponentProps<typeof TabsTab> &
  SlotOverride & {
    /** Skip the skin. */
    bare?: boolean
  }) {
  return (
    <TabsTab
      render={part('button', { slot, state: legacyState.tab })}
      className={cn(
        !bare && [
          'k-text-data relative inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-2 leading-none whitespace-nowrap text-(color:--k-content-body-foreground)',
          'transition-[color,scale] duration-200 enabled:not-data-disabled:active:scale-[0.96] enabled:not-data-disabled:data-[state=inactive]:hover:text-(color:--k-content-primary-foreground)',
          'data-[state=active]:font-medium data-[state=active]:text-(--seg-on-ink)',
          'group-data-[variant=line]/tabs-list:data-[state=active]:text-(color:--k-content-primary-foreground)',
          // UI SDK 的禁用页签是 aria-disabled + data-disabled，没有原生 disabled，所以 disabled: 之外再认 data-disabled。
          'disabled:cursor-not-allowed disabled:opacity-30 data-disabled:cursor-not-allowed data-disabled:opacity-30',
          '[&_svg]:pointer-events-none [&_svg]:size-[13px] [&_svg]:shrink-0',
          // 线型的底线画在列表那道线上，向下压 1px 盖住它。
          'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-(--k-selectable-bold-background-selected) after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
          focusRingInset,
        ],
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  forceMount,
  ...props
}: ComponentProps<typeof TabsPanel> & {
  /** Keep the panel in the page while it isn't selected (hidden then). */
  forceMount?: true
}) {
  return (
    <TabsPanel
      render={part('div', { slot: 'tabs-content', state: legacyState.tab })}
      keepMounted={forceMount}
      className={cn('flex-1 outline-0', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
