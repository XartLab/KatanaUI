// SPDX-License-Identifier: MIT
// 改自 SmoothUI breadcrumb（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'

// 面包屑：路径一节一节从左侧轻滑进来（原件的 stagger，弹簧换成我们的 snappy token）；最后一节是当前页，不是链接。
// 读屏名 label 必填，包里不带文字。

/** 原件的错开间隔：每一节比前一节晚 40ms（SmoothUI breadcrumb 的 staggerDelay）。 */
const STAGGER_S = 0.04

export type BreadcrumbItem = {
  /** What is shown for this step. */
  label: ReactNode
  /** Where it links to; leave it out for the current page (the last step). */
  href?: string
}

export type BreadcrumbProps = {
  /** Steps from the root to the current page; the last one is the current page. */
  items: readonly BreadcrumbItem[]
  /** What screen readers call this navigation (required). */
  label: string
  /** Replaces the chevron between steps. */
  separator?: ReactNode
  /** Extra classes for the root element. */
  className?: string
}

export function Breadcrumb({ items, label, separator, className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} data-slot="breadcrumb" className={cn('inline-flex', className)}>
      <ol className="k-text-data m-0 flex list-none flex-wrap items-center gap-1 p-0 text-(color:--k-content-secondary-foreground)">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <motion.li
              key={index}
              className="inline-flex items-center gap-1"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...snappy, delay: index * STAGGER_S }}
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="inline-flex text-(color:--k-content-secondary-foreground) [&>svg]:size-[13px]"
                >
                  {separator ?? <ChevronRight />}
                </span>
              ) : null}
              {last ? (
                <span aria-current="page" className="text-(color:--k-content-primary-foreground)">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className={cn(
                    'rounded-[var(--radius-sm)] text-(color:--k-content-secondary-foreground) no-underline transition-colors duration-150 hover:text-(color:--k-content-primary-foreground)',
                    focusRing,
                  )}
                >
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </motion.li>
          )
        })}
      </ol>
    </nav>
  )
}
