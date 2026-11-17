// SPDX-License-Identifier: MIT
// 改自 SmoothUI navigation-menu（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { ChevronDown } from 'lucide-react'
import { NavigationMenu as NavigationMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'

// 导航菜单：顶栏上一排带下拉面板的入口（行情、策略、研究…），面板共用一个视口：在入口间划动时面板按方向滑入滑出、宽高平滑过渡（原件的做法，
// 数值与曲线换成我们的 token，样式在 theme/sui-motion.css）。要一排动作用 Toolbar、要整页导航用 SideNav。行为底座是 Radix NavigationMenu。
function NavigationMenu({ className, children, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn('relative flex max-w-max flex-1 justify-center', className)}
      {...props}
    >
      {children}
      <div className="absolute top-full left-0 flex w-full justify-center">
        <NavigationMenuPrimitive.Viewport
          data-slot="navigation-menu-viewport"
          className="relative mt-1 shrink-0 h-[var(--radix-navigation-menu-viewport-height)] origin-top overflow-hidden rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-4 shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)] w-(--radix-navigation-menu-viewport-width) max-w-[100vw]"
        />
      </div>
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn('m-0 flex list-none items-center gap-0.5 p-0', className)}
      {...props}
    />
  )
}

function NavigationMenuItem({ ...props }: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />
}

const triggerClass = cn(
  'k-text-data group inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-[var(--radius-control)] px-2.5 text-ink-2 select-none',
  'transition-colors duration-100 hover:bg-alpha-white-4 hover:text-ink data-[state=open]:bg-alpha-white-6 data-[state=open]:text-ink',
  focusRingInset,
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(triggerClass, className)}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className="size-[13px] text-ink-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn('p-2 md:absolute md:top-0 md:left-0 md:w-auto', className)}
      {...props}
    />
  )
}

function NavigationMenuLink({ className, ...props }: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        'k-text-body block cursor-pointer rounded-[6px] p-2 text-ink-2 no-underline select-none transition-colors duration-100 hover:bg-alpha-white-4 hover:text-ink',
        'data-[active]:bg-alpha-white-6 data-[active]:text-ink',
        focusRingInset,
        className,
      )}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  triggerClass as navigationMenuTriggerClass,
}
