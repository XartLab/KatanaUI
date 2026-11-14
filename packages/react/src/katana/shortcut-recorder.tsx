// SPDX-License-Identifier: MIT
import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { Kbd } from './kbd.tsx'
import { comboFromEvent, comboParts, hasModifier, heldModifiers, isModifierCode } from './shortcut-model.ts'

// 功能参照 Arc Shortcut recorder（uiarc.dev，2026-11-14 读：录键、冲突提示），实现原创；外观是我们的字段皮肤加 Kbd 方块（theme/shortcut-recorder.css）。
// 用途：热键设置（ATAS 有整套热键）。冲突表由调用方传（组合串 → 占着它的动作名）；冲突时不写入，留在录键态让用户换一个。

export type ShortcutRecorderLabels = {
  /** 没有快捷键时框里的字：「未设置」。 */
  empty: string
  /** 录键态框里的字：「按下新的快捷键」。 */
  recording: string
  /** 清除按钮的读屏名。 */
  clear: string
  /** 冲突提示：「已被 xx 使用」。 */
  conflict: (action: string) => string
  /** 要求带修饰键时，只按了单键的提示。 */
  needModifier: string
}

export type ShortcutRecorderProps = {
  /** 当前快捷键（规范串，见 shortcut-model）；null 是没设。 */
  value: string | null
  /** 录到新的（规范串）或清除（null）。冲突与不合规的不回调。 */
  onValue: (next: string | null) => void
  /** 读屏名：这是哪个动作的快捷键。 */
  label: string
  labels: ShortcutRecorderLabels
  /** 已被占用的组合：组合串 → 占着它的动作名。自己当前的值不算冲突。 */
  conflicts?: Readonly<Record<string, string>>
  /** 规范串里的一块怎么写（Meta → ⌘ 之类）；不给原样写。 */
  partLabel?: (part: string) => string
  /** 要求至少带一个修饰键（单个字母键会和打字撞）；默认不要求。 */
  requireModifier?: boolean
  disabled?: boolean
  className?: string
}

export function ShortcutRecorder({
  value,
  onValue,
  label,
  labels,
  conflicts,
  partLabel,
  requireModifier = false,
  disabled,
  className,
}: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false)
  // 录键中提示什么：冲突的动作名、要修饰键，或没有；held 是此刻按着的修饰键（实时显示在框里）。
  const [problem, setProblem] = useState<{ kind: 'conflict'; action: string } | { kind: 'modifier' } | null>(null)
  const [held, setHeld] = useState<string[]>([])
  const name = partLabel ?? ((part: string) => part)
  const valueId = useId()

  const stop = () => {
    setRecording(false)
    setProblem(null)
    setHeld([])
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!recording) return
    // Tab 照常走焦点（别把键盘用户困在录键里），随后的 blur 会收掉录键态。
    if (event.key === 'Tab') return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') return stop()
    const mods = heldModifiers(event.nativeEvent)
    if (isModifierCode(event.code)) return setHeld(mods)
    if (mods.length === 0 && (event.key === 'Backspace' || event.key === 'Delete')) {
      onValue(null)
      return stop()
    }
    const combo = comboFromEvent(event.nativeEvent)
    if (combo === null) return
    if (requireModifier && !hasModifier(combo)) return setProblem({ kind: 'modifier' })
    const owner = combo === value ? undefined : conflicts?.[combo]
    if (owner !== undefined) return setProblem({ kind: 'conflict', action: owner })
    onValue(combo)
    stop()
  }
  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (recording && isModifierCode(event.code)) setHeld(heldModifiers(event.nativeEvent))
  }

  const parts = recording ? held : value ? comboParts(value) : []
  const valueText = recording ? labels.recording : value ? comboParts(value).map(name).join('+') : labels.empty
  const message = problem?.kind === 'conflict' ? labels.conflict(problem.action) : problem ? labels.needModifier : ''
  return (
    <span className={cn('k-rec', className)} data-state={recording ? (problem ? 'conflict' : 'recording') : 'idle'}>
      <button
        type="button"
        className="k-rec-field"
        aria-label={label}
        aria-describedby={valueId}
        disabled={disabled}
        onClick={() => (recording ? undefined : setRecording(true))}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={stop}
      >
        {parts.length > 0 ? (
          <Kbd parts={parts.map(name)} label={parts.map(name).join('+')} />
        ) : (
          <span className="k-rec-hint">{recording ? labels.recording : labels.empty}</span>
        )}
        {recording && parts.length > 0 && <span className="k-rec-hint">…</span>}
      </button>
      <span id={valueId} className="sr-only">
        {valueText}
      </span>
      {value && !recording && !disabled && (
        <button type="button" className="k-rec-clear" aria-label={labels.clear} onClick={() => onValue(null)}>
          <X size={12} aria-hidden />
        </button>
      )}
      <span className="k-rec-msg" role="status">
        {message}
      </span>
    </span>
  )
}
