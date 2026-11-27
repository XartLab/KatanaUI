// SPDX-License-Identifier: MIT
// 改自 SmoothUI input-group（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：一个外框包住输入框与前后附件，里面的 Input 去掉自己的边与底。
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

// 外框是 Input 的皮肤（30 高 · 圆角 6 · 4% 白底 7% 白边）；里面带 data-slot="input" 的件被压成无边无底、撑满剩余宽度。
// 焦点环画在外框里（has-focus-visible），而不是里面的输入框，附件区也一起亮；无效与禁用也看里面输入框的状态。
function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="group"
      data-slot="input-group"
      className={cn(
        'box-border flex h-[30px] w-full min-w-0 items-center overflow-hidden rounded-[var(--radius-control)] border border-(color:--k-editable-borderColor) bg-(--k-editable-background)',
        'transition-[border-color] duration-[120ms] has-[[data-slot=input]:focus]:border-(color:--k-editable-borderColor-active)',
        'has-[[data-slot=input]:focus-visible]:outline-(length:--k-focused-outlineWidth) has-[[data-slot=input]:focus-visible]:-outline-offset-2 has-[[data-slot=input]:focus-visible]:outline-(color:--k-focused-outlineColor)',
        'has-[[data-slot=input][aria-invalid=true]]:border-(color:--k-status-danger-foreground) has-[[data-slot=input]:disabled]:cursor-not-allowed has-[[data-slot=input]:disabled]:opacity-45',
        '[&_[data-slot=input]]:h-full [&_[data-slot=input]]:min-w-0 [&_[data-slot=input]]:flex-1 [&_[data-slot=input]]:rounded-none [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:outline-0',
        className,
      )}
      {...props}
    />
  )
}

/** 前后附件：放图标、单位或按钮；align 决定它在输入框前（start）还是后（end）。 */
function InputGroupAddon({
  align = 'start',
  className,
  ...props
}: ComponentProps<'div'> & {
  /** Put the addon before the input (start) or after it (end). */
  align?: 'start' | 'end'
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        'flex shrink-0 items-center gap-1 text-(color:--k-content-secondary-foreground) [&_svg]:size-[13px]',
        align === 'start' ? 'order-first pl-2' : 'order-last pr-2',
        className,
      )}
      {...props}
    />
  )
}

/** 附件里的一段字：币种、单位、前缀这类，不可选中。 */
function InputGroupText({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="input-group-text"
      className={cn('k-text-data select-none text-(color:--k-content-secondary-foreground)', className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupText }
