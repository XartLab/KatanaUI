// SPDX-License-Identifier: MIT
// 分步进度条：左边一个播放 / 暂停 / 重放钮，右边一排圆点，当前这一步撑成一条长条、里面的填充随时间走，走完转到下一步。
// 用于回放条与训练场演示的分段。交互学自 rare-ui 的 step-player（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 当前步是长条、已过的步是亮点、没到的是暗点，长条与圆点之间宽度用弹簧换；② 播放钮按状态变形：
// 播放中是暂停、暂停时是播放、全部放完是重放，点重放回到第一步并开始放；③ 每步可以有自己的时长；④ 可选「可跳」：点圆点直接去那一步，
// 点击区比圆点大（至少 44px 高）；⑤ 放完可以循环，放完时触发一次回调。
// 不学它的：用 flubber 把播放与暂停的路径变形（要加依赖）——我们让三个图标用弹簧缩放着换，不加依赖。
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'
import { snappy } from '../lib/motion'
import { unit } from '../lib/spring'
import { arrive, clampStep, stepDuration } from './step-player-model'

export type StepPlayerStep = {
  /** 这一步放多久（毫秒）；不写用整体的 duration。 */
  duration?: number
  /** 可跳时这一步圆点的读屏名；不写用 labels.step。 */
  label?: string
}

export type StepPlayerLabels = {
  play: string
  pause: string
  replay: string
  /** 整条的读屏名，如「第 2 步，共 4 步」。 */
  group: (index: number, count: number) => string
  /** 可跳时每个圆点的读屏名（步上没写 label 时用）。 */
  step: (index: number, count: number) => string
}

export type StepPlayerProps = {
  /** 步数，或每一步的描述；默认 4 步。 */
  steps?: number | readonly StepPlayerStep[]
  value?: number
  defaultValue?: number
  onValueChange?: (index: number) => void
  playing?: boolean
  defaultPlaying?: boolean
  onPlayingChange?: (playing: boolean) => void
  /** 每步默认放多久（毫秒）。 */
  duration?: number
  loop?: boolean
  /** 最后一步放完时触发一次（循环时也触发）。 */
  onComplete?: () => void
  /** 钮与条的高（px）。 */
  size?: number
  /** 点圆点直接去那一步。 */
  seekable?: boolean
  labels: StepPlayerLabels
  className?: string
}

type Icon = 'play' | 'pause' | 'replay'

