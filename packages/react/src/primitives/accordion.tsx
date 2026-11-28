// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import {
  Accordion as AccordionRoot,
  AccordionHeader,
  AccordionItem as AccordionEntry,
  AccordionPanel,
  AccordionTrigger as AccordionButton,
} from '@ui-sdk/react/accordion'
import { ChevronDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { legacyState, part } from '../lib/legacy-attrs.ts'
import { rovingKeys } from '../lib/roving-keys.ts'
import { focusRingInset } from '../lib/focus.ts'

// Radix 的各部件都带 data-orientation（手风琴只做竖排，恒为 vertical）。
const vertical = () => ({ 'data-orientation': 'vertical' })

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
        /** The open item's value (controlled). */
        value?: string
        /** The open item's value at first (uncontrolled). */
        defaultValue?: string
        /** Called with the open item's value; an empty string once it closes. */
        onValueChange?: (value: string) => void
        /** Lets the open item close itself. */
        collapsible?: boolean
      }
    | {
        /** Any number of items open. */
        type: 'multiple'
        /** The open items' values (controlled). */
        value?: string[]
        /** The open items' values at first (uncontrolled). */
        defaultValue?: string[]
        /** Called with the open items' values. */
        onValueChange?: (value: string[]) => void
        collapsible?: never
      }
  )

function Accordion({ type, value, defaultValue, onValueChange, collapsible, ...props }: AccordionProps) {
  const multiple = type === 'multiple'
  const list = (v: string | string[] | undefined) => (v === undefined ? undefined : Array.isArray(v) ? v : v ? [v] : [])
  return (
    <AccordionRoot
      render={part('div', { slot: 'accordion', extra: vertical })}
      multiple={multiple}
      collapsible={multiple ? undefined : collapsible}
      value={list(value)}
      defaultValue={list(defaultValue)}
      onValueChange={(next) =>
        (onValueChange as ((v: string | string[]) => void) | undefined)?.(multiple ? next : (next[0] ?? ''))
      }
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionEntry>) {
  return (
    <AccordionEntry
      render={part('div', { slot: 'accordion-item', state: legacyState.open, extra: vertical })}
      className={cn('border-b border-(color:--k-separable-tertiary-borderColor) last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  onKeyDown,
  ...props
}: Omit<ComponentProps<typeof AccordionButton>, 'children'> & {
  /** The heading's content. */
  children?: ReactNode
}) {
  return (
    <AccordionHeader render={part('h3', { state: legacyState.open, extra: vertical })} className="m-0 flex">
      <AccordionButton
        render={part('button', {
          slot: 'accordion-trigger',
          state: legacyState.open,
          nativeDisabled: true,
          extra: vertical,
        })}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          // 手风琴的标题之间：↑↓ 走、Home / End 到头尾、两头回绕、跳过禁用的（Radix 的做法，UI SDK 没有）。
          const root = event.currentTarget.closest<HTMLElement>('[data-slot="accordion"]')
          rovingKeys(root, event, {
            items: (el) =>
              [...el.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')].filter(
                (trigger) => trigger.closest('[data-slot="accordion"]') === el,
              ),
            axis: 'vertical',
            onlyWhenDisabled: false,
          })
        }}
        className={cn(
          'k-text-body flex min-h-9 flex-1 cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-control)] py-2 text-left text-(color:--k-content-body-foreground)',
          'transition-colors duration-150 enabled:hover:text-(color:--k-content-primary-foreground) disabled:cursor-not-allowed disabled:opacity-45',
          '[&[data-state=open]]:text-(color:--k-content-primary-foreground) [&[data-state=open]>svg]:rotate-180',
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
}: Omit<ComponentProps<typeof AccordionPanel>, 'children'> & {
  /** The panel's content. */
  children?: ReactNode
}) {
  return (
    <AccordionPanel
      render={part('div', { slot: 'accordion-content', state: legacyState.open, extra: vertical })}
      className="k-text-body overflow-hidden"
      {...props}
    >
      <div className={cn('pt-0 pb-3', className)}>{children}</div>
    </AccordionPanel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
