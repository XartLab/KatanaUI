// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'

// 滚动区：Radix 的自绘滚动条，4px 宽，平时不出现，指针到了这一块才出一条淡线（18% 墨色，指到滚动条上 32%），跟全应用原生滚动条的写法同一个样（#1799）。
// 调用方要给 Root 一个确定的高（或 max-height）：内容比它高才滚。键盘：Viewport 可聚焦（tabIndex 0），内容里没有可聚焦的东西时方向键、PageDown 也能滚。
// type 默认 hover；always 是一直显示、scroll 是滚动时显示、auto 是内容溢出就显示。
function ScrollArea({
  className,
  children,
  viewportClassName,
  type = 'hover',
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  /** Extra class name on the scrolling viewport inside. */
  viewportClassName?: string
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type={type}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        className={cn('size-full rounded-[inherit]', focusRingInset, viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none select-none',
        orientation === 'vertical' && 'h-full w-1',
        orientation === 'horizontal' && 'h-1 flex-col',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-[2px] bg-(--k-content-primary-foreground)/18 transition-colors duration-100 hover:bg-(--k-content-primary-foreground)/32"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
