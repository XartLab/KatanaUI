// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Accordion as AccordionRoot, AccordionHeader, AccordionItem as AccordionEntry, AccordionPanel, AccordionTrigger as AccordionButton } from '@ui-sdk/react/accordion'
import { ChevronDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { slotName } from '../lib/slot-name.ts'
import { focusRingInset } from '../lib/focus.ts'

// 折叠：每项底下一道细线，标题行 36 高，箭头在展开时翻过来；内容的高度从 0 长到内容高度（过渡写在 theme/motion.css，高度变量来自 UI SDK 的 --accordion-panel-height）。
// 对外仍是 Radix 的写法：type="single" 的 value 是字符串、type="multiple" 的是字符串数组，single 要能收起自己得写 collapsible；这里换成 UI SDK 的数组值与 multiple。
type AccordionBase = Omit<
  ComponentProps<typeof AccordionRoot>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple' | 'collapsible'
>
type AccordionProps = AccordionBase &
  (
    | {
        /** One item open at a time. */
        type: 'single'
        value?: string
        defaultValue?: string
        onValueChange?: (value: string) => void
        /** Lets the open item close itself. */
        collapsible?: boolean
      }
    | {
        /** Any number of items open. */
        type: 'multiple'
        value?: string[]
        defaultValue?: string[]
        onValueChange?: (value: string[]) => void
        collapsible?: never
      }
  )

function Accordion({ type, value, defaultValue, onValueChange, collapsible, ...props }: AccordionProps) {
  const multiple = type === 'multiple'
  const list = (v: string | string[] | undefined) => (v === undefined ? undefined : Array.isArray(v) ? v : v ? [v] : [])
  return (
    <AccordionRoot
      data-slot="accordion"
      multiple={multiple}
      collapsible={multiple ? undefined : collapsible}
      value={list(value)}
      defaultValue={list(defaultValue)}
      onValueChange={(next) => (onValueChange as ((v: string | string[]) => void) | undefined)?.(multiple ? next : (next[0] ?? ''))}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionEntry>) {
  return (
    <AccordionEntry
      data-slot="accordion-item"
      className={cn('border-b border-(color:--k-separable-tertiary-borderColor) last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof AccordionButton>, 'children'> & { children?: ReactNode }) {
  return (
    <AccordionHeader className="m-0 flex">
      <AccordionButton
        data-slot="accordion-trigger"
        className={cn(
          'k-text-body flex min-h-9 flex-1 cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] py-2 text-left text-(color:--k-content-body-foreground)',
          'transition-colors duration-150 enabled:hover:text-(color:--k-content-primary-foreground) disabled:cursor-not-allowed disabled:opacity-45',
          'data-open:text-(color:--k-content-primary-foreground) data-open:[&>svg]:rotate-180',
          focusRingInset,
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-[13px] shrink-0 text-(color:--k-content-secondary-foreground) transition-transform duration-200" />
      </AccordionButton>
    </AccordionHeader>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof AccordionPanel>, 'children'> & { children?: ReactNode }) {
  return (
    <AccordionPanel render={slotName('accordion-content')} className="k-text-body overflow-hidden" {...props}>
      <div className={cn('pt-0 pb-3', className)}>{children}</div>
    </AccordionPanel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
