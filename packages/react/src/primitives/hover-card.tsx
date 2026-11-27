// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import {
  HoverCard as HoverCardRoot,
  HoverCardContent as HoverCardPanel,
  HoverCardTrigger as HoverCardLink,
} from '@ui-sdk/react/hover-card'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { childrenOf, partRender } from '../lib/radix-compat.tsx'

// 悬停卡：指针停在触发器上（或键盘焦点到了它）弹出的一小块补充信息，跟弹层同一块材质；入场跟弹层一样从触发处轻升（theme/motion.css）。
// 延迟：openDelay 700ms、closeDelay 300ms（Radix HoverCard 的默认值，我们沿用；UI SDK 的 delay 默认 600）：它是补充，不是主要路径，别急着弹。行为底座是 UI SDK 的 HoverCard（#263）。
// 卡里不放必须操作的东西：触屏没有悬停；要操作的用 Popover。里面的内容读屏读不到「它出来了」，重要信息要在页面里另有一份。
function HoverCard({
  openDelay = 700,
  closeDelay = 300,
  ...props
}: Omit<ComponentProps<typeof HoverCardRoot>, 'delay' | 'closeDelay'> & {
  /** Milliseconds the pointer rests before it opens. */
  openDelay?: number
  /** Milliseconds before it closes once the pointer leaves. */
  closeDelay?: number
}) {
  return <HoverCardRoot delay={openDelay} closeDelay={closeDelay} {...props} />
}

function HoverCardTrigger({
  asChild,
  children,
  ...props
}: Omit<ComponentProps<typeof HoverCardLink>, 'render' | 'children'> & {
  /** Merge the trigger's props onto its only child. */
  asChild?: boolean
  children?: ReactNode
}) {
  return (
    <HoverCardLink render={partRender('hover-card-trigger', 'a', asChild, children)} {...props}>
      {childrenOf(asChild, children)}
    </HoverCardLink>
  )
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: Omit<ComponentProps<typeof HoverCardPanel>, 'render'>) {
  return (
    <HoverCardPanel
      align={align}
      sideOffset={sideOffset}
      render={partRender('hover-card-content', 'div')}
      className={cn(
        'k-mat-overlay k-text-body z-50 w-64 p-3 text-(color:--k-content-body-foreground) outline-0',
        className,
      )}
      {...props}
    />
  )
}

export { HoverCard, HoverCardContent, HoverCardTrigger }
