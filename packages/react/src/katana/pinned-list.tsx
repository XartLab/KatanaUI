// SPDX-License-Identifier: MIT
// 改自 SmoothUI pinned-list（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 可置顶的列表（自选股、常用面板）：点一行把它钉到最上面，钉住的行落下时轻压一下，下面的行依次补位；再点取消。
// 键盘：方向键在行间走（漫游 tabindex，只有一行可 Tab 进入），Home / End 到头尾，Enter、空格或 P 切换置顶。
// 与原件的差别：原件的中英文案（读屏名、空态）改成 labels 由调用方给；样式换成 token（钉住的行用 --bg-300 抬起，左侧 3px 强调条用 --accent）。
import { Pin } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 弹簧参数来自 SmoothUI pinned-list：新行进出 0.25 秒；钉住时那一行「发射」到钉区用 0.4 秒；图钉自己 0.2 秒，都是 bounce 0.1。
const ENTER_SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const LAUNCH_SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.4 }
const PIN_SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.2 }
const EXIT_TRANSITION = { duration: 0.15, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
// 补位的行依次落定，不是一整块动：每行晚 0.025 秒，最多 0.1 秒。
const STAGGER_STEP = 0.025
const MAX_STAGGER = 0.1
// 落地的压一下：关键帧都不超过 1（超过 1 会被外层滚动容器切掉），两次衰减。
const POP_SCALE = [1, 0.985, 0.997, 1]
const POP_TIMES = [0, 0.3, 0.62, 1]
const POP_DURATION = 0.34
const POP_RESET_MS = 420
const PINNED_ROTATION = 45
const DEFAULT_MAX_PINNED = 5

export type PinnedListItem = {
  id: string
  /** Main text of the row. */
  title: string
  /** Second line, for example the latest price. */
  meta?: string
  icon?: ReactNode
  /** Starts pinned (uncontrolled use). */
  pinned?: boolean
}

export type PinnedListLabels = {
  /** Accessible name of the list. */
  list: string
  /** Name of a row that can be pinned, for example "Pin Moutai". */
  pin: (title: string) => string
  /** Name of a pinned row, for example "Unpin Moutai". */
  unpin: (title: string) => string
  /** Shown in the pinned area while nothing is pinned. */
  emptyPinned: string
}

export type PinnedListProps = {
  /** Every row, pinned or not; the list puts the pinned ones first. */
  items: readonly PinnedListItem[]
  /** All the text the list needs; the package ships none. */
  labels: PinnedListLabels
  /** Pinned ids (controlled); omit to let the list keep its own. */
  pinnedIds?: readonly string[]
  /** Called with the new pinned ids after a pin or unpin. */
  onPinnedChange?: (ids: string[]) => void
  /** How many rows can be pinned; the others stay disabled once reached. */
  maxPinned?: number
  /** Draw a hairline between the pinned and the other rows. */
  showDivider?: boolean
  /** Draw a row yourself; the pin button and the accent rail stay. */
  renderItem?: (item: PinnedListItem, pinned: boolean) => ReactNode
  /** Extra class name on the root. */
  className?: string
}

function Row({
  item,
  pinned,
  groupIndex,
  rowIndex,
  focused,
  just,
  disabled,
  labels,
  renderItem,
  onToggle,
  onKey,
  register,
}: {
  item: PinnedListItem
  pinned: boolean
  groupIndex: number
  rowIndex: number
  focused: boolean
  just: boolean
  disabled: boolean
  labels: PinnedListLabels
  renderItem?: PinnedListProps['renderItem']
  onToggle: (id: string) => void
  onKey: (event: KeyboardEvent<HTMLDivElement>, index: number) => void
  register: (id: string, element: HTMLDivElement | null) => void
}) {
  // 刚操作的那一行先动，补位的行跟在后面。
  const layoutDelay = pinned ? 0 : Math.min(groupIndex * STAGGER_STEP, MAX_STAGGER)
  return (
    <motion.li
      layout="position"
      data-slot="pinned-list-item"
      data-pinned={pinned || undefined}
      className="list-none"
      transition={{ default: ENTER_SPRING, layout: { ...LAUNCH_SPRING, delay: layoutDelay } }}
    >
      <motion.div
        ref={(element) => register(item.id, element)}
        role="button"
        tabIndex={focused ? 0 : -1}
        aria-pressed={pinned}
        aria-disabled={disabled || undefined}
        aria-label={pinned ? labels.unpin(item.title) : labels.pin(item.title)}
        initial={false}
        animate={{ scale: just ? POP_SCALE : 1 }}
        transition={{ duration: POP_DURATION, ease: [0.23, 1, 0.32, 1], times: POP_TIMES }}
        onClick={() => {
          if (!disabled) onToggle(item.id)
        }}
        onKeyDown={(event) => onKey(event, rowIndex)}
        className={cn(
          'group relative flex items-center gap-(--space-3) rounded-[var(--radius-control)] border p-(--space-3) transition-colors duration-[var(--dur-snappy)]',
          focusRing,
          pinned ? 'border-line-strong bg-surface-3' : 'border-line bg-transparent',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-line-strong',
        )}
      >
        {/* 钉住时左侧长出一条强调条：状态变化是结构上的，不是整块底色冒出来。 */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ opacity: pinned ? 1 : 0, scaleY: pinned ? 1 : 0.2 }}
          transition={PIN_SPRING}
          className="absolute top-1/2 left-0 h-5 w-[3px] rounded-r-full bg-(--accent)"
          style={{ y: '-50%' }}
        />
        <div className="min-w-0 flex-1">
          {renderItem ? (
            renderItem(item, pinned)
          ) : (
            <div className="flex items-center gap-(--space-2)">
              {item.icon && (
                <span aria-hidden="true" className={cn('shrink-0', pinned ? 'text-ink' : 'text-ink-3')}>
                  {item.icon}
                </span>
              )}
              <div className="min-w-0">
                <p className="k-text-data m-0 truncate text-ink">{item.title}</p>
                {item.meta && <p className="k-text-caption m-0 truncate text-ink-3 tabular-nums">{item.meta}</p>}
              </div>
            </div>
          )}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--dur-snappy)]',
            pinned ? 'text-(--accent)' : 'text-ink-3 group-hover:bg-alpha-white-4 group-hover:text-ink',
          )}
        >
          <motion.span
            initial={false}
            animate={{ rotate: pinned ? PINNED_ROTATION : 0 }}
            transition={PIN_SPRING}
            className="flex items-center justify-center"
          >
            <Pin className={cn('size-4', pinned && 'fill-current')} />
          </motion.span>
        </span>
      </motion.div>
    </motion.li>
  )
}

