// SPDX-License-Identifier: MIT
import { Minus, Plus } from 'lucide-react'
import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Input } from '../primitives/input.tsx'
import {
  EnsureTooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../primitives/tooltip.tsx'
import { stepDecimal } from '../lib/chart/format/index.ts'

// 十进制字符串框（价格、数量）：值是字符串，不经 JS 数字（决策记录 0014），按品种的最小变动价位或最小下单量走一格。
// 从下单面板的 StepField 收进来（#1955）；外观与行为照原来的样子：一个输入框 + 右边两个图标按钮，不给用户设步长
// （用户 2026-10-18：TradingView 数量框右边的「1 unit ▾」是换算读数，不是步长）。
// 键盘照 WAI-ARIA 数字微调框的习惯：↑ / ↓ 走一格，Shift 十格（NumberInput 的 PageUp / PageDown 不学：步长这里由品种定，十格只给 Shift）。
// 打字自由：框里合不合法、在不在价位上由调用方与 Gateway 判。属性设计学 Salt 的 NumberInput（readOnly、validationStatus、decimalScale；
// 2026-11-14 读），只取属性名，实现为本仓库原创。

/** Shift + 方向键走几格。 */
const SHIFT_STEPS = 10

/** Texts of DecimalField (the package ships no text). */
export type DecimalFieldLabels = {
  /** Accessible name and hover tip of the − button. −钮的读屏名与悬停提示。 */
  decrease: string
  /** Accessible name and hover tip of the + button. +钮的读屏名与悬停提示。 */
  increase: string
}

export type DecimalFieldProps = {
  /** The value as a decimal string (never goes through a JS number). */
  value: string
  /** Called with the new string on typing, arrow keys and the buttons. */
  onValueChange?: (value: string) => void
  /** Old name of onValueChange, kept for one release. @deprecated Use onValueChange. */
  onValue?: (value: string) => void
  /** 一格有多大（最小变动价位或最小下单量）；'0' 按 1 走。 */
  step: string
  /** 空框时走格子从哪起（例：最新价）；没有就空框不动。 */
  base?: string | null
  /** 读屏名（必填：包里没有文字）。 */
  label: string
  /** 框里右侧的单位后缀，只读不可点。 */
  unit?: string
  placeholder?: string
  disabled?: boolean
  /** 只读：能选能复制，方向键与按钮都不改值。 */
  readOnly?: boolean
  /** error 设 aria-invalid 并换危险色边；warning 只换琥珀色边，不设 aria-invalid。 */
  status?: 'error' | 'warning'
  /** Given: − / + buttons appear; the texts are their accessible names and hover tips. 给了才显示 − / + 按钮。 */
  labels?: DecimalFieldLabels
  /** Old name of labels, kept for one release. @deprecated Use labels. */
  buttons?: DecimalFieldLabels
  className?: string
} & Omit<
  ComponentProps<'input'>,
  | 'value'
  | 'onChange'
  | 'type'
  | 'size'
  | 'step'
  | 'children'
  | 'className'
  | 'aria-label'
  | 'aria-invalid'
  | 'disabled'
  | 'readOnly'
  | 'placeholder'
>

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  const button = (
    <Button variant="icon" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  )
  // 禁用的按钮收不到指针事件，提示也就没有意义；直接不包。
  if (disabled) return button
  return (
    <EnsureTooltipProvider>
      <Tooltip disableHoverableContent>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom" aria-label={label}>
          {label}
        </TooltipContent>
      </Tooltip>
    </EnsureTooltipProvider>
  )
}

/** Decimal-string field for prices and quantities: arrow keys and optional − / + buttons step by the instrument's tick or lot. */
export function DecimalField({
  value,
  onValueChange,
  onValue: legacyOnValue,
  step,
  base = null,
  label,
  unit,
  placeholder,
  disabled,
  readOnly,
  status,
  labels,
  buttons: legacyButtons,
  className,
  onKeyDown,
  style,
  ...rest
}: DecimalFieldProps) {
  const onValue = (next: string) => (onValueChange ?? legacyOnValue)?.(next)
  const buttons = labels ?? legacyButtons
  const frozen = Boolean(disabled || readOnly)
  const nudge = (direction: 1 | -1, multiplier = 1) => {
    if (frozen) return
    const next = stepDecimal(value, base, step, direction, multiplier)
    if (next !== null) onValue(next)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 组字中的键（选字的 Enter、取消候选词的 Esc、选候选的 ↑ ↓）不是提交 / 取消 / 改价，连调用方的 onKeyDown 也不传：
    // 调用方常在价格框上自己接 Enter 下单。Safari 上屏那一下 isComposing 已是 false、keyCode 仍是 229，两个都要判。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    onKeyDown?.(event)
    if (event.defaultPrevented || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
    // 只读与禁用时方向键什么也不做；输入框自己的光标移动（Home / End 的效果）也不要。
    event.preventDefault()
    nudge(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey ? SHIFT_STEPS : 1)
  }
  return (
    <div data-slot="decimal-field" data-status={status} className={cn('flex items-center gap-1', className)}>
      <div className="relative min-w-0 flex-1">
        <Input
          {...rest}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-label={label}
          aria-invalid={status === 'error' ? true : undefined}
          data-status={status}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(event) => onValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="aria-invalid:border-danger data-[status=warning]:border-(--k-status-warn-foreground)"
          style={unit ? { ...style, paddingRight: `${unit.length + 2}ch` } : style}
        />
        {unit ? (
          <span
            aria-hidden="true"
            data-slot="decimal-field-unit"
            className="k-text-data pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-3"
          >
            {unit}
          </span>
        ) : null}
      </div>
      {buttons ? (
        // − 与 + 共用一个 Provider：从一个移到另一个，400ms 内立即出（kubai 025，#251）。
        <TooltipProvider>
          <StepButton label={buttons.decrease} disabled={frozen} onClick={() => nudge(-1)}>
            <Minus aria-hidden="true" />
          </StepButton>
          <StepButton label={buttons.increase} disabled={frozen} onClick={() => nudge(1)}>
            <Plus aria-hidden="true" />
          </StepButton>
        </TooltipProvider>
      ) : null}
    </div>
  )
}
