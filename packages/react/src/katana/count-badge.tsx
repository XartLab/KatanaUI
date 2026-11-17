// SPDX-License-Identifier: MIT
// 改自 SmoothUI count-badge（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 贴在任何元素角上的角标：点、数字、状态点三种；数字变了按增减方向上下滚，0 时淡出，超过上限写「99+」；可选一圈向外扩散的提示。
// 与已有件的分工：NotificationBell 是「铃 + 未读数」一个整件（带摆动与闪色），CountBadge 是通用的「贴在任何东西上」（头像、标签页、图标按钮）。
// 数字的文字规则复用铃的 badgeText；滚动用同一条弹簧（snappy），不另起参数。
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { badgeText } from './notification-bell.tsx'

export type CountBadgeStatus = 'online' | 'offline' | 'busy' | 'away'
export type CountBadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

// 状态点的颜色：上线、离线、忙、离开，对应信号绿、中性灰、信号红、信号琥珀。
const STATUS_COLOR: Record<CountBadgeStatus, string> = {
  online: 'var(--signal-green)',
  offline: 'var(--ink-400)',
  busy: 'var(--signal-red)',
  away: 'var(--signal-amber)',
}
const POSITION: Record<CountBadgePosition, string> = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
}
// 数字滚动的位移（像素）。
const ROLL = 10

function Count({ text, total }: { text: string; total: number }) {
  // 由 props 推导的状态，照 React 文档在渲染时调整。
  const [seen, setSeen] = useState(total)
  const [direction, setDirection] = useState(1)
  if (total !== seen) {
    setSeen(total)
    setDirection(total > seen ? 1 : -1)
  }
  return (
    <span className="relative inline-grid overflow-hidden leading-none">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          initial={{ y: direction * ROLL, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -ROLL, opacity: 0 }}
          transition={unit(snappy)}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export type CountBadgeProps = {
  /** The thing the badge sits on; omit to draw the badge alone. */
  children?: ReactNode
  /** dot is a plain dot, count shows the number, status shows a coloured dot. */
  variant?: 'dot' | 'count' | 'status'
  /** The number for the count variant; 0 hides the badge unless showZero. */
  count?: number
  /** Highest number written in full; above it the badge reads "<max>+". */
  max?: number
  /** Keep the badge on screen when the count is 0. */
  showZero?: boolean
  /** Which colour the status variant uses. */
  status?: CountBadgeStatus
  /** Send an expanding ring out of the badge to draw the eye. */
  ping?: boolean
  /** Which corner of the children the badge sits on. */
  position?: CountBadgePosition
  /**
   * Accessible name of the badge, for example "3 unread alerts"; required when the badge carries meaning.
   * 读屏名，要带数字（「3 条未读提醒」）；变了会播报。
   */
  label: string
  /** Extra class name on the badge. */
  className?: string
}

export function CountBadge({
  children,
  variant = 'dot',
  count = 0,
  max = 99,
  showZero = false,
  status = 'online',
  ping = false,
  position = 'top-right',
  label,
  className,
}: CountBadgeProps) {
  const text = variant === 'count' ? badgeText(count, max) || (showZero ? '0' : '') : ''
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  const visible = variant !== 'count' || text !== ''
  const color = variant === 'status' ? STATUS_COLOR[status] : 'var(--accent)'
  const size =
    variant === 'dot' ? 'size-2.5' : variant === 'status' ? 'size-3' : text.length <= 1 ? 'size-5' : 'h-5 min-w-5 px-1'
  return (
    <span className="relative inline-flex" data-slot="count-badge" data-count={variant === 'count' ? total : undefined}>
      {children ?? <span className="size-4" />}
      <AnimatePresence initial={false}>
        {visible && (
          <motion.span
            key="badge"
            role="status"
            aria-label={label}
            data-slot="count-badge-badge"
            data-variant={variant}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={unit(snappy)}
            className={cn(
              'k-text-micro absolute flex items-center justify-center rounded-full text-surface-0 tabular-nums',
              POSITION[position],
              size,
              variant === 'status' && 'ring-2 ring-(--bg-000)',
              className,
            )}
            style={{ backgroundColor: color }}
          >
            {variant === 'count' && <Count text={text} total={total} />}
            {ping && (
              <span
                aria-hidden="true"
                data-slot="count-badge-ping"
                className="k-ping pointer-events-none absolute inset-0 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
