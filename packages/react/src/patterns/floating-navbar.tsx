// SPDX-License-Identifier: MIT
// 改自 SmoothUI floating-navbar（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useId, useState, type ReactNode, type RefObject } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'

// 悬浮导航条：一条胶囊浮在内容上，当前项底下一块底块用 layoutId 滑到点中的项；往下滚时条整体淡出上移让路，往回滚立即出来，滚过 120px 后收紧内边距。
// 用在研究报告、长文档页的页内跳转；整个应用的导航用 SideNav。滚动容器由 containerRef 指定（不传就是窗口）。
// 隐藏的缓动与阈值是原件的常量；底块弹簧换成 snappy。读屏名 label 必填。

/** 原件：往下滚超过 24px 才开始隐藏，120px 后收紧，隐藏时位移 16px，缓动 easeInOutCubic。 */
const SCROLL_THRESHOLD = 24
const SHRINK_DISTANCE = 120
const HIDE_DISTANCE = 16
const HIDE_TRANSITION = { duration: 0.25, ease: [0.645, 0.045, 0.355, 1] as [number, number, number, number] }

export type FloatingNavbarItem = {
  id: string
  label: string
  icon?: ReactNode
  href?: string
  onSelect?: () => void
}

export type FloatingNavbarProps = {
  /** The entries to show. */
  items: readonly FloatingNavbarItem[]
  /** What screen readers call this navigation (required). */
  label: string
  /** Id of the active item (controlled). */
  activeId?: string
  /** Called with the id the user picked. */
  onActiveChange?: (id: string) => void
  /** Content at the left end. */
  logo?: ReactNode
  /** Content at the right end. */
  actions?: ReactNode
  /** Slide away while scrolling down. */
  hideOnScroll?: boolean
  /** Where the bar sits. */
  position?: 'top' | 'bottom'
  /** The scrolling element; leave it out for the window. */
  containerRef?: RefObject<HTMLElement | null>
  /** Extra classes for the root element. */
  className?: string
}

export function FloatingNavbar({
  items,
  label,
  activeId: controlled,
  onActiveChange,
  logo,
  actions,
  hideOnScroll = true,
  position = 'top',
  containerRef,
  className,
}: FloatingNavbarProps) {
  const pill = `floating-navbar-pill-${useId()}`
  const [inner, setInner] = useState(items[0]?.id ?? '')
  const [hidden, setHidden] = useState(false)
  const [shrunk, setShrunk] = useState(false)
  const activeId = controlled ?? inner
  const { scrollY } = useScroll(containerRef ? { container: containerRef as RefObject<HTMLElement> } : undefined)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const delta = latest - (scrollY.getPrevious() ?? latest)
    setShrunk(latest > SHRINK_DISTANCE)
    if (!hideOnScroll || latest < SCROLL_THRESHOLD) return setHidden(false)
    if (delta > 0) setHidden(true)
    else if (delta < 0) setHidden(false)
  })

  const select = (item: FloatingNavbarItem) => {
    setInner(item.id)
    onActiveChange?.(item.id)
    item.onSelect?.()
  }
  const hideOffset = position === 'top' ? -HIDE_DISTANCE : HIDE_DISTANCE

  return (
    <motion.nav
      aria-label={label}
      data-slot="floating-navbar"
      data-hidden={hidden ? '' : undefined}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? hideOffset : 0 }}
      transition={HIDE_TRANSITION}
      style={hidden ? { pointerEvents: 'none' } : undefined}
      className={cn(
        'absolute inset-x-0 z-50 mx-auto flex w-fit items-center gap-1 rounded-[var(--radius-pill)] border border-alpha-white-8 bg-surface-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[padding] duration-200',
        position === 'top' ? 'top-4' : 'bottom-4',
        shrunk ? 'px-1.5 py-1' : 'px-2 py-1.5',
        className,
      )}
    >
      {logo ? <div className="flex shrink-0 items-center px-1">{logo}</div> : null}
      <ul className="m-0 flex list-none items-center gap-1 p-0">
        {items.map((item) => {
          const active = item.id === activeId
          const cls = cn(
            'k-text-data relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 whitespace-nowrap no-underline transition-colors duration-100',
            active ? 'text-ink' : 'text-ink-3 hover:text-ink',
            focusRing,
          )
          const content = (
            <>
              {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
              {item.label}
            </>
          )
          return (
            <li key={item.id} className="relative">
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cls}
                  onClick={() => select(item)}
                >
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  className={cls}
                  onClick={() => select(item)}
                >
                  {content}
                </button>
              )}
              {active ? (
                <motion.span
                  layoutId={pill}
                  transition={{ ...snappy, restDelta: 0.001 }}
                  className="absolute inset-0 rounded-[var(--radius-pill)] bg-alpha-white-8"
                />
              ) : null}
            </li>
          )
        })}
      </ul>
      {actions ? <div className="flex shrink-0 items-center gap-1 pl-1">{actions}</div> : null}
    </motion.nav>
  )
}
