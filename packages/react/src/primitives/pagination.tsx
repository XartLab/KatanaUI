// SPDX-License-Identifier: MIT
// 改自 SmoothUI pagination（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useMemo } from 'react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { Button } from './button.tsx'

// 分页：当前页的底块用 layoutId 在页码之间滑过去（原件的做法），页码进场错开 30ms；省略号的算法照原件（两端各一页 + 当前页两侧 siblings 页）。
// 所有文字（读屏名、上一页 / 下一页）由调用方传。

/** 原件的页码错开间隔（SmoothUI pagination 的 STAGGER_DELAY）。 */
const STAGGER_S = 0.03
const ELLIPSIS = 'ellipsis' as const
type PageItem = number | typeof ELLIPSIS

/** 页码列表：总页数不多就全列；否则首尾页常驻，当前页两侧各留 siblings 页，隔开的地方放省略号。导出给单测与自定义渲染。 */
export function buildPageRange(page: number, totalPages: number, siblings: number): PageItem[] {
  const totalSlots = siblings * 2 + 5
  if (totalPages <= totalSlots) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const left = Math.max(page - siblings, 2)
  const right = Math.min(page + siblings, totalPages - 1)
  const items: PageItem[] = [1]
  if (left > 2) items.push(ELLIPSIS)
  else for (let i = 2; i < left; i++) items.push(i)
  for (let i = left; i <= right; i++) items.push(i)
  if (right < totalPages - 1) items.push(ELLIPSIS)
  else for (let i = right + 1; i < totalPages; i++) items.push(i)
  items.push(totalPages)
  return items
}

export type PaginationLabels = {
  /** What screen readers call this navigation. */
  nav: string
  /** Visible text of the previous button (also its accessible name). */
  previous: string
  /** Visible text of the next button (also its accessible name). */
  next: string
  /** Accessible name of a page button, e.g. page 3 becomes "Go to page 3". */
  page: (page: number) => string
}

export type PaginationProps = {
  /** Current page, counting from 1. */
  page: number
  /** How many pages there are. */
  totalPages: number
  /** Called with the page the user picked. */
  onPageChange: (page: number) => void
  /** How many neighbours to keep on each side of the current page. */
  siblings?: number
  /** All visible and spoken text (required). */
  labels: PaginationLabels
  /** Extra classes for the root element. */
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, siblings = 1, labels, className }: PaginationProps) {
  const layoutId = `pagination-active-${useId()}`
  const items = useMemo(() => buildPageRange(page, totalPages, siblings), [page, totalPages, siblings])
  return (
    <nav aria-label={labels.nav} data-slot="pagination" className={cn('flex justify-center', className)}>
      <ul className="m-0 flex list-none items-center gap-1 p-0">
        <li>
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft />
            {labels.previous}
          </Button>
        </li>
        {items.map((item, index) =>
          item === ELLIPSIS ? (
            <li
              key={`e${index}`}
              aria-hidden="true"
              className="k-text-data flex size-7 items-center justify-center text-(color:--k-content-tertiary-foreground)"
            >
              …
            </li>
          ) : (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...snappy, delay: index * STAGGER_S }}
            >
              <Button
                size="icon"
                variant="ghost"
                aria-current={item === page ? 'page' : undefined}
                aria-label={labels.page(item)}
                onClick={() => onPageChange(item)}
                className={cn(
                  'relative tabular-nums',
                  item === page
                    ? 'text-(color:--k-content-primary-foreground)'
                    : 'text-(color:--k-content-secondary-foreground)',
                )}
              >
                {item === page ? (
                  <motion.span
                    layoutId={layoutId}
                    transition={{ ...snappy, restDelta: 0.001 }}
                    className="absolute inset-0 rounded-[var(--radius-control)] border border-(color:--k-selectable-borderColor-selected) bg-(--k-selectable-subtle-background-selected)"
                  />
                ) : null}
                <span className="relative">{item}</span>
              </Button>
            </motion.li>
          ),
        )}
        <li>
          <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            {labels.next}
            <ChevronRight />
          </Button>
        </li>
      </ul>
    </nav>
  )
}
