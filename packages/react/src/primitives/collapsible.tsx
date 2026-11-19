// SPDX-License-Identifier: MIT
// 改自 SmoothUI collapsible（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { ChevronDown } from 'lucide-react'
import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'

// 折叠单项：一个标题行加一块可收起的内容（成组的用 Accordion）。内容高度从 0 长出来（keyframes 在 theme/sui-motion.css，高度变量来自 Radix），
// 箭头在展开时翻过来。原件把收起的内容留在 DOM 里并标 inert；我们跟 Accordion 一样让 Radix 卸载它，效果相同，少一份常驻节点。
function Collapsible({ ...props }: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ className, children, ...props }: ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        'k-text-body flex min-h-9 w-full cursor-pointer items-center justify-between gap-4 rounded-[6px] py-2 text-left text-(color:--k-content-body-foreground)',
        'transition-colors duration-150 enabled:hover:text-(color:--k-content-primary-foreground) disabled:cursor-not-allowed disabled:opacity-45',
        '[&[data-state=open]]:text-(color:--k-content-primary-foreground) [&[data-state=open]>svg]:rotate-180',
        focusRingInset,
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none size-[13px] shrink-0 text-(color:--k-content-secondary-foreground) transition-transform duration-200"
      />
    </CollapsiblePrimitive.Trigger>
  )
}

function CollapsibleContent({ className, children, ...props }: ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content data-slot="collapsible-content" className="k-text-body overflow-hidden" {...props}>
      <div className={cn('pt-0 pb-3', className)}>{children}</div>
    </CollapsiblePrimitive.Content>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
