// SPDX-License-Identifier: MIT
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { HOLD_MS, RELEASE_MS, stepProgress } from './hold-model'

// 功能参照 Arc Hold to confirm / Confirm morph（uiarc.dev，2026-11-14 读），实现原创；外观照我们的按钮与 token（theme/hold-to-confirm.css）。
// 不可撤的动作（全平、全撤、停策略）不弹确认框，按住按钮把底色填满才触发，松手往回退；键盘按住空格或回车同样。
// 单击、读屏的「激活」（没有按住）都不触发：这是故意的，要触发只有「按住」这一种手势。

export type HoldToConfirmProps = {
  /** 按钮上的字。 */
  children: ReactNode
  /** 填满时回调，一次按住只回调一次；要等松手再按才能再触发。 */
  onConfirm: () => void
  /** 按住多久填满（毫秒），默认 2000（待定，出处见 hold-model）。 */
  holdMs?: number
  /** 松手后退回要多久（毫秒），默认 200。 */
  releaseMs?: number
  /** 读屏与悬停提示：「按住 2 秒确认」这类，由调用方按界面语言写（必填，没有它读屏用户不知道要按住）。 */
  hint: string
  /** 填满后的字（原地换掉 children，直到松手）；不给就不换。 */
  confirmedLabel?: ReactNode
  /** danger 是红色填充（默认），default 是中性色。 */
  tone?: 'danger' | 'default'
  disabled?: boolean
  className?: string
}

export function HoldToConfirm({
  children,
  onConfirm,
  holdMs = HOLD_MS,
  releaseMs = RELEASE_MS,
  hint,
  confirmedLabel,
  tone = 'danger',
  disabled,
  className,
}: HoldToConfirmProps) {
  const hintId = useId()
  const fill = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  // 进度只在 ref 里走、逐帧直接写样式：不为每一帧重渲染。
  const run = useRef({ progress: 0, holding: false, down: false, armed: true, frame: 0, last: 0 })
  const [phase, setPhase] = useState<'idle' | 'holding' | 'done'>('idle')
  const confirm = useRef(onConfirm)
  useEffect(() => {
    confirm.current = onConfirm
  })

  const paint = () => {
    const { progress } = run.current
    if (fill.current) fill.current.style.transform = `scaleX(${progress})`
    button.current?.setAttribute('data-progress', progress.toFixed(3))
  }
  const tick = (now: number) => {
    const state = run.current
    const dt = state.last === 0 ? 0 : now - state.last
    state.last = now
    // 填满之后手还按着：进度停在满格，松手才退。
    if (state.holding || !state.down)
      state.progress = stepProgress(state.progress, dt, state.holding, holdMs, releaseMs)
    paint()
    if (state.holding && state.progress >= 1 && state.armed) {
      // 填满：只触发一次，松手后才重新上膛。
      state.armed = false
      state.holding = false
      setPhase('done')
      confirm.current()
    }
    if (state.holding || state.progress > 0) state.frame = requestAnimationFrame(tick)
    else {
      state.frame = 0
      state.last = 0
      setPhase('idle')
    }
  }
  const begin = () => {
    const state = run.current
    state.down = true
    if (disabled || state.holding || !state.armed) return
    state.holding = true
    setPhase('holding')
    if (state.frame === 0) state.frame = requestAnimationFrame(tick)
  }
  const end = () => {
    const state = run.current
    state.down = false
    state.armed = true
    if (!state.holding) return
    state.holding = false
    setPhase('idle')
  }
  useEffect(() => {
    const state = run.current
    return () => cancelAnimationFrame(state.frame)
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    begin()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    // 挡掉浏览器把空格 / 回车当成点击；按住不放时系统会连发 keydown，只认第一下。
    event.preventDefault()
    if (!event.repeat) begin()
  }
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') end()
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        className={cn('k-hold', className)}
        data-tone={tone}
        data-phase={phase}
        data-progress="0.000"
        disabled={disabled}
        aria-describedby={hintId}
        title={hint}
        onPointerDown={onPointerDown}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={end}
        onContextMenu={(event) => event.preventDefault()}
      >
        <span ref={fill} className="k-hold-fill" aria-hidden="true" />
        <span className="k-hold-label">
          {phase === 'done' && confirmedLabel !== undefined ? confirmedLabel : children}
        </span>
      </button>
      <span id={hintId} className="sr-only">
        {hint}
      </span>
    </>
  )
}
