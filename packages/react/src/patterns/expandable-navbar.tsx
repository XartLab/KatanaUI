// SPDX-License-Identifier: MIT
// 改自 SmoothUI expandable-navbar（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { AnimatePresence, motion } from 'motion/react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 可展开导航条：一排入口，悬停或点击一个，条的下沿长出一块面板（高度用弹簧撑开）；在入口间移动时面板按方向横向交叉淡入，高度跟着内容变。
// 跟 NavigationMenu 的分工：NavigationMenu 是 Radix 的，面板浮在条外；这个面板长在条里面，把条撑高，适合「研究、策略、工具」这种带大块说明的顶栏。
// 面板高度用一份隐藏镜像先量好（不等交叉淡入走完），弹簧、滑动距离、缓动是原件的常量。Esc 收起、点外面收起、焦点移出收起，指针离开延迟 closeDelay 收起。

/** 原件：高度弹簧 bounce 0.08 · 0.3s，面板横移 16px，交叉淡入 0.2s 缓动 easeInOutCubic。 */
const HEIGHT_SPRING = { type: 'spring' as const, bounce: 0.08, duration: 0.3 }
const SLIDE = 16
const PANEL_TRANSITION = { duration: 0.2, ease: [0.645, 0.045, 0.355, 1] as [number, number, number, number] }

export type ExpandableNavbarItem = {
  id: string
  label: string
  /** What the panel shows under the bar. */
  panel: ReactNode
}

export type ExpandableNavbarProps = {
  /** The entries to show. */
  items: readonly ExpandableNavbarItem[]
  /** What screen readers call this navigation (required). */
  label: string
  /** Id of the open panel (controlled); null means closed. */
  openId?: string | null
  /** Called with the id of the open panel, or null when closed. */
  onOpenChange?: (id: string | null) => void
  /** Open on hover as well as click. */
  openOnHover?: boolean
  /** Wait this long in ms after the pointer leaves before closing. */
  closeDelay?: number
  /** Width in px, or any CSS width. */
  width?: number | string
  /** Extra classes for the root element. */
  className?: string
}

export function ExpandableNavbar({
  items,
  label,
  openId: controlled,
  onOpenChange,
  openOnHover = true,
  closeDelay = 200,
  width = 640,
  className,
}: ExpandableNavbarProps) {
  const uid = useId()
  const nav = useRef<HTMLElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const visible = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevIndex = useRef(-1)
  // 点击钉住的入口：悬停打开后再点同一个入口不该把它关掉，只有已经钉住的再点才收起。
  const pinned = useRef<string | null>(null)
  const [inner, setInner] = useState<string | null>(null)
  const [height, setHeight] = useState<number | 'auto'>(0)
  const [direction, setDirection] = useState(1)
  const openId = controlled === undefined ? inner : controlled
  const index = items.findIndex((item) => item.id === openId)
  const active = index >= 0 ? items[index]! : null

  const setOpen = useCallback(
    (id: string | null) => {
      if (id === null) pinned.current = null
      setInner(id)
      onOpenChange?.(id)
    },
    [onOpenChange],
  )
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])
  useEffect(() => clear, [clear])

  useEffect(() => {
    if (index < 0) return
    if (prevIndex.current >= 0) setDirection(index > prevIndex.current ? 1 : -1)
    prevIndex.current = index
  }, [index])

  useLayoutEffect(() => {
    const target = mirror.current
    if (!target) return
    const next = active ? target.scrollHeight : 0
    setHeight((prev) => {
      if (prev === 'auto' && visible.current) {
        // 从 auto 起弹簧：先把当前高度钉成数字，下一帧再换成目标。
        const now = visible.current.getBoundingClientRect().height
        requestAnimationFrame(() => setHeight(next))
        return now
      }
      return next
    })
  }, [active])

  useEffect(() => {
    if (!openId) return
    const onDown = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpen(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [openId, setOpen])

  const enter = (id: string) => {
    if (!openOnHover) return
    clear()
    setOpen(id)
  }

  return (
    <nav
      ref={nav}
      aria-label={label}
      data-slot="expandable-navbar"
      onPointerLeave={() => {
        if (!openOnHover) return
        clear()
        timer.current = setTimeout(() => setOpen(null), closeDelay)
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape' && openId !== null) {
          event.preventDefault()
          setOpen(null)
        }
      }}
      onBlurCapture={(event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget as Node | null
        if (!(next && nav.current?.contains(next))) setOpen(null)
      }}
      className={cn(
        'relative rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)]',
        className,
      )}
      style={{ width }}
    >
      <ul className="m-0 flex list-none items-center gap-1 p-1.5">
        {items.map((item) => {
          const open = item.id === openId
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-controls={`${uid}-${item.id}`}
                aria-expanded={open}
                onClick={() => {
                  clear()
                  if (open && pinned.current === item.id) return setOpen(null)
                  pinned.current = item.id
                  setOpen(item.id)
                }}
                onFocus={() => enter(item.id)}
                onPointerEnter={() => enter(item.id)}
                className={cn(
                  'k-text-data cursor-pointer rounded-[var(--radius-control)] px-3 py-1.5 transition-colors duration-100',
                  open ? 'bg-alpha-white-8 text-ink' : 'text-ink-3 hover:text-ink',
                  focusRing,
                )}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
      {/* 隐藏镜像：先量目标面板的高度，不等交叉淡入走完。 */}
      <div ref={mirror} aria-hidden="true" inert className="pointer-events-none invisible absolute inset-x-0 top-0">
        <div className="p-4">{active?.panel}</div>
      </div>
      <motion.div
        initial={false}
        animate={{ height }}
        transition={HEIGHT_SPRING}
        onAnimationComplete={() => {
          if (active) setHeight('auto')
        }}
        className="overflow-hidden"
      >
        <div ref={visible} className="relative">
          <AnimatePresence custom={direction} initial={false} mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                id={`${uid}-${active.id}`}
                role="region"
                aria-label={active.label}
                initial={{ opacity: 0, x: direction * SLIDE }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -SLIDE }}
                transition={PANEL_TRANSITION}
              >
                <div className="k-text-body p-4 text-ink-2">{active.panel}</div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </nav>
  )
}
