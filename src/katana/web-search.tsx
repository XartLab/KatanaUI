// SPDX-License-Identifier: AGPL-3.0-only
// 联网检索的来源：一枚药丸（地球图标带进度环、状态文字、叠起来的来源小标、箭头）点开展开一排来源卡片；回答正文里用行内引用小标，悬停或键盘聚焦弹出那条来源的预览。
// 用于 Agent 回答的来源展示。交互学自 rare-ui 的 web-search（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 检索中图标外有一圈进度环，每来一条结果补上剩下的 30%，所以先快后慢、不会自己走满，检索完才满，满了再淡出；
// ② 状态文字换时上下滑着换，药丸宽度弹簧伸缩，检索中的文字带流光；③ 药丸右侧是最多四个叠起的来源小标，悬停时摊开；
// ④ 展开的区是一排卡片，检索中没到的位置画空骨架占着，来一条补一条、逐张错开入场；⑤ 第四条起，最后一格换成「还有 N 条」，点了展开全部、再多一格「收起」；
// ⑥ 行内引用悬停停 300ms 才开、离开 150ms 才收，键盘聚焦立即开，鼠标点击不因聚焦而开（点击本来就要去链接）。
// 我们的不同：不存也不开任何 URL（决策记录 0011），来源只有站名、标题、摘要；来源小标是站名首字母的方块，不去取网站图标（不发网络请求）；
// 给了 onOpen 卡片才可点。文字全由调用方传。
import { AnimatePresence, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'
import { useHoverIntent } from '../lib/hover-intent'
import { snappy } from '../lib/motion'
import { unit } from '../lib/spring'

export type WebSource = {
  id: string
  /** 站名，如 Reuters。 */
  site: string
  title: string
  snippet?: string
}

export type WebSearchStatus = 'searching' | 'done'

/** 来源小标上的字：站名第一个字符，大写；空的写「·」。 */
export function siteInitial(site: string): string {
  const first = Array.from(site.trim())[0]
  return first ? first.toUpperCase() : '·'
}

const RING_STEP = 0.3
const RING_START = 0.08
const COLUMNS = 4
export const STACK_MAX = 4

/** 检索中的进度环：没来结果是 8%，每来一条补上剩下的 30%（1 - 0.7^n），所以永远不会自己走满。 */
export function searchProgress(count: number): number {
  return count <= 0 ? RING_START : 1 - (1 - RING_STEP) ** count
}

function SiteTile({ site, size = 16 }: { site: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      data-slot="web-search-tile"
      className="k-text-micro grid flex-none place-items-center rounded-[4px] border border-line bg-surface-4 text-ink-2"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      {siteInitial(site)}
    </span>
  )
}

function Globe({ searching, ring }: { searching: boolean; ring: number }) {
  return (
    <span className="relative grid size-7 flex-none place-items-center text-ink-3" data-slot="web-search-globe">
      <svg aria-hidden="true" viewBox="0 0 28 28" className="absolute inset-0 size-7 -rotate-90" fill="none">
        <circle cx={14} cy={14} r={12.5} stroke="var(--line-200)" strokeWidth={1.5} />
        <motion.circle
          data-slot="web-search-ring"
          cx={14}
          cy={14}
          r={12.5}
          stroke="var(--signal-orange)"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: ring, opacity: searching ? 1 : 0 }}
          // 满了再淡出：淡出晚一拍，让人看见环合上。
          transition={{ pathLength: unit(snappy), opacity: { ...unit(snappy), delay: searching ? 0 : 0.35 } }}
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-[15px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      >
        <circle cx={12} cy={12} r={9} />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </svg>
    </span>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 flex-none text-ink-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{ rotate: open ? 180 : 0 }}
      transition={unit(snappy)}
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  )
}

