// SPDX-License-Identifier: MIT
// 改自 SmoothUI animated-stepper（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 步骤条：下单向导（选品种、填参数、确认）这类多步流程。当前步的圆点外扩一圈光环，完成的步里打钩（笔画画出来），
// 步与步之间的线随进度填满，下方内容按前进或后退方向滑入。键盘 ← → / ↑ ↓ 走步（allowClickNavigation 开着时）。
// 与 StepPlayer 的分工：StepPlayer 是「一步步播放」的回放控制，AnimatedStepper 是用户自己在填的流程进度。
// 与原件的差别：读屏名（整条、每一步、「已完成」「当前」）全由 labels 给；颜色换成 token（强调色 --accent，不用 Tailwind 色名）。
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 弹簧参数来自 SmoothUI animated-stepper：bounce 0.1、0.25 秒；打钩那一下 0.3 秒。
const SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const SPRING_CHECK = { type: 'spring' as const, bounce: 0.1, duration: 0.3 }
// 内容滑入的位移（像素）。
const SLIDE = 20

export type AnimatedStepperStep = {
  label: string
  description?: string
  icon?: ReactNode
  /** What shows under the bar while this step is current. */
  content?: ReactNode
}

export type AnimatedStepperLabels = {
  /** Accessible name of the whole bar. */
  steps: string
  /** Name of one step button, for example "Step 2: Parameters". */
  step: (index: number, label: string) => string
  completed: string
  current: string
}

export type AnimatedStepperProps = {
  /** The steps in order; each has a label and optional description, icon and content. */
  steps: readonly AnimatedStepperStep[]
  /** All the text read by screen readers; the package ships none. */
  labels: AnimatedStepperLabels
  /** Current step (controlled); omit to let the component keep it. */
  currentStep?: number
  /** Step shown first when uncontrolled. */
  defaultStep?: number
  /** Called with the new step index when the user moves. */
  onStepChange?: (step: number) => void
  /** Let the user click or arrow to any step; off means the steps only move from outside. */
  allowClickNavigation?: boolean
  /** Whether the steps run across or down. */
  orientation?: 'horizontal' | 'vertical'
  /** Extra class name on the root. */
  className?: string
}

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4">
      <motion.path
        d="M5 13l4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={SPRING_CHECK}
      />
    </svg>
  )
}

export function AnimatedStepper({
  steps,
  labels,
  currentStep,
  defaultStep = 0,
  onStepChange,
  allowClickNavigation = false,
  orientation = 'horizontal',
  className,
}: AnimatedStepperProps) {
  const id = useId()
  const [own, setOwn] = useState(defaultStep)
  const [direction, setDirection] = useState(1)
  const active = currentStep ?? own
  const horizontal = orientation === 'horizontal'
  const go = useCallback(
    (step: number) => {
      if (step < 0 || step >= steps.length || step === active) return
      setDirection(step > active ? 1 : -1)
      setOwn(step)
      onStepChange?.(step)
    },
    [active, onStepChange, steps.length],
  )
  const onKey = (event: KeyboardEvent) => {
    if (!allowClickNavigation) return
    const next = horizontal ? 'ArrowRight' : 'ArrowDown'
    const prev = horizontal ? 'ArrowLeft' : 'ArrowUp'
    if (event.key === next) {
      event.preventDefault()
      go(Math.min(active + 1, steps.length - 1))
    } else if (event.key === prev) {
      event.preventDefault()
      go(Math.max(active - 1, 0))
    }
  }
  const progress = steps.length > 1 ? active / (steps.length - 1) : 0
  return (
    <div
      data-slot="animated-stepper"
      className={cn('flex w-full gap-(--space-6)', horizontal ? 'flex-col' : 'flex-row', className)}
    >
      <div
        role="tablist"
        aria-label={labels.steps}
        aria-orientation={orientation}
        className={cn(
          'relative flex',
          horizontal ? 'flex-row items-center justify-between' : 'flex-col items-start gap-(--space-4)',
        )}
      >
        {steps.map((step, index) => {
          const isActive = index === active
          const done = index < active
          return (
            <div
              key={`${id}-${index}`}
              className={cn(
                'relative z-10 flex items-center',
                horizontal ? 'flex-1 last:flex-none' : 'gap-(--space-3)',
              )}
            >
              <motion.button
                type="button"
                role="tab"
                id={`${id}-step-${index}`}
                aria-selected={isActive}
                aria-controls={`${id}-panel`}
                aria-label={`${labels.step(index + 1, step.label)}${done ? `, ${labels.completed}` : ''}${isActive ? `, ${labels.current}` : ''}`}
                data-state={done ? 'done' : isActive ? 'current' : 'todo'}
                tabIndex={isActive ? 0 : -1}
                disabled={!allowClickNavigation}
                onClick={() => go(index)}
                onKeyDown={onKey}
                whileTap={allowClickNavigation ? { scale: 0.9 } : undefined}
                transition={SPRING}
                className={cn(
                  'k-text-data relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-medium tabular-nums',
                  focusRing,
                  isActive || done
                    ? 'border-(--accent) bg-(--accent) text-surface-0'
                    : 'border-line-strong bg-surface-0 text-ink-3',
                  allowClickNavigation ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                {isActive && (
                  <motion.span
                    key={`ring-${active}`}
                    aria-hidden="true"
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-(--accent)"
                  />
                )}
                {done ? <Check /> : (step.icon ?? index + 1)}
              </motion.button>
              <div className={cn(horizontal ? 'ml-(--space-2)' : '')}>
                <p
                  className={cn(
                    'k-text-data m-0 transition-colors duration-[var(--dur-snappy)]',
                    isActive ? 'text-ink' : 'text-ink-3',
                  )}
                >
                  {step.label}
                </p>
                {step.description && <p className="k-text-caption m-0 text-ink-3">{step.description}</p>}
              </div>
              {horizontal && index < steps.length - 1 && (
                <div className="mx-(--space-2) h-0.5 flex-1 overflow-hidden rounded-full bg-surface-4">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: index < active ? 1 : 0 }}
                    transition={SPRING}
                    className="h-full w-full origin-left bg-(--accent)"
                  />
                </div>
              )}
            </div>
          )
        })}
        {!horizontal && (
          <div className="absolute top-4 left-4 -z-0 h-[calc(100%-2rem)] w-0.5 -translate-x-1/2 overflow-hidden bg-surface-4">
            <motion.div
              initial={false}
              animate={{ scaleY: progress }}
              transition={SPRING}
              className="h-full w-full origin-top bg-(--accent)"
            />
          </div>
        )}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-step-${active}`}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: direction * SLIDE }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * SLIDE }}
            transition={SPRING}
          >
            {steps[active]?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
