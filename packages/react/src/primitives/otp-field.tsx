// SPDX-License-Identifier: MIT
// 改自 SmoothUI otp-field / otp-slots（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：格子的外观与入场手感取自它；
// 原件用 @base-ui 的 OTPField 或 input-otp，这里不加依赖，自己用一个透明的真输入框接键盘、粘贴与自动填充，格子只是它的画面。
import { useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

const SLOT = 26 // 格宽（px），外框滑动的距离按它算
const GAP = 6 // 格间距
const SEPARATOR = 10 // 分组之间的间隔宽
const PATTERNS = { digits: /[^0-9]/g, alphanumeric: /[^0-9A-Za-z]/g } as const

/**
 * 一次性验证码输入（交易二次验证、登录短信码）：每格一个字，输入时当前格的外框用弹簧滑到下一格，字翻进来。
 * 一个真 input 接键盘：只能在末尾输入与退格，整串粘贴与手机的短信自动填充（autocomplete=one-time-code）都能用；不支持方向键在格间移动，错了退格重来。
 * 读屏名必须传 aria-label；格子是画面，对读屏隐藏。填满时调 onComplete。
 */
function OtpField({
  length = 6,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onComplete,
  mask = false,
  groupSize,
  pattern = 'digits',
  invalid = false,
  disabled = false,
  autoFocus = false,
  name,
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'maxLength' | 'pattern' | 'size'> & {
  /** Number of cells. */
  length?: number
  /** The code typed so far (controlled). */
  value?: string
  /** The initial code (uncontrolled). */
  defaultValue?: string
  /** Called with the filtered code on every change. */
  onValueChange?: (value: string) => void
  /** Called once when every cell is filled. */
  onComplete?: (value: string) => void
  /** Show a dot instead of each character (shared screens). */
  mask?: boolean
  /** Insert a gap after every this many cells, for example 3 for 123 456. */
  groupSize?: number
  /** Which characters are accepted: digits only, or letters and digits. */
  pattern?: keyof typeof PATTERNS
  /** Show the danger border and set aria-invalid. */
  invalid?: boolean
  /** Dim the cells and ignore the keyboard. */
  disabled?: boolean
  /** Focus the field on mount. */
  autoFocus?: boolean
  /** Form field name of the real input. */
  name?: string
  /** Accessible name (required). */
  'aria-label': string
}) {
  const [inner, setInner] = useState(defaultValue.replace(PATTERNS[pattern], '').slice(0, length))
  const value = valueProp ?? inner
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()

  const apply = (raw: string) => {
    const next = raw.replace(PATTERNS[pattern], '').slice(0, length)
    if (valueProp === undefined) setInner(next)
    if (next !== value) {
      onValueChange?.(next)
      if (next.length === length) onComplete?.(next)
    }
  }
  const onChange = (event: ChangeEvent<HTMLInputElement>) => apply(event.target.value)
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    apply(value + event.clipboardData.getData('text'))
  }
  // 光标永远在末尾：点哪一格都回到末尾，输入与退格才对得上格子。
  const toEnd = () => {
    const el = input.current
    if (el) el.setSelectionRange(value.length, value.length)
  }

  const active = Math.min(value.length, length - 1)
  const group = groupSize && groupSize > 0 ? groupSize : length
  // 外框的横向位置：前面的格子数 × (格宽 + 间距) + 前面经过的分组间隔数 × (间隔宽 + 间距)。
  const frameX = active * (SLOT + GAP) + Math.floor(active / group) * (SEPARATOR + GAP)
  const cells = Array.from({ length }, (_, index) => index)

  return (
    <div
      data-slot="otp-field"
      data-focused={focused ? '' : undefined}
      data-invalid={invalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn('relative inline-flex items-center gap-[6px]', disabled && 'opacity-45', className)}
    >
      {cells.map((index) => {
        const char = value[index]
        return (
          <span key={index} className="contents">
            {index > 0 && index % group === 0 ? (
              <span
                aria-hidden="true"
                data-slot="otp-separator"
                className="h-px bg-(--k-separable-bold-borderColor)"
                style={{ width: SEPARATOR }}
              />
            ) : null}
            <span
              aria-hidden="true"
              data-slot="otp-slot"
              data-filled={char ? '' : undefined}
              data-active={focused && index === active ? '' : undefined}
              className={cn(
                'k-text-body relative box-border grid h-(--k-size-base) shrink-0 place-items-center rounded-[6px] border border-(color:--k-editable-borderColor) bg-(--k-editable-background) font-medium text-(color:--k-content-primary-foreground) tabular-nums',
                'transition-[border-color,background-color] duration-[120ms] data-[filled]:border-(color:--k-editable-borderColor-filled) data-[filled]:bg-(--k-editable-background-filled)',
                invalid &&
                  'border-(color:--k-status-danger-foreground) data-[filled]:border-(color:--k-status-danger-foreground)',
              )}
              style={{ width: SLOT }}
            >
              {char ? (
                // key 带字符本身：换了字就重新挂载，翻进来的动画再放一遍。
                <span key={char} data-slot="otp-char" className="block">
                  {mask ? '•' : char}
                </span>
              ) : focused && index === active ? (
                <span
                  aria-hidden="true"
                  data-slot="otp-caret"
                  className="h-4 w-px bg-(--k-content-primary-foreground)"
                />
              ) : null}
            </span>
          </span>
        )
      })}
      {/* 当前格的外框：一块绝对定位的描边，聚焦时显示，换格时滑过去（snappy）。 */}
      <span
        aria-hidden="true"
        data-slot="otp-frame"
        className={cn(
          'pointer-events-none absolute top-0 left-0 box-border h-(--k-size-base) rounded-[6px] border border-(color:--k-editable-bold-borderColor-active) transition-opacity duration-[120ms]',
          focused ? 'opacity-100' : 'opacity-0',
          invalid && 'border-(color:--k-status-danger-foreground)',
        )}
        style={{ width: SLOT, translate: `${frameX}px 0` }}
      />
      <input
        ref={input}
        id={id}
        name={name}
        data-slot="otp-input"
        type="text"
        inputMode={pattern === 'digits' ? 'numeric' : 'text'}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        onChange={onChange}
        onPaste={onPaste}
        onFocus={() => {
          setFocused(true)
          toEnd()
        }}
        onBlur={() => setFocused(false)}
        onSelect={toEnd}
        // 全透明的真输入框盖在整排格子上：点哪里都聚焦它；文字与光标都不画（画面由格子负责）。
        className="absolute inset-0 size-full cursor-text border-0 bg-transparent p-0 text-transparent caret-transparent opacity-0 outline-0 selection:bg-transparent disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  )
}

export { OtpField }
