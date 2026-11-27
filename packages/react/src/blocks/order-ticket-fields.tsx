// SPDX-License-Identifier: MIT
// 下单面板的 OKX 版式小件（用户 2026-11-27：「OKX 下单面板，一直没做得一样」）：标签在框上面的填色输入框、框内的价格步进、
// 框外的「最优价」钮、五个停靠点的比例滑杆、虚下划线的读数行。版式与尺寸量自 2026-11-27 在 okx.com BTCUSDT 永续页的实际截图（深色、300px 宽的面板、放大 1.22 倍），
// 颜色全落到我们的 token（Graphite），不取 OKX 的色值。只取「长什么样、怎么交互」，实现原创。
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Slider as SliderPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

/** 读数的标签：虚下划线（OKX 里点它出解释；这里只是样子，解释写在文档站）。 */
export const dashedLabel =
  'underline decoration-dashed decoration-1 underline-offset-[3px] decoration-(color:--k-content-secondary-foreground)'

/** 框上面的标签：12px、次级字色；可换成别的节点（填法下拉）。 */
export function BoxLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn('k-text-data flex h-5 items-center gap-1 font-medium text-ink', className)}>
      {children}
    </label>
  )
}

/**
 * 填色输入框：33 高、圆角 control、无边、读 --k-editable-background；聚焦时画一圈边。
 * stepper 给了就在框内右边画上下两个小箭头（竖线隔开，照 OKX 价格框）；trailing 在框外右边（「最优价」）。
 */
export function BoxInput({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  invalid,
  slot,
  stepper,
  trailing,
}: {
  id: string
  /** 读屏名；框上面的可见标签自己用 htmlFor 指向 id，所以这里只在标签不是 label 元素时给。 */
  label?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  slot?: string
  stepper?: { up: string; down: string; onStep: (direction: 1 | -1) => void }
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        data-slot="box-input"
        data-invalid={invalid || undefined}
        className={cn(
          'box-border flex h-10 min-w-0 flex-1 items-center rounded-[var(--radius-control)] border border-transparent bg-(--ticket-field) pl-[10px]',
          'focus-within:border-(color:--k-editable-borderColor-active) data-[invalid]:border-(color:--k-status-danger-foreground)',
          disabled && 'opacity-45',
        )}
      >
        <input
          id={id}
          data-slot={slot}
          aria-label={label}
          aria-invalid={invalid || undefined}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="h-full min-w-0 flex-1 border-0 text-[14px] bg-transparent p-0 tabular-nums text-ink outline-0 placeholder:text-ink-3 disabled:cursor-not-allowed"
        />
        {stepper ? (
          <span className="flex h-full w-6 shrink-0 flex-col border-l border-(color:--k-separable-bold-borderColor)">
            {([1, -1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                tabIndex={-1}
                disabled={disabled}
                aria-label={direction === 1 ? stepper.up : stepper.down}
                onClick={() => stepper.onStep(direction)}
                className="flex min-h-0 flex-1 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-ink-3 hover:text-ink disabled:cursor-not-allowed"
              >
                {direction === 1 ? (
                  <ChevronUp aria-hidden="true" className="size-[11px]" />
                ) : (
                  <ChevronDown aria-hidden="true" className="size-[11px]" />
                )}
              </button>
            ))}
          </span>
        ) : null}
      </span>
      {trailing}
    </div>
  )
}

/** 框外的小钮（最优价）：跟输入框同底同高，字带虚下划线，不画边。 */
export function BoxButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'k-text-data box-border h-10 min-w-[81px] shrink-0 cursor-pointer rounded-[var(--radius-control)] border-0 bg-(--ticket-field) px-3 font-normal text-ink transition-[background-color] duration-[120ms]',
        'not-disabled:hover:bg-(--ticket-field-hover) disabled:cursor-not-allowed disabled:opacity-45',
        focusRing,
        className,
      )}
    >
      <span className={dashedLabel}>{children}</span>
    </button>
  )
}

const STOPS = [0, 25, 50, 75, 100] as const
const DOT = 9

/**
 * 比例滑杆：一条细线，五个停靠点（0 / 25 / 50 / 75 / 100），当前点是空心环；点下面的数字或线上的点直接跳过去。
 * 行为底座是 Radix Slider（键盘 ← → Home End），步进 1。
 */
export function PercentSlider({
  value,
  onValueChange,
  label,
  disabled,
}: {
  value: number
  onValueChange: (value: number) => void
  label: string
  disabled?: boolean
}) {
  // 停靠点与把手同宽，中心都缩进半个点宽：两端不伸出轨道，Radix 摆把手的算法也是这样。
  const at = (percent: number) => `calc(${percent}% + ${(0.5 - percent / 100) * DOT}px)`
  return (
    <div data-slot="ticket-percent" className="flex flex-col">
      <SliderPrimitive.Root
        value={[value]}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        onValueChange={([next]) => onValueChange(next ?? 0)}
        className="relative flex h-[9px] w-full touch-none items-center select-none data-[disabled]:opacity-45"
      >
        <SliderPrimitive.Track className="relative h-px w-full grow bg-(--k-separable-primary-borderColor)">
          <SliderPrimitive.Range className="absolute h-full bg-(--k-content-secondary-foreground)" />
        </SliderPrimitive.Track>
        {STOPS.map((stop) => (
          <span
            key={stop}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 box-border size-[9px] -translate-y-1/2 rounded-full border',
              stop <= value
                ? 'border-(color:--k-content-secondary-foreground) bg-(--k-content-secondary-foreground)'
                : 'border-(color:--k-content-secondary-foreground) bg-(--k-surface-base-background)',
            )}
            style={{ left: `calc(${at(stop)} - ${DOT / 2}px)` }}
          />
        ))}
        <SliderPrimitive.Thumb
          aria-label={label}
          className={cn(
            'box-border block size-[9px] cursor-grab rounded-full border-2 border-ink bg-(--k-surface-base-background) active:cursor-grabbing',
            focusRing,
          )}
        />
      </SliderPrimitive.Root>
      <div className="relative mt-[2px] h-4" aria-hidden="true">
        {STOPS.map((stop) => (
          <button
            key={stop}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => onValueChange(stop)}
            className={cn(
              'k-text-caption absolute top-0 cursor-pointer border-0 bg-transparent p-0 text-ink-3 tabular-nums hover:text-ink-2 disabled:cursor-not-allowed',
              stop === 0 ? '' : stop === 100 ? '-translate-x-full' : '-translate-x-1/2',
            )}
            style={{ left: stop === 0 ? 0 : stop === 100 ? '100%' : `${stop}%` }}
          >
            {stop}%
          </button>
        ))}
      </div>
    </div>
  )
}

/** 两栏读数里的一行：标签（可虚下划线）后面跟数值，靠左的栏左对齐、靠右的栏右对齐。 */
export function InfoLine({
  label,
  children,
  end,
  dashed = true,
  slot,
  side,
  className,
}: {
  label: string
  children: ReactNode
  end?: boolean
  dashed?: boolean
  slot?: string
  side?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'k-text-data flex h-[20.5px] items-baseline gap-1 font-normal whitespace-nowrap',
        end && 'justify-end',
        className,
      )}
    >
      <span className={cn('text-ink-3', dashed && dashedLabel)}>{label}</span>
      <span data-slot={slot} data-side={side} className="tabular-nums text-ink">
        {children}
      </span>
    </div>
  )
}
