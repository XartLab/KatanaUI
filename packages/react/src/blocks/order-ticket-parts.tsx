// SPDX-License-Identifier: MIT
// 下单面板与仓位计算器共用的小件（#96）：买卖切换、带标签与单位的数字框、读数行、数字格式。
import { useId, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { inputVariants } from '../primitives/input.tsx'
import type { OrderSide } from './sizing-model.ts'

const decimalsOf = (step: number): number => {
  const text = String(step)
  if (text.includes('e-')) return Number(text.split('e-')[1])
  return text.includes('.') ? text.split('.')[1].length : 0
}

export type TicketFormat = {
  price: (value: number) => string
  size: (value: number) => string
  money: (value: number) => string
  signed: (value: number) => string
  percent: (value: number) => string
}

/** 价格按 tick 的小数位、数量按步长的小数位、金额两位；带符号的金额正数写加号。 */
export function ticketFormat(locale: string | undefined, tickSize: number, lotSize: number): TicketFormat {
  const fixed = (digits: number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const price = fixed(decimalsOf(tickSize))
  const size = new Intl.NumberFormat(locale, { maximumFractionDigits: decimalsOf(lotSize) })
  const money = fixed(2)
  const signed = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  })
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
  return {
    price: (value) => price.format(value),
    size: (value) => size.format(value),
    money: (value) => money.format(value),
    signed: (value) => signed.format(value),
    percent: (value) => percent.format(value),
  }
}

/** Rounds a price to the tick and prints it without grouping, for putting back into an input. */
export function toTick(value: number, tickSize: number): string {
  return (Math.round(value / tickSize) * tickSize).toFixed(decimalsOf(tickSize))
}

/** 读输入框里的字：空、半截（"1."）、非数都当没填。 */
export function parseAmount(text: string): number {
  const value = Number(text.trim())
  return text.trim() !== '' && Number.isFinite(value) ? value : Number.NaN
}

/** 买 / 卖两个并排的开关（aria-pressed），选中的一边填涨跌色（买 --pnl-up、卖 --pnl-down，随主题的红涨绿跌设置走）。 */
export function SideSwitch({
  side,
  onSideChange,
  buy,
  sell,
  label,
}: {
  side: OrderSide
  onSideChange: (side: OrderSide) => void
  buy: string
  sell: string
  label: string
}) {
  return (
    <div role="group" aria-label={label} data-slot="ticket-side" className="grid grid-cols-2 gap-1">
      {(['buy', 'sell'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={side === value}
          data-side={value}
          onClick={() => onSideChange(value)}
          className={cn(
            'k-text-body h-(--k-size-base) cursor-pointer rounded-[6px] border font-semibold transition-[background-color,color] duration-[120ms]',
            side !== value &&
              'border-line bg-transparent text-ink-3 hover:bg-(--k-actionable-background-hover) hover:text-ink',
            side === value && 'border-transparent text-(color:--k-surface-sunken-background)',
            side === value && (value === 'buy' ? 'bg-(--pnl-up)' : 'bg-(--pnl-down)'),
            focusRing,
          )}
        >
          {value === 'buy' ? buy : sell}
        </button>
      ))}
    </div>
  )
}

/** 一行数字框：左边标签（可换成别的节点，比如填法下拉），右边单位；trailing 放在框外右侧（「最优价」这类按钮）。 */
export function TicketField({
  label,
  labelNode,
  unit,
  value,
  onValueChange,
  placeholder,
  disabled,
  invalid,
  trailing,
  slot,
}: {
  label: string
  labelNode?: ReactNode
  unit?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  trailing?: ReactNode
  slot?: string
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          'flex h-(--k-size-base) min-w-0 flex-1 items-center gap-2 rounded-[6px] border border-(color:--k-editable-borderColor) bg-(--k-editable-background) px-2',
          'focus-within:border-(color:--k-editable-borderColor-active)',
          invalid && 'border-(color:--k-status-danger-foreground)',
          disabled && 'opacity-45',
        )}
      >
        {labelNode ?? (
          <label htmlFor={id} className="k-text-caption shrink-0 text-ink-3">
            {label}
          </label>
        )}
        <input
          id={id}
          data-slot={slot}
          aria-label={labelNode ? label : undefined}
          aria-invalid={invalid || undefined}
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(
            inputVariants(),
            'h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-right outline-none focus-visible:outline-none',
          )}
        />
        {unit ? <span className="k-text-caption shrink-0 text-ink-3">{unit}</span> : null}
      </div>
      {trailing}
    </div>
  )
}

/** 读数行：左标签、右数值；tone 给盈亏上色，estimate 在标签后加「预估」字样。 */
export function ReadoutRow({
  label,
  value,
  tone,
  note,
  slot,
}: {
  label: string
  value: ReactNode
  tone?: 'up' | 'down'
  note?: string
  slot?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-3">
        {label}
        {note ? <span className="ml-1 text-ink-4">{note}</span> : null}
      </dt>
      <dd
        data-slot={slot}
        className={cn(
          'm-0 text-right tabular-nums text-ink-2',
          tone === 'up' && 'text-(color:--pnl-up)',
          tone === 'down' && 'text-(color:--pnl-down)',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
