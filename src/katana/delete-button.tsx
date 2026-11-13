// SPDX-License-Identifier: MIT
// 原地确认的危险按钮：点一下不直接执行，按钮在原地向右展开出「确认」「取消」两个小钮，不弹对话框。用于删工作区、删自选列表、删画线、全部撤单。
// 交互学自 rare-ui 的 delete-button（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 展开时垃圾桶的盖子掀开，宽度用弹簧撑开；② Esc 取消并把焦点还给原按钮；③ 确认或取消后按钮上留一个结果状态
// 再回到待命，确认留得比取消久（读出来的观察值：确认约 1.4s、取消约 0.6s，只是展示，没有业务含义）；④ 屏外读屏区播报结果。
// 我们另加的：展开后焦点落在「取消」上（危险操作的默认项是不做）；点按钮外面、Tab 走出两端也算取消（不靠失焦判断：Safari 点按钮不聚焦）。
import { AnimatePresence, motion, useMotionValue, animate } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { focusRingInset } from '../lib/focus'
import { snappy } from '../lib/motion'
import { unit } from '../lib/spring'

/** 容器宽：一个钮 28 加 1px 边框的两侧；展开后多两个钮。高 30 与 Button 默认一致。 */
const IDLE_WIDTH = 30
const ARMED_WIDTH = IDLE_WIDTH + 28 * 2
const HOLD_MS = { done: 1400, kept: 600 }

type Phase = 'idle' | 'armed' | 'done' | 'kept'

const iconButton = cn(
  'grid size-7 flex-none cursor-pointer place-items-center rounded-[var(--radius-control)] text-ink-3',
  'transition-colors duration-[120ms] hover:bg-white/7 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45',
  '[&_svg]:size-[15px]',
  focusRingInset,
)

function Bin({ open }: { open: boolean }) {
  const lid = useMotionValue(0)
  useEffect(() => {
    const run = animate(lid, open ? -28 : 0, snappy)
    return () => run.stop()
  }, [open, lid])
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l1 10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-10" />
      <motion.g
        data-slot="delete-button-lid"
        style={{ rotate: lid, transformBox: 'view-box', transformOrigin: '4px 6px' }}
      >
        <path d="M4 6h16" />
        <path d="M9 6V4h6v2" />
      </motion.g>
    </svg>
  )
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M5 12.5 10 17.5 19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={unit(snappy)}
      />
    </svg>
  )
}

export type DeleteButtonProps = {
  /** 原按钮的读屏名，如「删除工作区」。 */
  label: string
  confirmLabel: string
  cancelLabel: string
  /** 确认、取消之后读屏播报的话；不给就不播。 */
  doneLabel?: string
  keptLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  disabled?: boolean
  className?: string
}

export function DeleteButton({
  label,
  confirmLabel,
  cancelLabel,
  doneLabel,
  keptLabel,
  onConfirm,
  onCancel,
  disabled,
  className,
}: DeleteButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const armed = phase === 'armed'

  const resolve = (next: 'done' | 'kept', focusBack: boolean) => {
    setPhase(next)
    if (focusBack) trigger.current?.focus()
    if (next === 'done') onConfirm?.()
    else onCancel?.()
  }

  useEffect(() => {
    if (phase === 'idle' || phase === 'armed') return
    const timer = setTimeout(() => setPhase('idle'), HOLD_MS[phase])
    return () => clearTimeout(timer)
  }, [phase])
  useEffect(() => {
    if (armed) cancel.current?.focus()
  }, [armed])
  // 点外面算取消，也要通知调用方；用 useEffectEvent 读最新的 onCancel，不让监听器跟着重挂。
  const dismiss = useEffectEvent(() => resolve('kept', false))
  useEffect(() => {
    if (!armed) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) dismiss()
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [armed])

  const idleIcon = phase === 'done' ? <Check key="done" /> : <Bin key="bin" open={armed} />
  return (
    <motion.div
      ref={root}
      data-slot="delete-button"
      data-phase={phase}
      initial={false}
      animate={{ width: armed ? ARMED_WIDTH : IDLE_WIDTH }}
      transition={snappy}
      onKeyDown={(event) => {
        if (!armed) return
        if (event.key === 'Escape') {
          event.stopPropagation()
          resolve('kept', true)
        }
        // Tab 走出两端算取消（焦点已经在往外走，不再抢回来）；点外面由 pointerdown 管。
        const leaving = event.shiftKey ? event.target === trigger.current : event.target === cancel.current
        if (event.key === 'Tab' && leaving) resolve('kept', false)
      }}
      className={cn(
        'box-border inline-flex h-[30px] flex-none items-center overflow-hidden rounded-[var(--radius-control)] border border-white/8 bg-white/4',
        phase === 'done' && 'text-danger',
        className,
      )}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={armed}
        disabled={disabled}
        onClick={() => (armed ? resolve('kept', false) : setPhase('armed'))}
        className={cn(iconButton, phase === 'done' && 'text-danger')}
      >
        {idleIcon}
      </button>
      <AnimatePresence initial={false}>
        {armed && (
          <motion.span
            key="panel"
            className="flex flex-none items-center"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={unit(snappy)}
          >
            <button
              type="button"
              data-slot="delete-button-confirm"
              aria-label={confirmLabel}
              onClick={() => resolve('done', true)}
              className={cn(
                iconButton,
                'text-danger hover:bg-[color-mix(in_srgb,var(--signal-red)_14%,transparent)] hover:text-danger',
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5 10 17.5 19 7" />
              </svg>
            </button>
            <button
              ref={cancel}
              type="button"
              data-slot="delete-button-cancel"
              aria-label={cancelLabel}
              onClick={() => resolve('kept', true)}
              className={iconButton}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          </motion.span>
        )}
      </AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {phase === 'done' ? doneLabel : phase === 'kept' ? keptLabel : ''}
      </span>
    </motion.div>
  )
}
