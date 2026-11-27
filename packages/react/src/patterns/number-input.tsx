// SPDX-License-Identifier: MIT
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { SCRUB_THRESHOLD_PX, nudged, scrubMode, scrubbed, typed, type ScrubMode } from './number-field-model.ts'
import { evaluateInput, typedLive } from './number-expression.ts'

// 组件卡 Controls · 数字框。外观是卡上的皮肤（theme/number-input.css）。

/**
 * Number box: a value with an optional unit suffix; type, use the arrow keys or drag left and right to change it.
 * 数字框：一个框，值 + 可选的单位后缀，没有滑块、没有 −/+ 按钮。三种改法：
 * 直接打字（越界夹进范围）、上下方向键（按步长，Shift 或 PageUp/PageDown 十档，Alt 精调）、按住左右拖（Shift 粗调、Alt 精调，规则见 number-field-model）。
 * 角色是 spinbutton（WAI-ARIA 数字微调框模式）：带当前值、范围，有单位时带「值 + 单位」的文字。
 * 只在值合法时回调，空串不回调；回调的值一定在 min / max 之内。
 * expression 打开后框里还能写算式（`+10%`、`*2`、`100*1.5`，规则见 number-expression），回车或离开时按当前值算；caption 是框内左边的文字标签，
 * 同样是拖动区（功能参照 Arc Scrub input，uiarc.dev/docs/components/scrub-input，2026-11-14 读，实现原创）。
 */
export type NumberInputProps = {
  /** The current value. */
  value: number
  /** Called when the value changes; empty or non-numeric input does not call it. Values are always within min / max. */
  onValueChange?: (value: number) => void
  /** Old name of onValueChange, kept for one release. @deprecated Use onValueChange. */
  onValue?: (value: number) => void
  /** Unit suffix; when given, screen readers read the value together with the unit. */
  unit?: string
  /** Lower bound; values below it are clamped. */
  min?: number
  /** Upper bound; values above it are clamped. */
  max?: number
  /** Step size. */
  step?: number
  /** sm is 26px high; md (the default) is 30px. */
  size?: 'sm' | 'md'
  /** Width of the box in px. */
  width?: number
  /** Accessible name. */
  label?: string
  /** Show the red border. */
  invalid?: boolean
  /**
   * Greyed out: cannot type, drag, or step with the arrow keys.
   * 灰掉：不能打字、不能拖、方向键不动它。
   */
  disabled?: boolean
  /**
   * Sentinel value (for example -1 or 0 meaning automatic): while the value equals it and the user is not typing, the box shows autoText.
   * 哨兵值（例：-1、0 表示「自动」）：值等于它、又没在打字时，框里写 autoText，不把内部的数露给用户。
   */
  autoValue?: number
  /** Text shown in place of the sentinel value. */
  autoText?: string
  /**
   * Allow typing an expression, evaluated on Enter or blur (Esc discards); text that is not an expression turns red.
   * 框里可以写算式：回车或离开时算（Esc 放弃）。写不成算式的字标红。
   */
  expression?: boolean
  /**
   * Text label inside the box on the left (dragging it changes the value like dragging the box); the accessible name still comes from label.
   * 框内左边的文字标签（拖它与拖整个框一样改值）；读屏名仍由 label 给。
   */
  caption?: string
}

