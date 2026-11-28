// SPDX-License-Identifier: MIT
// 改自 SmoothUI radio-group（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：行为底座是 Radix RadioGroup，选中点弹进来的手感取自它，样子照我们的 Checkbox（14px 凹陷框）。
import { Radio, RadioGroup as RadioGroupRoot, RadioIndicator } from '@ui-sdk/react/radio'
import { createContext, use, type ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { legacyState, part } from '../lib/legacy-attrs.ts'
import { focusRing } from '../lib/focus.ts'

// 单选钮要知道组的方向（Radix 把 data-orientation 写在每个钮上）。
const OrientationContext = createContext<'horizontal' | 'vertical'>('vertical')

/** 单选组：竖排（默认）或横排；方向键在选项间移动并选中（UI SDK 的 roving focus）。 */
function RadioGroup({
  className,
  orientation = 'vertical',
  onValueChange,
  ...props
}: Omit<ComponentProps<typeof RadioGroupRoot>, 'onValueChange' | 'value' | 'defaultValue'> & {
  /** Selected value (controlled). */
  value?: string
  /** Selected value at first (uncontrolled). */
  defaultValue?: string
  /** Called with the chosen value. */
  onValueChange?: (value: string) => void
  /** Layout direction: vertical (default) or horizontal; also written to aria-orientation. */
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <OrientationContext value={orientation}>
      <RadioGroupRoot
        render={part('div', {
          slot: 'radio-group',
          extra: (p) => ({
            'data-orientation': orientation,
            'aria-required': p['aria-required'] ?? false,
          }),
        })}
        aria-orientation={orientation}
        onValueChange={(next) => {
          if (next !== null) onValueChange?.(next)
        }}
        className={cn(orientation === 'vertical' ? 'grid gap-2' : 'flex flex-wrap items-center gap-4', className)}
        {...props}
      />
    </OrientationContext>
  )
}

// 单选钮：14 × 14 凹陷圆框；选中后框与底换亮中性（ink），中心一颗 6px 的深色点，点从小弹到位（theme/form-motion.css）。
// 文字由调用方包一层 Label（点文字也能选中）；没有可见文字时必须传 aria-label。
function RadioGroupItem({ className, value, ...props }: ComponentProps<typeof Radio>) {
  const orientation = use(OrientationContext)
  return (
    <Radio
      value={value}
      render={part('button', {
        slot: 'radio-group-item',
        state: legacyState.checked,
        // Radix 的单选钮把 value 写在按钮上，选择器与测试用 [value=…] 认它。
        extra: () => ({ value: typeof value === 'string' ? value : undefined, 'data-orientation': orientation }),
      })}
      className={cn(
        'peer inline-flex size-[14px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-(color:--k-separable-bold-borderColor) bg-(--k-surface-sunken-background) p-0',
        'shadow-[var(--recess)] transition-colors duration-150',
        'data-[state=checked]:border-(color:--k-selectable-bold-background-selected) data-[state=checked]:bg-(--k-selectable-bold-background-selected)',
        // UI SDK 的禁用单选钮是 aria-disabled + data-disabled，没有原生 disabled。
        'disabled:cursor-not-allowed disabled:opacity-40 data-disabled:cursor-not-allowed data-disabled:opacity-40',
        'aria-invalid:border-(color:--k-status-danger-foreground)',
        focusRing,
        className,
      )}
      {...props}
    >
      <RadioIndicator
        render={part('span', { slot: 'radio-group-indicator', state: legacyState.checked })}
        className="block size-[6px] rounded-full bg-(--k-selectable-bold-foreground-selected)"
      />
    </Radio>
  )
}

export { RadioGroup, RadioGroupItem }
