// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add toggle-group` 生成（#1796），行为底座是 Radix；
// 拷进来以后归我们改：样子照改前的皮肤（OpenMarket 实测，数值取自改前 src/ui/ui.css 的 .k-seg*）与我们的 token 重写（决策记录 0049）。
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { createContext, useContext, useId, type ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'

// 分段切换：照 OpenMarket。默认（设置页 segmented-control）：4px 内边 · 圆角 control · 5% 白底 10% 白边，按钮 24 高 · 圆角 inner，选中 700；
// sm（工具条 pill-container）：2px 内边 · 圆角 8 · 4% 白底，选中块圆角 6，跟着选中项滑动（snappy 弹簧）；按下缩到 .96。
// 选中项的底与字用 --seg-on-bg / --seg-on-ink（对容器底 ≥ 3:1，#477）；未选中项的字用 ink-200（ink-300 压在 4–5% 白的容器底上只有 4.4:1，#473）。
const toggleGroupVariants = cva('inline-flex gap-0.5', {
  variants: {
    variant: {
      default: 'box-border rounded-[var(--radius-control)] border border-alpha-white-9 bg-alpha-white-4 p-1',
      sm: 'box-border rounded-[8px] bg-alpha-white-3 p-0.5',
    },
  },
  defaultVariants: { variant: 'default' },
})

const toggleItemVariants = cva(
  [
    'k-text-data relative inline-flex cursor-pointer items-center border-0 bg-transparent leading-none whitespace-nowrap text-ink-2',
    'transition-[color,background-color] duration-[120ms] enabled:hover:text-ink',
    'disabled:cursor-not-allowed disabled:opacity-[0.28]',
    'data-[state=on]:enabled:hover:text-(--seg-on-ink)',
    focusRingInset,
  ],
  {
    variants: {
      variant: {
        default:
          'h-6 rounded-[var(--radius-inner)] px-3 data-[state=on]:bg-(--seg-on-bg) data-[state=on]:font-bold data-[state=on]:text-(--seg-on-ink)',
        sm: 'h-7 rounded-[6px] px-2 transition-[color,scale] duration-200 enabled:active:scale-[0.96] data-[state=on]:font-medium data-[state=on]:text-(--seg-on-ink)',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type Variant = 'default' | 'sm'
const Context = createContext<{
  variant: Variant
  layoutId: string
  value: string | null
  pillClassName?: string
  textClassName?: string
}>({ variant: 'default', layoutId: '', value: null })

// 单选，但底座用 Radix 的 type="multiple" 而不是 "single"：single 把每个按钮变成 role=radio / aria-checked，
// 应用里所有分段的读屏名与测试选择器都认 aria-pressed，改了是行为变化。multiple 的每个按钮就是 aria-pressed 的开关，整组是 role=group。
// 单选的语义由 onValueChange 保证：点已选中的项（会变成取消）被忽略，点别的项只上报那一项。
// rovingFocus 关掉：改前每个按钮都是 Tab 停靠点，不是方向键走的一组。
function ToggleGroup({
  className,
  variant = 'default',
  value,
  onValueChange,
  pillClassName,
  textClassName,
  children,
  ...props
}: Omit<ComponentProps<typeof ToggleGroupPrimitive.Root>, 'type' | 'value' | 'defaultValue' | 'onValueChange'> & {
  /** Skin: default is the bordered settings style, sm is the 26px toolbar style. */
  variant?: Variant
  /**
   * Extra class name on the selected pill.
   * 选中块、文字外壳上额外挂的类（应用里的样式与测试按这两个类找它们）。
   */
  pillClassName?: string
  /** Extra class name on the text wrapper. */
  textClassName?: string
  /**
   * The selected item; null means none is selected.
   * null：一个都没选。
   */
  value: string | null
  /** Called with the newly selected value. */
  onValueChange: (value: string) => void
}) {
  const layoutId = useId()
  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      rovingFocus={false}
      role="group"
      data-slot="toggle-group"
      data-variant={variant}
      value={value === null ? [] : [value]}
      onValueChange={(next) => {
        const picked = next.find((id) => id !== value)
        if (picked !== undefined) onValueChange(picked)
      }}
      className={cn(toggleGroupVariants({ variant }), className)}
      {...props}
    >
      <Context.Provider value={{ variant, layoutId, value, pillClassName, textClassName }}>{children}</Context.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  value,
  ...props
}: Omit<ComponentProps<typeof ToggleGroupPrimitive.Item>, 'value'> & {
  /** The value of this item. */
  value: string
}) {
  const group = useContext(Context)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      value={value}
      className={cn(toggleItemVariants({ variant: group.variant }), className)}
      {...props}
    >
      {/* 工具条样式的选中块：画在选中那一项里，换项时 layoutId 让它从上一项滑过来（snappy）。 */}
      {group.variant === 'sm' && group.value === value && (
        <motion.span
          aria-hidden="true"
          data-slot="toggle-group-pill"
          className={cn('absolute inset-0 rounded-[6px] bg-(--seg-on-bg)', group.pillClassName)}
          layoutId={group.layoutId}
          transition={snappy}
        />
      )}
      <span data-slot="toggle-group-text" className={cn('relative', group.textClassName)}>
        {children}
      </span>
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleItemVariants }
