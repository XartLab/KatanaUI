// SPDX-License-Identifier: MIT
// 时长选择（时、分）：平时是一枚连在一起的药丸「2 时 30 分」加一个笔钮；点笔钮进入编辑，三段用弹簧分开、内侧圆角长出来，两个数字变成可输入的框，笔变成对勾；点对勾确认。
// 用于提醒有效期、回放时长。交互学自 rare-ui 的 duration-picker（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 不编辑时只读，编辑与确认由同一个钮切换，钮上的图标在笔与对勾之间变；② 编辑时三段之间弹簧拉开缝，
// 段与段相邻的角在缝出现时才变圆，缝合上又变回直角，所以闭合时是一整条药丸；③ 输入超过上限不放行，夹到上限并让数字左右抖一下；
// ④ 空的当 0，不编辑时 0 显示成 0；⑤ 开始编辑时焦点落在「时」上；⑥ 数字框的宽度随位数用弹簧变。
// 我们另加的：Enter 确认、Esc 放弃这次编辑回到编辑前的值、上下键加减 1；不用 figma-squircle 的平滑圆角（要加依赖），用普通圆角。
import { motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type Ref } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { fieldText, parseField } from './duration-picker-model.ts'

export type DurationValue = { hours: number; minutes: number }

export type DurationPickerLabels = {
  hours: string
  minutes: string
  /** 笔钮（进入编辑）的读屏名。 */
  edit: string
  /** 对勾钮（确认）的读屏名。 */
  save: string
  /** 两个数字框的读屏名。 */
  hoursInput: string
  minutesInput: string
}

export type DurationPickerProps = {
  /** The current duration; typing calls back immediately, already clamped. */
  value?: DurationValue
  /** Initial duration when uncontrolled. */
  defaultValue?: DurationValue
  /** Called with the new duration (already clamped) while typing, stepping or cancelling. */
  onValueChange?: (value: DurationValue) => void
  /** Old name of onValueChange, kept for one release. @deprecated Use onValueChange. */
  onChange?: (value: DurationValue) => void
  /**
   * Called with the confirmed value when the check mark is clicked or Enter is pressed.
   * 点对勾或按 Enter 确认时触发，参数是确认的值。
   */
  onConfirm?: (value: DurationValue) => void
  /** Called when the editing state changes. */
  onEditingChange?: (editing: boolean) => void
  /** Start in the editing state. */
  defaultEditing?: boolean
  /** Upper bound for hours; larger input is clamped. */
  maxHours?: number
  /** Upper bound for minutes; larger input is clamped. */
  maxMinutes?: number
  /** Texts for the controls: hours, minutes, edit, save, hoursInput and minutesInput (required). */
  labels: DurationPickerLabels
  /** Disable the picker. */
  disabled?: boolean
  /** Extra class name on the root. */
  className?: string
}

const RADIUS = 'var(--radius-control)'

function Field({
  text,
  max,
  label,
  editing,
  disabled,
  onText,
  onKey,
  inputRef,
}: {
  text: string
  max: number
  label: string
  editing: boolean
  disabled?: boolean
  onText: (text: string) => void
  onKey: (event: KeyboardEvent<HTMLInputElement>) => void
  inputRef?: Ref<HTMLInputElement>
}) {
  const shake = useAnimationControls()
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const clean = event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    const { value, overflow } = parseField(clean, max)
    onText(overflow ? String(value) : clean)
    // 超过上限：夹到上限，数字左右抖一下（先拉到一侧，再让弹簧拉回来）。
    if (overflow) void shake.start({ x: [0, 6, 0] }, { type: 'spring', stiffness: 700, damping: 9 })
  }
  const shown = editing ? text : text === '' ? '0' : text
  return (
    <motion.input
      ref={inputRef}
      data-slot="duration-picker-input"
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      value={shown}
      placeholder={editing ? '0' : undefined}
      readOnly={!editing}
      disabled={disabled}
      tabIndex={editing ? 0 : -1}
      onChange={onChange}
      onKeyDown={onKey}
      onFocus={(event) => editing && event.currentTarget.select()}
      animate={shake}
      layout="size"
      transition={snappy}
      style={{ width: `${Math.max(1, shown.length || 1) + (editing ? 2 : 0.4)}ch` }}
      className={cn(
        'k-text-body h-full min-w-0 border-0 bg-transparent p-0 text-center text-ink tabular-nums',
        'placeholder:text-ink-4',
        editing
          ? 'cursor-text rounded-[5px] bg-surface-1 outline-0 focus-visible:outline-2 focus-visible:outline-(--k-focused-outlineColor)'
          : 'cursor-default outline-0',
      )}
    />
  )
}

/** Hours-and-minutes duration pill; the pen button switches it into editing, the check mark confirms. */
export function DurationPicker({
  value,
  defaultValue,
  onValueChange,
  onChange,
  onConfirm,
  onEditingChange,
  defaultEditing = false,
  maxHours = 24,
  maxMinutes = 59,
  labels,
  disabled,
  className,
}: DurationPickerProps) {
  const emit = onValueChange ?? onChange
  const [editing, setEditing] = useState(defaultEditing)
  const [hours, setHours] = useState(() => fieldText(value?.hours ?? defaultValue?.hours ?? 0))
  const [minutes, setMinutes] = useState(() => fieldText(value?.minutes ?? defaultValue?.minutes ?? 0))
  // 外面给的 value 变了（不是自己打字引起的）就跟着换：用渲染时调整的写法，不走 effect。
  const [seen, setSeen] = useState(value)
  if (value !== undefined && (seen?.hours !== value.hours || seen?.minutes !== value.minutes)) {
    setSeen(value)
    if (parseField(hours, maxHours).value !== value.hours) setHours(fieldText(value.hours))
    if (parseField(minutes, maxMinutes).value !== value.minutes) setMinutes(fieldText(value.minutes))
  }
  const hoursInput = useRef<HTMLInputElement>(null)
  const before = useRef<DurationValue>({ hours: 0, minutes: 0 })
  const current = (): DurationValue => ({
    hours: parseField(hours, maxHours).value,
    minutes: parseField(minutes, maxMinutes).value,
  })

  const setEditingTo = (next: boolean) => {
    setEditing(next)
    onEditingChange?.(next)
  }
  const start = () => {
    before.current = current()
    setEditingTo(true)
  }
  const confirm = () => {
    setEditingTo(false)
    onConfirm?.(current())
  }
  const cancel = () => {
    const back = before.current
    setHours(fieldText(back.hours))
    setMinutes(fieldText(back.minutes))
    emit?.(back)
    setEditingTo(false)
  }
  // 进入编辑后焦点落在「时」上（渲染完、输入框不再 readOnly 才聚焦得上）。
  useEffect(() => {
    if (editing) hoursInput.current?.focus()
  }, [editing])

  const edit = (which: 'hours' | 'minutes', text: string) => {
    const next = {
      hours: which === 'hours' ? parseField(text, maxHours).value : parseField(hours, maxHours).value,
      minutes: which === 'minutes' ? parseField(text, maxMinutes).value : parseField(minutes, maxMinutes).value,
    }
    if (which === 'hours') setHours(text)
    else setMinutes(text)
    emit?.(next)
  }
  const step = (which: 'hours' | 'minutes', delta: number) => {
    const max = which === 'hours' ? maxHours : maxMinutes
    const now = parseField(which === 'hours' ? hours : minutes, max).value
    edit(which, fieldText(Math.min(max, Math.max(0, now + delta))))
  }
  const onKey = (which: 'hours' | 'minutes') => (event: KeyboardEvent<HTMLInputElement>) => {
    // ime-safe-enter-submit：输入法组合中的按键（含选词回车）不交给确认逻辑。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter') {
      event.preventDefault()
      confirm()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      step(which, event.key === 'ArrowUp' ? 1 : -1)
    }
  }

  const seam = editing ? 6 : 0
  const inner = editing ? RADIUS : '0px'
  const segment = 'flex h-8 items-center gap-1.5 border border-line bg-surface-3 text-ink-3'
  return (
    <motion.div
      data-slot="duration-picker"
      data-editing={editing || undefined}
      data-disabled={disabled || undefined}
      className={cn('inline-flex items-stretch', disabled && 'opacity-45', className)}
      initial={false}
      animate={{ columnGap: seam + 'px' }}
      transition={unit(snappy)}
    >
      <motion.div
        data-slot="duration-picker-segment"
        className={cn(segment, 'pr-2 pl-2.5')}
        initial={false}
        animate={{
          borderTopLeftRadius: RADIUS,
          borderBottomLeftRadius: RADIUS,
          borderTopRightRadius: inner,
          borderBottomRightRadius: inner,
        }}
        transition={unit(snappy)}
      >
        <Field
          text={hours}
          max={maxHours}
          label={labels.hoursInput}
          editing={editing}
          disabled={disabled}
          onText={(text) => edit('hours', text)}
          onKey={onKey('hours')}
          inputRef={hoursInput}
        />
        <span className="k-text-caption">{labels.hours}</span>
      </motion.div>
      <motion.div
        data-slot="duration-picker-segment"
        className={cn(segment, 'border-l-0 pr-2 pl-2', editing && 'border-l')}
        initial={false}
        animate={{
          borderTopLeftRadius: inner,
          borderBottomLeftRadius: inner,
          borderTopRightRadius: inner,
          borderBottomRightRadius: inner,
        }}
        transition={unit(snappy)}
      >
        <Field
          text={minutes}
          max={maxMinutes}
          label={labels.minutesInput}
          editing={editing}
          disabled={disabled}
          onText={(text) => edit('minutes', text)}
          onKey={onKey('minutes')}
        />
        <span className="k-text-caption">{labels.minutes}</span>
      </motion.div>
      <motion.button
        type="button"
        data-slot="duration-picker-toggle"
        data-mode={editing ? 'save' : 'edit'}
        aria-label={editing ? labels.save : labels.edit}
        disabled={disabled}
        onClick={editing ? confirm : start}
        className={cn(
          segment,
          'w-8 flex-none cursor-pointer justify-center border-l-0 px-0 transition-colors duration-[120ms]',
          editing && 'border-l',
          'not-disabled:hover:bg-surface-4 not-disabled:hover:text-ink disabled:cursor-not-allowed',
          focusRing,
        )}
        initial={false}
        animate={{
          borderTopLeftRadius: inner,
          borderBottomLeftRadius: inner,
          borderTopRightRadius: RADIUS,
          borderBottomRightRadius: RADIUS,
        }}
        transition={unit(snappy)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M4 20l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16z"
            initial={false}
            animate={{ pathLength: editing ? 0 : 1, opacity: editing ? 0 : 1 }}
            transition={unit(snappy)}
          />
          <motion.path
            d="M5 12.5 10 17.5 19 7"
            initial={false}
            animate={{ pathLength: editing ? 1 : 0, opacity: editing ? 1 : 0 }}
            transition={unit(snappy)}
          />
        </svg>
      </motion.button>
    </motion.div>
  )
}
