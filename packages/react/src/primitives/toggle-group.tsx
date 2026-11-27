// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add toggle-group` 生成（#1796），行为底座是 UI SDK 的 ToggleGroup（#263 从 Radix 换来）；
// 拷进来以后归我们改：样子照改前的皮肤（OpenMarket 实测，数值取自改前 src/ui/ui.css 的 .k-seg*）与我们的 token 重写（决策记录 0049）。
import { cva } from 'class-variance-authority'
import { motion } from 'motion/react'
import { Toggle as ToggleItem, ToggleGroup as ToggleGroupRoot } from '@ui-sdk/react/toggle'
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing, focusRingInset } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { slotName } from '../lib/slot-name.ts'

// 分段切换：照 OpenMarket。md（默认，设置页 segmented-control）：4px 内边 · 圆角 control · 5% 白底 10% 白边，按钮 24 高 · 圆角 inner，选中 700；
// sm（工具条 pill-container）：2px 内边 · 圆角 8 · 4% 白底，选中块圆角 6，跟着选中项滑动（snappy 弹簧）；按下缩到 .96。
// 选中项的底与字用 --seg-on-bg / --seg-on-ink（对容器底 ≥ 3:1，#477）；未选中项的字用 ink-200（ink-300 压在 4–5% 白的容器底上只有 4.4:1，#473）。
const toggleGroupVariants = cva('inline-flex gap-0.5', {
  variants: {
    size: {
      md: 'box-border rounded-[var(--radius-control)] border border-(color:--k-selectable-groupBorderColor) bg-(--k-selectable-groupBackground) p-1',
      sm: 'box-border rounded-[var(--radius-overlay)] bg-(--k-selectable-subtle-groupBackground) p-0.5',
    },
  },
  defaultVariants: { size: 'md' },
})

// split（买卖这类各占一格的开关，#104）：不要容器底与边，每一项自带边、项间留 4px；选中项填满，tone 给涨跌色（买 --pnl-up、卖 --pnl-down，随主题红涨绿跌走）。
// 没有滑块（选中是整格换色），所以不画 pill。
const splitItemVariants = cva([
  'k-text-body relative inline-flex h-(--k-size-base) cursor-pointer items-center justify-center rounded-[var(--radius-control)] border px-3 font-semibold whitespace-nowrap',
  'transition-[background-color,color] duration-[120ms] disabled:cursor-not-allowed disabled:opacity-[0.28]',
  'border-line bg-transparent text-ink-3 not-data-pressed:enabled:hover:bg-(--k-actionable-background-hover) not-data-pressed:enabled:hover:text-ink',
  'data-pressed:border-transparent data-pressed:bg-(--seg-on-bg) data-pressed:text-(--seg-on-ink)',
  focusRing,
])
const splitToneClass = {
  up: 'data-pressed:bg-(--pnl-up) data-pressed:text-(color:--k-surface-sunken-background)',
  down: 'data-pressed:bg-(--pnl-down) data-pressed:text-(color:--k-surface-sunken-background)',
} as const

