// SPDX-License-Identifier: MIT
// 改自 SmoothUI glow-hover-card（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'

// 悬停辉光卡：指针在卡上移动时，一团强调色的光斑跟着它，边线在光斑处亮起来。适用：首页的功能入口卡、营销页的并排卡片；不进交易主界面。
// 跟原件的差别：原件是一个容器里复制一层覆盖层，让光斑在相邻卡片之间连着走（要同步每张卡的位置，靠 MutationObserver 与滚动监听）；
// 这里每张卡自己跟指针，光斑不跨卡，换来没有覆盖层、没有 DOM 监听、卡片能自由换行。光的颜色默认取强调色 token，不再写死 HSL。
// 光斑位置写成 CSS 变量 --glow-x / --glow-y，由指针事件直接写在元素上（不走 React 状态，移动时不重渲染）。

export type GlowHoverCardProps = {
  /** What goes inside. */
  children: ReactNode
  /** Glow colour, any CSS colour; defaults to the accent token. */
  color?: string
  /** Strength of the glow, 0 to 1. */
  intensity?: number
  /** Diameter of the light spot in px. */
  size?: number
  /** Extra classes for the root element. */
  className?: string
}

export function GlowHoverCard({
  children,
  color = 'var(--accent)',
  intensity = 0.18,
  size = 320,
  className,
}: GlowHoverCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
    el.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
    el.style.setProperty('--glow-o', '1')
  }
  const style = {
    '--glow-color': color,
    '--glow-size': `${size}px`,
    '--glow-strength': `${Math.round(intensity * 100)}%`,
  } as CSSProperties
  return (
    <div
      ref={ref}
      data-slot="glow-hover-card"
      onPointerMove={move}
      onPointerLeave={() => ref.current?.style.setProperty('--glow-o', '0')}
      style={style}
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-3 p-5',
        className,
      )}
    >
      <span aria-hidden="true" data-slot="glow-hover-card-spot" className="pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  )
}
