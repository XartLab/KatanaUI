// SPDX-License-Identifier: MIT
// 改自 SmoothUI radio-group（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：行为底座是 Radix RadioGroup，选中点弹进来的手感取自它，样子照我们的 Checkbox（14px 凹陷框）。
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

/** 单选组：竖排（默认）或横排；方向键在选项间移动并选中（Radix 的 roving focus）。 */
function RadioGroup({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      orientation={orientation}
      className={cn(orientation === 'vertical' ? 'grid gap-2' : 'flex flex-wrap items-center gap-4', className)}
      {...props}
    />
  )
}

// 单选钮：14 × 14 凹陷圆框；选中后框与底换亮中性（ink），中心一颗 6px 的深色点，点从小弹到位（theme/form-motion.css）。
// 文字由调用方包一层 Label（点文字也能选中）；没有可见文字时必须传 aria-label。
function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'peer inline-flex size-[14px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface-0 p-0',
        'shadow-[var(--recess)] transition-colors duration-150',
        'data-[state=checked]:border-ink data-[state=checked]:bg-ink',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'aria-invalid:border-danger',
        focusRing,
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="block size-[6px] rounded-full bg-surface-0"
      />
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