function SourceCard({ source, onOpen }: { source: WebSource; onOpen?: (source: WebSource) => void }) {
  const body = (
    <>
      <span className="flex items-center gap-1.5">
        <SiteTile site={source.site} />
        <span className="k-text-caption min-w-0 truncate text-ink-3">{source.site}</span>
      </span>
      <span className="k-text-data mt-1.5 line-clamp-2 text-left text-ink">{source.title}</span>
    </>
  )
  const base =
    'flex h-[76px] w-full flex-col rounded-[var(--radius-control)] border border-line bg-surface-2 p-2.5 text-left transition-colors duration-[120ms]'
  return onOpen ? (
    <button
      type="button"
      data-slot="web-search-source"
      onClick={() => onOpen(source)}
      className={cn(base, 'cursor-pointer hover:border-ink-4 hover:bg-surface-3', focusRing)}
    >
      {body}
    </button>
  ) : (
    <div data-slot="web-search-source" className={base}>
      {body}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      data-slot="web-search-skeleton"
      className="flex h-[76px] w-full flex-col gap-2 rounded-[var(--radius-control)] border border-line bg-surface-1 p-2.5"
    >
      <span className="h-3 w-1/2 rounded-full bg-surface-4" />
      <span className="h-3 w-5/6 rounded-full bg-surface-3" />
    </div>
  )
}

export type WebSearchProps = {
  sources: readonly WebSource[]
  status?: WebSearchStatus
  /** 药丸里的状态文字（必填），如「检索中」「已检索 3 个站点」；状态或数量变了就换这个字符串。 */
  label: string
  /** 进度环（0 到 1）；不给按来源条数算。 */
  progress?: number
  /** 「还有 N 条」卡片的文字与「收起」卡片的文字。 */
  moreLabel: (count: number) => string
  lessLabel: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 给了，来源卡片才可点。 */
  onOpen?: (source: WebSource) => void
  className?: string
}

