// SPDX-License-Identifier: MIT
// 改自 SmoothUI power-off-slide（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 滑动确认：把圆钮从左拖到头才算数，拖不到头松手就弹回。拿来做「全部平仓」「一键清仓」「关闭策略」这类不可轻易误触的操作。
// 与 HoldToConfirm 的分工：HoldToConfirm 是长按一段时间，PowerOffSlide 是拖一段距离；前者适合键盘与读屏，后者是有手感的触屏 / 鼠标确认。
// 键盘与读屏另有路：圆钮聚焦后按 Enter 或空格直接确认（滑动对键盘与读屏不可用，这条是必须的补充，原件没有）。
// 与原件的差别：文案全由 labels 给；确认后的「执行中」状态由 busyLabel 显示；颜色换成 token（危险色 --signal-red）；闪光字用 live.css 之外的 k-shimmer（motion-widgets.css）。
import { motion, useAnimation, useMotionValue, useTransform } from 'motion/react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 滑到多远算确认、最多滑多远（像素）：来自 SmoothUI power-off-slide。
const SLIDE_THRESHOLD = 160
const SLIDE_MAX_DISTANCE = 168
// 弹簧参数来自 SmoothUI power-off-slide：0.25 秒。
const SPRING = { type: 'spring' as const, duration: 0.25 }

export type PowerOffSlideProps = {
  /** Text on the track, for example "Slide to close all". */
  label: string
  /** Called once the knob reaches the end (or Enter is pressed on it). */
  onConfirm: () => void
  /** Shown instead of the track while busy, for example "Closing positions…". */
  busyLabel: string
  /** Icon on the knob. */
  icon: ReactNode
  /** How long the busy text stays before the knob returns, in milliseconds. */
  duration?: number
  /** Stop the knob from being dragged or confirmed. */
  disabled?: boolean
  /** Extra class name on the root. */
  className?: string
}

export function PowerOffSlide({
  label,
  onConfirm,
  busyLabel,
  icon,
  duration = 2000,
  disabled = false,
  className,
}: PowerOffSlideProps) {
  const [busy, setBusy] = useState(false)
  const x = useMotionValue(0)
  const controls = useAnimation()
  const timer = useRef<number | undefined>(undefined)
  // 轨上的字随圆钮走远渐渐淡掉。
  const fade = useTransform(x, [0, SLIDE_MAX_DISTANCE * 0.6], [1, 0])
  const confirm = async () => {
    await controls.start({ x: SLIDE_MAX_DISTANCE })
    setBusy(true)
    onConfirm()
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setBusy(false)
      void controls.start({ x: 0 })
      x.set(0)
    }, duration)
  }
  const onDragEnd = () => {
    if (disabled) return
    if (x.get() > SLIDE_THRESHOLD) void confirm()
    else void controls.start({ x: 0 })
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    void confirm()
  }
  return (
    <div data-slot="power-off-slide" data-busy={busy || undefined} className={cn('w-56', className)}>
      {busy ? (
        <p role="status" className="k-text-title m-0 text-center text-ink">
          {busyLabel}
        </p>
      ) : (
        <div className="relative h-14 overflow-hidden rounded-full border border-line-strong bg-surface-3">
          <motion.div
            style={{ opacity: fade }}
            className="absolute inset-0 left-8 z-0 flex items-center justify-center"
          >
            <span className="k-shimmer k-text-data relative w-full select-none text-center">{label}</span>
          </motion.div>
          <motion.div
            role="button"
            aria-label={label}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            animate={controls}
            transition={SPRING}
            drag={disabled ? false : 'x'}
            dragConstraints={{ left: 0, right: SLIDE_MAX_DISTANCE }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            onKeyDown={onKeyDown}
            style={{ x }}
            data-slot="power-off-slide-knob"
            className={cn(
              'absolute top-1 left-1 z-10 flex size-12 items-center justify-center rounded-full bg-surface-0 text-(--signal-red) shadow-[var(--plate)]',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing',
              focusRing,
            )}
          >
            {icon}
          </motion.div>
        </div>
      )}
    </div>
  )
}
