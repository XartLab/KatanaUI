// SPDX-License-Identifier: MIT
// 带未读数的铃：顶栏或状态栏的提醒中心入口。未读变多时铃摆一下，角标弹出，数字滚到新值。
// 交互学自 rare-ui 的 notification-bell（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 铃从顶端悬挂，转轴在上不在中心；② 只有数变多才摆，变少、不变不摆，摆的力度跟增量走（封顶）；
// ③ 角标 0 时不画，有数时弹出，超过上限显示「99+」；④ 数字位变化时按增减方向滚；⑤ 铃的名字带未读数，数变了读屏要播报。
// 我们的取舍：包里的三条弹簧都是近临界阻尼（不过冲），所以「摆」做成给 settle 弹簧一个初速度：一个来回，不连续震荡。
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { settle, snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

/** 角标上的字：0 不画；超过上限写「<上限>+」。数不是有限的整数时当 0。 */
export function badgeText(count: number, max: number): string {
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  if (total === 0) return ''
  return total > max ? `${max}+` : String(total)
}

/** 摆动的初速度（度 / 秒）：增量越大越猛，封顶。settle 弹簧下，初速度 v 的最大摆幅约为 v 的 3%（700 → 约 20 度）。 */
export function swingImpulse(delta: number): number {
  return 420 + 70 * Math.min(Math.max(delta, 1), 5)
}

function BellIcon({ swing }: { swing: ReturnType<typeof useMotionValue<number>> }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-slot="notification-bell-icon"
      // 铃从顶端挂着，转轴在上方。
      style={{ rotate: swing, transformOrigin: '50% 12%' }}
    >
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </motion.svg>
  )
}

export type NotificationBellProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  /** Unread count; a non-finite number counts as 0. */
  count?: number
  /**
   * Highest number the badge shows; above it writes "<max>+".
   * 角标显示到几；超过写「<max>+」。
   */
  max?: number
  /**
   * count draws the number, dot draws only a dot.
   * count 画数字，dot 只画一个点（不要数的场合）。
   */
  variant?: 'count' | 'dot'
  /**
   * Accessible name (required); include the unread count, for example "Alerts, 3 unread", and change the string when the count changes.
   * 读屏名（必填），要带上未读数，如「提醒，3 条未读」：数变了就换这个字符串。
   */
  label: string
}

export function NotificationBell({
  count = 0,
  max = 99,
  variant = 'count',
  label,
  className,
  ...props
}: NotificationBellProps) {
  const text = badgeText(count, max)
  const total = text === '' ? 0 : Math.floor(count)
  const swing = useMotionValue(0)
  const previous = useRef(total)
  const side = useRef(1)
  // 数变多就摆：交替往左右两个方向踢，连着来几条时顺着正在摆的方向再推。
  useEffect(() => {
    const delta = total - previous.current
    previous.current = total
    if (delta <= 0) return
    const moving = swing.getVelocity()
    const direction = Math.abs(moving) > 1 ? Math.sign(moving) : side.current
    side.current = -direction
    const run = animate(swing, 0, { ...settle, velocity: direction * swingImpulse(delta) })
    return () => run.stop()
  }, [total, swing])
  return (
    <button
      type="button"
      data-slot="notification-bell"
      data-count={total}
      aria-label={label}
      className={cn(
        'relative inline-grid size-7 flex-none cursor-pointer place-items-center rounded-[var(--radius-control)] border-0 bg-transparent p-0 text-ink-3',
        'transition-[color,background-color] duration-[120ms] hover:bg-alpha-white-4 hover:text-ink [&_svg]:size-[15px]',
        focusRing,
        className,
      )}
      {...props}
    >
      <BellIcon swing={swing} />
      <AnimatePresence initial={false}>
        {total > 0 && (
          <motion.span
            key="badge"
            data-slot="notification-bell-badge"
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={unit(snappy)}
            className={cn(
              'pointer-events-none absolute top-0 right-0 grid place-items-center rounded-full bg-(--signal-orange) text-surface-0',
              variant === 'dot'
                ? 'size-2 translate-x-[2px] -translate-y-[1px]'
                : 'k-text-micro h-[14px] min-w-[14px] translate-x-[5px] -translate-y-[3px] overflow-hidden px-[3px] leading-none tracking-normal tabular-nums',
            )}
          >
            {variant === 'count' && <BadgeText text={text} total={total} />}
          </motion.span>
        )}
      </AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {total > 0 ? label : ''}
      </span>
    </button>
  )
}

/** 数字换了：增加时旧字往上滚出、新字从下进来，减少时反过来。 */
function BadgeText({ text, total }: { text: string; total: number }) {
  // 由 props 推导的状态，照 React 文档在渲染时调整。
  const [seen, setSeen] = useState(total)
  const [direction, setDirection] = useState(1)
  if (total !== seen) {
    setSeen(total)
    setDirection(total > seen ? 1 : -1)
  }
  return (
    <span className="relative inline-grid">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          data-slot="notification-bell-text"
          initial={{ y: direction * 9, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -9, opacity: 0 }}
          transition={unit(snappy)}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
