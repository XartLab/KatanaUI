// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-conversation（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 对话的滚动容器：只在读者本来就贴着底部时才跟着往下；流式中往上翻是明确的举动（想读点东西），把人拽回底部是聊天界面最常见的不可用。
// 不再跟的时候冒出一枚药丸，提供一键回到最新。
// 相对原件：「回到最新」由调用方传；跟随底部时用即时滚动（auto）而不是平滑——平滑滚动途中会触发 onScroll，量到离底部超过阈值，把「贴着底」误判成「已离开」，药丸一闪一闪；药丸点击才用平滑；按钮用我们的 Button；去掉 reduced-motion 分支。
import { ArrowDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

/**
 * 离底部多近还算「在底部」。取 0 会在小数滚动高度上失灵，取大了读者在往上读几行时还被拽下来。
 */
const BOTTOM_THRESHOLD_PX = 48

export type AiConversationProps = {
  /** The messages. */
  children: ReactNode
  /**
   * Accessible name of the log region (required).
   * 对话区的读屏名（必填）。
   */
  label: string
  /** Text of the "jump to latest" pill (required). */
  jumpLabel: string
  /** Changes whenever content grows (message count, or streamed text length); decides when to follow the bottom. */
  contentKey?: string | number
  /** Extra class name on the root. */
  className?: string
}

export function AiConversation({ children, label, jumpLabel, contentKey, className }: AiConversationProps) {
  const viewport = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)

  const measure = useCallback(() => {
    const el = viewport.current
    if (!el) return
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = viewport.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    setPinned(true)
  }, [])

  // 布局阶段滚：内容长高的同一帧就到位，读者看不到滚动前的一闪。
  useLayoutEffect(() => {
    if (pinned) scrollToBottom('auto')
  }, [contentKey, pinned, scrollToBottom])

  useEffect(() => {
    const el = viewport.current
    if (!el) return
    // 内容没经过 contentKey 也会变高（图加载完、折叠区展开），ResizeObserver 兜住。
    const observer = new ResizeObserver(measure)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [measure])

  return (
    <div data-slot="ai-conversation" data-pinned={pinned} className={cn('relative min-h-0 w-full', className)}>
      <div
        ref={viewport}
        role="log"
        aria-label={label}
        tabIndex={0}
        data-slot="ai-conversation-viewport"
        onScroll={measure}
        className="h-full overflow-y-auto overscroll-contain outline-0 focus-visible:outline-(length:--k-focused-outlineWidth) focus-visible:-outline-offset-2 focus-visible:outline-(color:--k-focused-outlineColor)"
      >
        {children}
      </div>
      <AnimatePresence initial={false}>
        {!pinned ? (
          <motion.div
            key="jump"
            className="absolute inset-x-0 bottom-3 mx-auto w-fit"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={unit(snappy)}
          >
            <Button
              type="button"
              size="sm"
              data-slot="ai-conversation-jump"
              className="rounded-full bg-surface-3 shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
              onClick={() => scrollToBottom('smooth')}
            >
              <ArrowDown aria-hidden="true" size={13} />
              {jumpLabel}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