export function WebSearch({
  sources,
  status = 'done',
  label,
  progress,
  moreLabel,
  lessLabel,
  open,
  defaultOpen = true,
  onOpenChange,
  onOpen,
  className,
}: WebSearchProps) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen)
  const [expanded, setExpanded] = useState(false)
  const [spread, setSpread] = useState(false)
  const inner = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const searching = status === 'searching'
  const isOpen = open ?? innerOpen
  const count = sources.length
  const ring = Math.min(1, Math.max(0, progress ?? (searching ? searchProgress(count) : 1)))
  // 第四条起最后一格留给「还有 N 条」，所以卡片永远不用中途换成它。
  const overflow = !expanded && count >= COLUMNS
  const shown = overflow ? sources.slice(0, COLUMNS - 1) : sources
  const hidden = overflow ? count - (COLUMNS - 1) : 0
  const skeletons = searching && !overflow ? Math.max(0, COLUMNS - count) : 0
  const toggle = () => {
    if (open === undefined) setInnerOpen(!isOpen)
    onOpenChange?.(!isOpen)
  }
  const cell = (key: string, index: number, child: ReactNode) => (
    <motion.li
      key={key}
      layout="position"
      className="m-0 list-none p-0"
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ ...unit(snappy), delay: Math.min(index, COLUMNS) * 0.04 }}
    >
      {child}
    </motion.li>
  )
  const moreCard =
    'k-text-caption flex h-[76px] w-full cursor-pointer items-center justify-center gap-1 rounded-[var(--radius-control)] border border-dashed border-line text-ink-3 transition-colors duration-[120ms] hover:border-ink-4 hover:text-ink'

  return (
    <div
      data-slot="web-search"
      data-status={status}
      data-open={isOpen || undefined}
      className={cn('flex w-full max-w-xl flex-col', className)}
    >
      <button
        type="button"
        data-slot="web-search-trigger"
        aria-expanded={isOpen}
        onClick={toggle}
        className={cn(
          'flex h-9 w-fit max-w-full cursor-pointer items-center gap-2 rounded-full border border-line bg-surface-3 pr-3 pl-1 text-left',
          'transition-colors duration-[120ms] hover:bg-surface-4',
          focusRing,
        )}
      >
        <Globe searching={searching} ring={ring} />
        <motion.span
          aria-live="polite"
          className="relative min-w-0 overflow-x-clip"
          initial={false}
          animate={width === null ? undefined : { width }}
          transition={snappy}
        >
          <span ref={inner} className="inline-grid w-max whitespace-nowrap">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={label}
                data-slot="web-search-label"
                className={cn('k-text-data font-semibold', searching ? 'k-ai-shimmer' : 'text-ink')}
                initial={{ y: 7, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -7, opacity: 0 }}
                transition={unit(snappy)}
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.span>
        <span
          data-slot="web-search-stack"
          aria-hidden="true"
          className="flex items-center"
          onPointerEnter={() => setSpread(true)}
          onPointerLeave={() => setSpread(false)}
        >
          <AnimatePresence initial={false}>
            {sources.slice(0, STACK_MAX).map((source, index) => (
              <motion.span
                key={source.id}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, marginLeft: index === 0 ? 0 : spread ? 3 : -5 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={unit(snappy)}
                className="flex"
                style={{ zIndex: STACK_MAX - index }}
              >
                <SiteTile site={source.site} size={18} />
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
        <Chevron open={isOpen} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (count > 0 || searching) ? (
          <motion.div
            key="sources"
            data-slot="web-search-collapse"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={unit(snappy)}
          >
            <ol
              data-slot="web-search-sources"
              className="m-0 grid gap-2 p-0 pt-2.5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', listStyle: 'none' }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {shown.map((source, index) => cell(source.id, index, <SourceCard source={source} onOpen={onOpen} />))}
                {Array.from({ length: skeletons }, (_, index) =>
                  cell(`skeleton-${count + index}`, count + index, <SkeletonCard />),
                )}
                {hidden > 0
                  ? cell(
                      'more',
                      COLUMNS - 1,
                      <button
                        type="button"
                        data-slot="web-search-more"
                        onClick={() => setExpanded(true)}
                        className={cn(moreCard, focusRing)}
                      >
                        {moreLabel(hidden)}
                      </button>,
                    )
                  : null}
                {expanded && count >= COLUMNS
                  ? cell(
                      'less',
                      count,
                      <button
                        type="button"
                        data-slot="web-search-less"
                        onClick={() => setExpanded(false)}
                        className={cn(moreCard, focusRing)}
                      >
                        {lessLabel}
                      </button>,
                    )
                  : null}
              </AnimatePresence>
            </ol>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export type WebSearchCitationProps = {
  source: WebSource
  /** 行内的序号（1 起）。 */
  index?: number
  className?: string
}

/** 回答正文里的行内引用：小标加站名；悬停停一会儿或键盘聚焦弹出预览（站名、标题、摘要）。 */
export function WebSearchCitation({ source, index, className }: WebSearchCitationProps) {
  const { active, set, hover } = useHoverIntent()
  return (
    <span
      data-slot="web-search-citation"
      className={cn('relative inline-flex align-baseline', className)}
      {...hover}
      // 只有键盘聚焦才立即开：鼠标点上去由悬停管。
      onFocus={(event) => event.target.matches(':focus-visible') && set(true, 0)}
      onBlur={() => set(false, 0)}
    >
      <button
        type="button"
        data-slot="web-search-chip"
        aria-expanded={active}
        className={cn(
          'k-text-caption inline-flex h-5 cursor-default items-center gap-1 rounded-full border border-line bg-surface-3 pr-2 pl-0.5 text-ink-3',
          'transition-colors duration-[120ms] hover:bg-surface-4 hover:text-ink',
          active && 'bg-surface-4 text-ink',
          focusRing,
        )}
      >
        <SiteTile site={source.site} size={14} />
        <span className="max-w-32 truncate">{source.site}</span>
        {index === undefined ? null : <span className="tabular-nums opacity-60">{index}</span>}
      </button>
      <AnimatePresence>
        {active ? (
          // 内边距把弹层与小标之间的缝补上，指针从小标走到弹层不会掉出悬停区。
          <motion.span
            role="tooltip"
            data-slot="web-search-preview"
            className="absolute bottom-full left-1/2 z-50 block w-64 pb-2 whitespace-normal"
            style={{ x: '-50%', originY: 1 }}
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={unit(snappy)}
          >
            <span className="block rounded-[var(--radius-overlay)] border border-white/7 bg-surface-4 p-3 text-left shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)]">
              <span className="flex items-center gap-1.5">
                <SiteTile site={source.site} size={18} />
                <span className="k-text-caption truncate text-ink-3">{source.site}</span>
              </span>
              <span className="k-text-data mt-1.5 line-clamp-2 block text-ink">{source.title}</span>
              {source.snippet ? (
                <span className="k-text-caption mt-1 line-clamp-3 block text-ink-3">{source.snippet}</span>
              ) : null}
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
