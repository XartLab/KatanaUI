// SPDX-License-Identifier: MIT
// 改自 SmoothUI dynamic-island（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 通知岛：一个胶囊，内容换了它就弹着变成新内容的大小（成交回报、炸板提醒、连接状态）；旧内容模糊淡出、新内容从略小处模糊淡入。
// 与原件的差别：原件内置的天气、来电、音乐播放器都是营销演示，这里只留「胶囊 + 内容切换」这一层，内容全由调用方给（children + view 键）；
// 颜色换成 token（底 --bg-000、线 --line-200）；读屏名必填，内容换了作为礼貌播报（aria-live）。
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

// 弹簧参数来自 SmoothUI dynamic-island：时长 0.25 秒，bounce 按切换前后的内容而异（0.3 到 0.5），这里改成一个可传的 bounce，默认取原件最常用的 0.4。
const DEFAULT_BOUNCE = 0.4
const ISLAND_DURATION = 0.25
// 新内容比岛先晚 0.05 秒才显现（原件的 delay），等岛的大小先动起来。
const CONTENT_DELAY = 0.05
// 胶囊的圆角（像素）：原件固定 32，内容高了也不变成圆形。
const ISLAND_RADIUS = 32

export type DynamicIslandProps = {
  /** Key of the content on show; when it changes the island morphs to the new content. */
  view: string
  /** The content of the current view. */
  children: ReactNode
  /** Accessible name of the island; its content is announced politely when the view changes. */
  label: string
  /** Spring bounce of the morph, 0 to 1. */
  bounce?: number
  /** Extra class name on the outer row. */
  className?: string
}

export function DynamicIsland({ view, children, label, bounce = DEFAULT_BOUNCE, className }: DynamicIslandProps) {
  const spring = { type: 'spring' as const, bounce, duration: ISLAND_DURATION }
  return (
    <div className={cn('flex w-full justify-center', className)} data-slot="dynamic-island">
      <motion.div
        layout
        role="status"
        aria-live="polite"
        aria-label={label}
        data-view={view}
        data-slot="dynamic-island-body"
        className="w-fit min-w-[100px] overflow-hidden border border-line-strong bg-surface-0 text-ink shadow-[var(--lift)]"
        style={{ borderRadius: ISLAND_RADIUS }}
        transition={spring}
      >
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { delay: CONTENT_DELAY } }}
          transition={spring}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}
