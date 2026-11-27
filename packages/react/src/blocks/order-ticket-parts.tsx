// SPDX-License-Identifier: MIT
// 下单面板与仓位计算器共用的小件（#96）：买卖切换、带标签与单位的数字框、读数行、数字格式。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Input } from '../primitives/input.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
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
  // 分段的 split 变体（#104）：各项分开成钮、整宽等分，选中项按 tone 填涨跌色。
  return (
    <ToggleGroup
      split
      fullWidth
      data-slot="ticket-side"
      aria-label={label}
      value={side}
      onValueChange={(value) => onSideChange(value as OrderSide)}
    >
      {(['buy', 'sell'] as const).map((value) => (
        <ToggleGroupItem key={value} value={value} data-side={value} tone={value === 'buy' ? 'up' : 'down'}>
          {value === 'buy' ? buy : sell}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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
  return (
    <div className="flex items-center gap-1">
      {/* 框、标签、单位都是 Input 的变体（caption / unit / align，#104）；这里只管下单面板的尺寸与框外的 trailing。 */}
      <Input
        caption={labelNode ?? label}
        unit={unit}
        align="end"
        wrapperClassName="h-(--k-size-base) flex-1"
        data-slot={slot}
        aria-label={labelNode ? label : undefined}
        aria-invalid={invalid || undefined}
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
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
        {note ? <span className="ml-1 text-ink-3">{note}</span> : null}
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