/** Number box (spinbutton): type, arrow keys or drag to change the value. */
export function NumberInput({
  value,
  onValueChange,
  onValue,
  unit,
  min,
  max,
  step = 1,
  size,
  width = 96,
  label,
  invalid,
  disabled,
  autoValue,
  autoText,
  expression,
  caption,
}: NumberInputProps) {
  const autoShown = autoText !== undefined && value === autoValue
  const [draft, setDraft] = useState<string | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  // 拖动：anchor 是「从哪个横坐标、哪个值算起」。中途换了修饰键（精细 ↔ 粗调）就把锚点挪到当前位置，值才不会跳。
  const drag = useRef<{
    pointer: number
    startX: number
    anchorX: number
    anchorValue: number
    mode: ScrubMode
    last: number
    moved: boolean
  } | null>(null)
  const range = { min, max, step }

  const emit = onValueChange ?? onValue
  const commit = (next: number) => {
    if (next !== value) emit?.(next)
  }
  // 算式：草稿不是空、也算不出就标红；回车与离开时把草稿算成值。
  const evaluated = expression && draft !== null ? evaluateInput(draft, value, range) : null
  const badExpression = expression && draft !== null && draft.trim() !== '' && evaluated === null
  const settle = () => {
    if (evaluated !== null) commit(evaluated)
    setDraft(null)
  }

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    // 正在打字（输入框有焦点）时按下去是选字，不拖；只响应主键。
    if (disabled || event.button !== 0 || document.activeElement === input.current) return
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      anchorX: event.clientX,
      anchorValue: value,
      mode: scrubMode({ shift: event.shiftKey, alt: event.altKey }),
      last: value,
      moved: false,
    }
  }
  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId) return
    if (!state.moved) {
      if (Math.abs(event.clientX - state.startX) < SCRUB_THRESHOLD_PX) return
      state.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      // 按下时输入框已经拿到焦点了（点进去打字的默认行为）：拖起来就不是打字，放开焦点、清掉选区。
      input.current?.blur()
      window.getSelection()?.removeAllRanges()
      setDraft(null)
      setScrubbing(true)
    }
    const mode = scrubMode({ shift: event.shiftKey, alt: event.altKey })
    if (mode !== state.mode) {
      state.mode = mode
      state.anchorX = event.clientX
      state.anchorValue = state.last
    }
    const next = scrubbed(state.anchorValue, event.clientX - state.anchorX, mode, range)
    if (next !== state.last) {
      state.last = next
      emit?.(next)
    }
  }
  const endDrag = (event: PointerEvent<HTMLSpanElement>) => {
    if (drag.current?.pointer !== event.pointerId) return
    if (drag.current.moved) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null
    setScrubbing(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // ime-safe-enter-submit：这是文本 input，输入法组合中的回车（选词）不应提交数值。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    const keys = { shift: event.shiftKey, alt: event.altKey }
    let next: number | null = null
    if (event.key === 'ArrowUp') next = nudged(value, 1, keys, range)
    else if (event.key === 'ArrowDown') next = nudged(value, -1, keys, range)
    else if (event.key === 'PageUp') next = nudged(value, 1, keys, range, true)
    else if (event.key === 'PageDown') next = nudged(value, -1, keys, range, true)
    else if (event.key === 'Home' && min !== undefined && event.ctrlKey) next = min
    else if (event.key === 'End' && max !== undefined && event.ctrlKey) next = max
    else if (event.key === 'Enter') {
      settle()
      return
    } else if (event.key === 'Escape') setDraft(null)
    else return
    if (next === null) return
    event.preventDefault()
    setDraft(null)
    commit(next)
  }

  return (
    <span
      className={`k-num${size === 'sm' ? ' sm' : ''}${invalid || badExpression ? ' err' : ''}${disabled ? ' dis' : ''}${scrubbing ? ' scrubbing' : ''}`}
      style={{ width }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {caption && (
        <span className="k-cap" aria-hidden="true">
          {caption}
        </span>
      )}
      <input
        ref={input}
        role="spinbutton"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid || badExpression ? true : undefined}
        disabled={disabled}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={autoShown ? autoText : unit ? `${value} ${unit}` : undefined}
        value={draft ?? (autoShown ? autoText : String(value))}
        onChange={(event) => {
          setDraft(event.target.value)
          const next = expression ? typedLive(event.target.value, range) : typed(event.target.value, range)
          if (next !== null) commit(next)
        }}
        onKeyDown={onKeyDown}
        onFocus={autoShown ? (event) => event.target.select() : undefined}
        onBlur={settle}
      />
      {unit && <span className="k-unit">{unit}</span>}
    </span>
  )
}
