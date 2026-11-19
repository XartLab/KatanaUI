// SPDX-License-Identifier: MIT
// 改自 SmoothUI animated-avatar-group（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 重叠的品种徽标堆：板块成分、ETF 持仓、相关品种一行放得下；悬停时展开拉开，超出的折成「+n」。
// 与原件的差别：头像换成我们的 SymbolMark（有图用图，没图退回字母圆标）；只有鼠标能悬停的设备才展开（触屏不展开，与原件一致）；
// 外圈用 --bg-000 的描边把相邻两枚隔开；读屏名与每枚的名字由调用方给。
import { motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { SymbolMark } from '../quotes/symbol-mark.tsx'

// 弹簧参数来自 SmoothUI animated-avatar-group：bounce 0.1、0.25 秒；每枚晚 0.03 秒依次展开。
const SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const STAGGER = 0.03
// 展开时相邻两枚之间的缝（像素）。
const EXPANDED_GAP = 4
const EXPANDED_SCALE = 1.05

export type AnimatedAvatarGroupItem = {
  /** Symbol code, also the letters when there is no image. */
  code: string
  /** Name read by screen readers and shown as the tooltip. */
  name: string
  /** Image address; letters are drawn when it is missing. */
  src?: string
}

export type AnimatedAvatarGroupProps = {
  /** The symbols to stack, in order from front to back. */
  items: readonly AnimatedAvatarGroupItem[]
  /** Accessible name of the group, for example "Top holdings". */
  label: string
  /** How many marks to draw before folding the rest into "+n". */
  maxVisible?: number
  /** Diameter of one mark in pixels. */
  size?: number
  /** Fraction of the diameter that neighbours overlap. */
  overlap?: number
  /** Spread the marks out while the pointer is over the group. */
  expandOnHover?: boolean
  /** Extra class name on the group. */
  className?: string
}

export function AnimatedAvatarGroup({
  items,
  label,
  maxVisible = 4,
  size = 28,
  overlap = 0.3,
  expandOnHover = true,
  className,
}: AnimatedAvatarGroupProps) {
  const [hovered, setHovered] = useState(false)
  // 只有真有鼠标的设备才展开：触屏上悬停是粘住的。
  const [canHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )
  const visible = items.slice(0, maxVisible)
  const hidden = items.length - visible.length
  const expanded = expandOnHover && canHover && hovered
  const shift = expanded ? EXPANDED_GAP : -size * overlap
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="animated-avatar-group"
      data-expanded={expanded || undefined}
      className={cn('flex items-center', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {visible.map((item, index) => (
        <motion.span
          key={item.code}
          title={item.name}
          initial={false}
          animate={{ marginLeft: index === 0 ? 0 : shift, scale: expanded ? EXPANDED_SCALE : 1 }}
          transition={{ ...SPRING, delay: index * STAGGER }}
          className="relative inline-flex rounded-full border-2 border-surface-0"
          style={{ zIndex: visible.length - index }}
        >
          <SymbolMark symbol={item.code} name={item.name} src={item.src} size={size} />
        </motion.span>
      ))}
      {hidden > 0 && (
        <motion.span
          data-slot="animated-avatar-group-more"
          initial={false}
          animate={{ marginLeft: shift }}
          transition={{ ...SPRING, delay: visible.length * STAGGER }}
          className="k-text-micro relative z-0 inline-flex items-center justify-center rounded-full border-2 border-surface-0 bg-surface-4 text-ink-2 tabular-nums"
          style={{ width: size + 4, height: size + 4 }}
        >
          {`+${hidden}`}
        </motion.span>
      )}
    </div>
  )
}