export function PinnedList({
  items,
  labels,
  pinnedIds,
  onPinnedChange,
  maxPinned = DEFAULT_MAX_PINNED,
  showDivider = true,
  renderItem,
  className,
}: PinnedListProps) {
  const [own, setOwn] = useState<string[]>(() => items.filter((item) => item.pinned).map((item) => item.id))
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [justId, setJustId] = useState<string | null>(null)
  const rows = useRef(new Map<string, HTMLDivElement>())
  // 行在两组之间移动会被重新插入 DOM，焦点会丢；记下要把焦点还给哪一行。
  const restore = useRef<string | null>(null)
  const pinned = pinnedIds ?? own
  useEffect(() => {
    if (!justId) return
    const timer = setTimeout(() => setJustId(null), POP_RESET_MS)
    return () => clearTimeout(timer)
  }, [justId])
  const pinnedItems = useMemo(() => items.filter((item) => pinned.includes(item.id)), [items, pinned])
  const otherItems = useMemo(() => items.filter((item) => !pinned.includes(item.id)), [items, pinned])
  const ordered = useMemo(() => [...pinnedItems, ...otherItems], [pinnedItems, otherItems])
  // 同一时刻只有一行可 Tab 进入，而且一定是存在的那一行。
  const active = focusedId && ordered.some((item) => item.id === focusedId) ? focusedId : (ordered[0]?.id ?? null)
  const register = (id: string, element: HTMLDivElement | null) => {
    if (element) rows.current.set(id, element)
    else rows.current.delete(id)
  }
  const commit = (next: string[]) => {
    setOwn(next)
    onPinnedChange?.(next)
  }
  const toggle = (id: string) => {
    if (rows.current.get(id) === document.activeElement) restore.current = id
    setFocusedId(id)
    if (pinned.includes(id)) {
      setJustId(null)
      commit(pinned.filter((one) => one !== id))
      return
    }
    if (pinned.length >= maxPinned) return
    setJustId(id)
    commit([...pinned, id])
  }
  useEffect(() => {
    const id = restore.current
    if (!id) return
    restore.current = null
    rows.current.get(id)?.focus()
  })
  const focusAt = (index: number) => {
    const total = ordered.length
    if (total === 0) return
    const target = ordered[((index % total) + total) % total]!
    setFocusedId(target.id)
    rows.current.get(target.id)?.focus()
  }
  const onKey = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => focusAt(index + 1),
      ArrowRight: () => focusAt(index + 1),
      ArrowUp: () => focusAt(index - 1),
      ArrowLeft: () => focusAt(index - 1),
      Home: () => focusAt(0),
      End: () => focusAt(ordered.length - 1),
      Enter: () => ordered[index] && toggle(ordered[index].id),
      ' ': () => ordered[index] && toggle(ordered[index].id),
      p: () => ordered[index] && toggle(ordered[index].id),
      P: () => ordered[index] && toggle(ordered[index].id),
    }
    const run = keys[event.key]
    if (!run) return
    event.preventDefault()
    run()
  }
  const full = pinned.length >= maxPinned
  return (
    <div className={cn('flex flex-col', className)} data-slot="pinned-list">
      {/* 一个 ul 而不是两个：钉住的行在同一个父级里换位，不是从一个列表拆下来再装进另一个。四周留 4px，让落地回弹与焦点环不被外层裁掉。 */}
      <ul aria-label={labels.list} className="m-0 flex list-none flex-col gap-(--space-2) p-1">
        <AnimatePresence initial={false} mode="popLayout">
          {pinnedItems.length === 0 && (
            <motion.li
              key="empty-pinned"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: EXIT_TRANSITION }}
              transition={ENTER_SPRING}
              className="k-text-caption list-none rounded-[var(--radius-control)] border border-dashed border-line-strong p-(--space-3) text-ink-3"
            >
              {labels.emptyPinned}
            </motion.li>
          )}
        </AnimatePresence>
        {pinnedItems.map((item, groupIndex) => (
          <Row
            key={item.id}
            item={item}
            pinned
            groupIndex={groupIndex}
            rowIndex={groupIndex}
            focused={active === item.id}
            just={justId === item.id}
            disabled={false}
            labels={labels}
            renderItem={renderItem}
            onToggle={toggle}
            onKey={onKey}
            register={register}
          />
        ))}
        {showDivider && pinnedItems.length > 0 && otherItems.length > 0 && (
          <li aria-hidden="true" className="my-1 list-none border-t border-line" />
        )}
        {otherItems.map((item, groupIndex) => (
          <Row
            key={item.id}
            item={item}
            pinned={false}
            groupIndex={groupIndex}
            rowIndex={pinnedItems.length + groupIndex}
            focused={active === item.id}
            just={false}
            disabled={full}
            labels={labels}
            renderItem={renderItem}
            onToggle={toggle}
            onKey={onKey}
            register={register}
          />
        ))}
      </ul>
    </div>
  )
}
