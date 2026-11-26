// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Tooltip as TooltipPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { OverlayPortal } from '../lib/overlay.tsx'

// 提示：照 OpenMarket q-tooltip。6px 8px 内边 · 圆角 6 · 最深底 + 细边 · 0 2 10 阴影；没有小箭头。
// 内容里有快捷键键帽（.k-kbd）时压成浅色块：照 OpenMarket 提示里的 kbd。
// 提示的外观类单独导出一份：应用里有不经过 React 的地方（图表的 Vega 悬停提示）要画同样的框。
// 开得很快（延迟 0）：提示是给已经停在按钮上的人看的，等 700ms（Radix 默认）反而像卡了。
const tooltipContentClass = [
  'k-text-data z-60 inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-(color:--k-separable-tertiary-borderColor) bg-(--k-surface-sunken-background) px-2 py-1.5 leading-[1.3] font-normal text-(color:--k-content-body-foreground)',
  'shadow-(--k-overlay-tooltip-shadow)',
  '[&_.k-kbd]:border-transparent [&_.k-kbd]:bg-(--k-content-primary-foreground) [&_.k-kbd]:font-semibold [&_.k-kbd]:text-(color:--k-surface-sunken-background)',
].join(' ')

function TooltipProvider({ delayDuration = 0, ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

function Tooltip({ ...props }: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <OverlayPortal portal={TooltipPrimitive.Portal}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(tooltipContentClass, 'pointer-events-none', className)}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </OverlayPortal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, tooltipContentClass }