function TransportIcon({ icon }: { icon: Icon }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-full" data-icon={icon}>
      {icon === 'play' ? (
        <path d="M9 6.5v11l9-5.5z" fill="currentColor" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      ) : icon === 'pause' ? (
        <g fill="currentColor">
          <rect x={7.5} y={6} width={3.2} height={12} rx={1} />
          <rect x={13.3} y={6} width={3.2} height={12} rx={1} />
        </g>
      ) : (
        <path
          d="M18 12a6 6 0 1 1-2-4.5M18 5v3.5h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export function StepPlayer({
  steps = 4,
  value,
  defaultValue = 0,
  onValueChange,
  playing,
  defaultPlaying = false,
  onPlayingChange,
  duration = 4000,
  loop = false,
  onComplete,
  size = 32,
  seekable = false,
  labels,
  className,
}: StepPlayerProps) {
  const items = useMemo<readonly StepPlayerStep[]>(
    () => (typeof steps === 'number' ? Array.from({ length: Math.max(1, Math.trunc(steps) || 1) }, () => ({})) : steps),
    [steps],
  )
  const count = items.length
  const [innerIndex, setInnerIndex] = useState(() => clampStep(defaultValue, count))
  const [innerPlaying, setInnerPlaying] = useState(defaultPlaying)
  const [finished, setFinished] = useState(false)
  const index = clampStep(value ?? innerIndex, count)
  const isPlaying = playing ?? innerPlaying
  const progress = useMotionValue(0)
  const fill = useTransform(progress, (p) => `${p * 100}%`)
  const stepMs = stepDuration(items[index]?.duration, duration)

  const dot = Math.max(4, Math.round(size * 0.2))
  const bar = dot * 6
  const gap = Math.max(3, Math.round(size * 0.2))
  const pad = Math.round((size - dot) / 2)

  const goTo = (next: number) => {
    progress.set(0)
    setFinished(false)
    setInnerIndex(next)
    onValueChange?.(next)
  }
  const setPlaying = (next: boolean) => {
    setInnerPlaying(next)
    onPlayingChange?.(next)
  }
  const onArrive = useEffectEvent(() => {
    const next = arrive(index, count, loop)
    if (next.kind === 'advance') {
      goTo(next.index)
      return
    }
    onComplete?.()
    if (next.kind === 'loop') {
      goTo(0)
      return
    }
    setFinished(true)
    setPlaying(false)
  })

  useEffect(() => {
    if (!isPlaying || stepMs === 0) return
    // 从当前进度接着走：暂停再播放不回到这一步的开头。
    const startedAt = performance.now() - progress.get() * stepMs
    let frame = 0
    const tick = (now: number) => {
      const done = Math.min(1, (now - startedAt) / stepMs)
      progress.set(done)
      if (done < 1) frame = requestAnimationFrame(tick)
      else onArrive()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isPlaying, index, stepMs, progress])

  const icon: Icon = finished ? 'replay' : isPlaying ? 'pause' : 'play'
  const control = () => {
    if (finished) {
      goTo(0)
      setPlaying(true)
      return
    }
    setPlaying(!isPlaying)
  }

  return (
    <div
      data-slot="step-player"
      data-playing={isPlaying || undefined}
      data-finished={finished || undefined}
      className={cn('inline-flex items-center gap-2 text-ink-3', className)}
    >
      <button
        type="button"
        data-slot="step-player-control"
        data-icon={icon}
        aria-label={finished ? labels.replay : isPlaying ? labels.pause : labels.play}
        onClick={control}
        style={{ width: size, height: size }}
        className={cn(
          'relative grid flex-none cursor-pointer place-items-center rounded-full bg-surface-3 text-ink-2',
          'border border-line transition-colors duration-[120ms] hover:bg-surface-4 hover:text-ink active:scale-[0.92]',
          focusRing,
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={icon}
            className="absolute"
            style={{ width: Math.round(size * 0.58), height: Math.round(size * 0.58) }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={unit(snappy)}
          >
            <TransportIcon icon={icon} />
          </motion.span>
        </AnimatePresence>
      </button>
      <div
        role="group"
        data-slot="step-player-track"
        aria-label={labels.group(index, count)}
        style={{ height: size, paddingInline: pad, gap }}
        className="flex items-center rounded-full border border-line bg-surface-3"
      >
        {items.map((item, i) => {
          const state = i === index ? 'active' : i < index ? 'past' : 'pending'
          return (
            <motion.div
              key={i}
              data-slot="step-player-step"
              data-state={state}
              initial={false}
              animate={{ width: state === 'active' ? bar : dot }}
              transition={snappy}
              style={{ height: dot }}
              className={cn(
                'relative flex-none rounded-full transition-colors duration-[200ms]',
                state === 'past' ? 'bg-ink-2' : 'bg-ink-4',
              )}
            >
              {state === 'active' ? (
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <motion.span
                    data-slot="step-player-fill"
                    style={{ width: fill }}
                    className="absolute inset-y-0 left-0 bg-ink-2"
                  />
                </span>
              ) : null}
              {seekable ? (
                <button
                  type="button"
                  data-slot="step-player-seek"
                  aria-label={item.label ?? labels.step(i, count)}
                  aria-current={state === 'active' ? 'step' : undefined}
                  onClick={() => goTo(i)}
                  // 点击区比圆点大：上下各撑到至少 44px 高。
                  style={{ top: -Math.max(0, (44 - dot) / 2), bottom: -Math.max(0, (44 - dot) / 2) }}
                  className={cn('absolute inset-x-0 cursor-pointer', focusRing)}
                />
              ) : null}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
