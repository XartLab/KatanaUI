// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add` 生成（#1796）；
// 拷进来以后归我们改：样子照改前的皮肤（OpenMarket 实测，数值取自改前 src/ui/ui.css 的 .k-in）与我们的 token 重写（决策记录 0049）。
import { cva } from 'class-variance-authority'
import { useId, type ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'

// 文本框：照 OpenMarket frame-margin-input（2026-10-05 实测）。30 高 · 圆角 6 · 4% 白底 8% 白边 · 13px · 数字等宽；
// 聚焦边框提亮到 22% 白，焦点环画在里面（全局焦点环的画法，#471）。sm 是 26 高、字 12px。
// multiline：给 textarea 用，高度由 rows、min-height 与调用方的类定；竖向内边距为 0 是改前的样子（调用方各自按需要加）。
const inputVariants = cva(
  [
    'k-text-body box-border w-full py-0 rounded-[6px] border border-(color:--k-editable-borderColor) bg-(--k-editable-background) text-(color:--k-content-primary-foreground) tabular-nums',
    'transition-[border-color] duration-[120ms] placeholder:text-(color:--k-content-secondary-foreground) focus:border-(color:--k-editable-borderColor-active) aria-invalid:border-(color:--k-status-danger-foreground)',
    'disabled:cursor-not-allowed disabled:opacity-45',
    focusRingInset,
  ],
  {
    variants: {
      /** Height: md is 30px, sm is 26px with the data type size. */
      size: {
        md: 'h-[30px] px-2',
        sm: 'h-[26px] px-1.5 [font-size:var(--text-data-size)]',
      },
      multiline: { true: 'h-auto px-2', false: '' },
    },
    defaultVariants: { size: 'md', multiline: false },
  },
)

/**
 * Text field height: sm or md (default).
 * 尺寸统一 sm | md（体检 §4，G1）；'default' 是旧名，等于 md。
 */
type InputSize = 'sm' | 'md'

/** Maps the deprecated size name to the current one. */
const inputSizeOf = (size: InputSize | 'default' | null | undefined): InputSize => (size === 'sm' ? 'sm' : 'md')

function Input({
  className,
  size: sizeProp,
  floatingLabel,
  id,
  ...props
}: Omit<ComponentProps<'input'>, 'size'> & {
  /** Height: sm is 26px, md (default) is 30px; `'default'` is the deprecated name of md. */
  size?: InputSize | 'default' | null
  /**
   * Label that rests inside the box like a placeholder and floats into a 14px band above it on focus or when there is a value; the placeholder prop is ignored.
   * 浮动标签：静止时盖在框里，聚焦或有内容时缩小升到框上面一条 14px 的留白里（改自 SmoothUI float-input）；传了它，placeholder 不显示。
   */
  floatingLabel?: string
}) {
  const size = inputSizeOf(sizeProp)
  const autoId = useId()
  const input = (
    <input
      type="text"
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), floatingLabel && 'peer', className)}
      id={floatingLabel ? (id ?? autoId) : id}
      {...props}
      // 浮动标签靠 :placeholder-shown 判断有没有内容，所以占位必须是一个空格。
      placeholder={floatingLabel ? ' ' : props.placeholder}
    />
  )
  if (!floatingLabel) return input
  // 框高不变（30 或 26）；标签升起来的那一条 14px 留白是外壳的上内边距，常驻，布局不会因聚焦而跳。
  return (
    <span data-slot="input-float" data-size={size} className="relative block w-full pt-[14px]">
      {input}
      <label
        htmlFor={id ?? autoId}
        className={cn(
          'k-text-body pointer-events-none absolute left-2 origin-left text-(color:--k-content-secondary-foreground)',
          'top-[29px] [translate:0_-50%] data-[size=sm]:top-[27px]',
          'peer-focus:text-(color:--k-content-primary-foreground) peer-focus:[translate:-8px_calc(-50%-22px)] peer-focus:scale-[0.85]',
          'peer-[:not(:placeholder-shown)]:text-(color:--k-content-body-foreground) peer-[:not(:placeholder-shown)]:[translate:-8px_calc(-50%-22px)] peer-[:not(:placeholder-shown)]:scale-[0.85]',
          'peer-aria-invalid:text-(color:--k-status-danger-foreground)',
        )}
        data-size={size}
      >
        {floatingLabel}
      </label>
    </span>
  )
}

export { Input, inputSizeOf, inputVariants }
export type { InputSize }
