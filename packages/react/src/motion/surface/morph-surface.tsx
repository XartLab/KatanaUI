// SPDX-License-Identifier: MIT
// 改自 SmoothUI morph-surface（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { focusRing } from '../../lib/focus.ts'

// 变形面：一颗小药丸（图标加一个词）点开后自己长成一张面板，宽、高、圆角一起弹簧过渡；点外面或按 Esc 收回。
// 适用：首页或浮在页面一角的「问 AI」入口。交易主界面里要提问用命令面板或 AI 输入件，这个不放进去：面板盖在内容上、靠点外面收起，不适合盯盘时误触。
// 原件把「问 AI」的文字、输入框、⌘Enter 提交、成功提示全部写死在里面；这里只管变形的外壳，药丸与面板里放什么由调用方传。
// 弹簧参数是原件的常量（stiffness 550 · damping 45 · mass 0.7），收回时延迟 80ms 让内容先淡出。

const SPRING = { type: 'spring' as const, stiffness: 550, damping: 45, mass: 0.7 }
/** 原件：收回时延迟 80ms；药丸高 44、药丸圆角 20、面板圆角 14。 */
const CLOSE_DELAY_S = 0.08
const DOCK_HEIGHT = 44
const DOCK_RADIUS = 20
const PANEL_RADIUS = 14

export type MorphSurfaceProps = {
  /** What the closed pill shows (an icon and a word). */
  pill: ReactNode
  /** Spoken name of the button that opens the panel (required). */
  openLabel: string
  /** The open panel's content. */
  children: ReactNode
  /** Whether the panel is open (controlled). */
  open?: boolean
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Open panel width in px. */
  width?: number
  /** Open panel height in px. */
  height?: number
  /** Extra classes for the root element. */
  className?: string
}

export function MorphSurface({
  pill,
  openLabel,
  children,
  open: openProp,
  onOpenChange,
  width = 360,
  height = 200,
  className,
}: MorphSurfaceProps) {
  const [inner, setInner] = useState(false)
  const open = openProp ?? inner
  const root = useRef<HTMLDivElement>(null)
  const set = (next: boolean) => {
    setInner(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) set(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') set(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
    // set 只读 props 与 setState，依赖 open 就够。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <div className={cn('flex items-end justify-center', className)} style={{ width, height }}>
      <motion.div
        ref={root}
        data-slot="morph-surface"
        data-open={open ? '' : undefined}
        initial={false}
        animate={{
          width: open ? width : 'auto',
          height: open ? height : DOCK_HEIGHT,
          borderRadius: open ? PANEL_RADIUS : DOCK_RADIUS,
        }}
        transition={{ ...SPRING, delay: open ? 0 : CLOSE_DELAY_S }}
        className="relative flex flex-col items-center overflow-hidden border border-alpha-white-8 bg-surface-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
      >
        <button
          type="button"
          aria-label={openLabel}
          aria-expanded={open}
          onClick={() => set(true)}
          tabIndex={open ? -1 : 0}
          className={cn(
            'k-text-data flex h-11 shrink-0 cursor-pointer items-center gap-2 px-3 whitespace-nowrap text-ink-2 hover:text-ink',
            focusRing,
            open && 'pointer-events-none opacity-0',
          )}
        >
          {pill}
        </button>
        <AnimatePresence>
          {open ? (
            <motion.div
              key="panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 flex flex-col"
              style={{ width, height }}
            >
              {children}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