const toggleItemVariants = cva(
  [
    'k-text-data relative inline-flex cursor-pointer items-center border-0 bg-transparent leading-none whitespace-nowrap text-(color:--k-content-body-foreground)',
    'transition-[color,background-color] duration-[120ms] enabled:hover:text-(color:--k-content-primary-foreground)',
    'disabled:cursor-not-allowed disabled:opacity-[0.28]',
    'data-pressed:enabled:hover:text-(--seg-on-ink)',
    focusRingInset,
  ],
  {
    variants: {
      size: {
        md: 'h-6 rounded-[var(--radius-inner)] px-3 data-pressed:bg-(--seg-on-bg) data-pressed:font-bold data-pressed:text-(--seg-on-ink)',
        sm: 'h-7 rounded-[var(--radius-control)] px-2 transition-[color,scale] duration-200 enabled:active:scale-[0.96] data-pressed:font-medium data-pressed:text-(--seg-on-ink)',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/**
 * Segmented control size: md is the bordered settings style, sm the 26px toolbar style.
 * 体检 §4：原来叫 variant（default | sm），其实是尺寸，改名 size（sm | md）；variant 留一个版本作兼容。
 */
type ToggleGroupSize = 'sm' | 'md'
const Context = createContext<{
  size: ToggleGroupSize
  split: boolean
  fullWidth: boolean
  layoutId: string
  value: string | null
  children?: ReactNode
  pillClassName?: string
  textClassName?: string
}>({ size: 'md', split: false, fullWidth: false, layoutId: '', value: null })

// 单选，底座用 UI SDK 的 ToggleGroup（多选模式，每个按钮是 aria-pressed 的开关，整组 role=group；读屏名与测试选择器都认 aria-pressed）。
// 单选的语义由 onValueChange 保证：点已选中的项（会变成取消）被忽略，点别的项只上报那一项。
// 键盘：方向键在项之间走，Tab 只停一个（WAI-ARIA 的 toolbar / radio 模式；以前每个按钮都是 Tab 停靠点，用户 2026-11-27 定，#263）。
function ToggleGroup({
  className,
  size: sizeProp,
  variant,
  fullWidth,
  split = false,
  value,
  onValueChange,
  pillClassName,
  textClassName,
  children,
  ...props
}: Omit<
  ComponentProps<typeof ToggleGroupRoot>,
  'children' | 'type' | 'multiple' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  /** Size: md (default) is the bordered settings style, sm is the 26px toolbar style. */
  size?: ToggleGroupSize
  /**
   * Old name of size: 'default' is md, 'sm' is sm.
   * @deprecated Use `size`.
   */
  variant?: 'default' | 'sm'
  /**
   * Stretch the group to the full width and give every item an equal share.
   * 撑满整行，各项等分宽度。
   */
  fullWidth?: boolean
  /**
   * Separate buttons, each with its own border and a small gap, instead of one shared container; the selected one is filled (no sliding pill). Pair with `tone` on the items for a buy / sell switch.
   * 各项分开成钮：不要共用的容器底与边，每项自带边、留小缝；选中的整格填色（没有滑块）。配合项上的 tone 做买卖开关。
   */
  split?: boolean
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
  const size: ToggleGroupSize = sizeProp ?? (variant === 'sm' ? 'sm' : 'md')
  const layoutId = useId()
  return (
    <ToggleGroupRoot
      multiple
      render={slotName((props['data-slot'] as string | undefined) ?? 'toggle-group', 'div')}
      data-size={size}
      value={value === null ? [] : [value]}
      onValueChange={(next) => {
        const picked = next.find((id) => id !== value)
        if (picked !== undefined) onValueChange(picked)
      }}
      data-split={split || undefined}
      className={cn(
        split ? 'flex gap-1' : toggleGroupVariants({ size }),
        fullWidth && (split ? 'w-full' : 'flex w-full'),
        className,
      )}
      {...props}
    >
      <Context.Provider value={{ size, split, fullWidth: !!fullWidth, layoutId, value, pillClassName, textClassName }}>
        {children}
      </Context.Provider>
    </ToggleGroupRoot>
  )
}

function ToggleGroupItem({
  className,
  children,
  value,
  tone,
  ...props
}: Omit<ComponentProps<typeof ToggleItem>, 'value' | 'children'> & {
  children?: ReactNode
  /** The value of this item. */
  value: string
  /**
   * Fill colour of the selected item in a `split` group: up (--pnl-up) or down (--pnl-down); follows the theme's red-up / green-down setting.
   * split 组里选中项的填色：up 取 --pnl-up，down 取 --pnl-down，随主题的红涨绿跌设置走。
   */
  tone?: 'up' | 'down'
}) {
  const group = useContext(Context)
  return (
    <ToggleItem
      render={slotName(
        (props['data-slot' as keyof typeof props] as string | undefined) ?? 'toggle-group-item',
        'button',
      )}
      value={value}
      data-tone={tone}
      className={cn(
        group.split ? [splitItemVariants(), tone && splitToneClass[tone]] : toggleItemVariants({ size: group.size }),
        // 整宽的组里各项等分（min-w-0：长文字不撑开别的项）。
        group.fullWidth && 'min-w-0 flex-1 justify-center',
        className,
      )}
      {...props}
    >
      {/* 工具条样式的选中块：画在选中那一项里，换项时 layoutId 让它从上一项滑过来（snappy）。 */}
      {!group.split && group.size === 'sm' && group.value === value && (
        <motion.span
          aria-hidden="true"
          data-slot="toggle-group-pill"
          className={cn('absolute inset-0 rounded-[var(--radius-control)] bg-(--seg-on-bg)', group.pillClassName)}
          layoutId={group.layoutId}
          transition={snappy}
        />
      )}
      <span data-slot="toggle-group-text" className={cn('relative', group.textClassName)}>
        {children}
      </span>
    </ToggleItem>
  )
}

export { ToggleGroup, ToggleGroupItem, toggleGroupVariants, toggleItemVariants }
export type { ToggleGroupSize }
