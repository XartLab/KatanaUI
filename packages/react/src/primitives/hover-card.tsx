// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { HoverCard as HoverCardPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { OverlayPortal } from '../lib/overlay.tsx'

// 悬停卡：指针停在触发器上（或键盘焦点到了它）弹出的一小块补充信息，跟弹层同一块材质；入场跟弹层一样从触发处轻升（theme/motion.css）。
// 延迟用 Radix 的默认（openDelay 700ms、closeDelay 300ms，radix-ui 1.8.1 的 HoverCard 默认值）：它是补充，不是主要路径，别急着弹。
// 卡里不放必须操作的东西：触屏没有悬停；要操作的用 Popover。里面的内容读屏读不到「它出来了」，重要信息要在页面里另有一份。
function HoverCard({ ...props }: ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function HoverCardTrigger({ ...props }: ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <OverlayPortal portal={HoverCardPrimitive.Portal}>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'k-text-body z-50 w-64 k-mat-overlay p-3 text-(color:--k-content-body-foreground) outline-0',
          className,
        )}
        {...props}
      />
    </OverlayPortal>
  )
}

export { HoverCard, HoverCardContent, HoverCardTrigger }
