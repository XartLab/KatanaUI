// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui 的 card（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn；部件划分 Card / Header / Title / Description / Action / Content / Footer 与 data-slot 照它），
// 2026-11-23 手抄进来（#104 对照 Salt：原来只有指标卡、玻璃卡、可展开卡这些专用卡，没有通用的 Card 容器）；拷进来以后归我们改：尺寸、颜色按我们的 token 重写（决策记录 0049）。
// 变体照 Salt Card（@salt-ds/core，Apache-2.0）：primary / secondary / tertiary 三档底色加 ghost（不画底与边）；可点的卡照 Salt 的 InteractableCard，
// 这里不另起一个件：interactive 加悬停提亮，配 asChild 让整张卡就是那个 a 或 button（键盘、读屏都是原生的）。只取结构，没有搬 Salt 的代码。
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 卡：圆角 --radius-control、1px container-subtle 边、内距 12、部件间距 10；primary 是 container-primary 的底（最亮）、secondary（默认）次之、tertiary 再次，
// ghost 透明无边（排版用，不画框）。interactive：悬停换成 actionable 的 hover 底、边提到 container-bold、按下缩到 0.99，焦点环同按钮。
const cardVariants = cva(
  'k-text-body flex flex-col gap-2.5 rounded-[var(--radius-control)] border p-3 text-(color:--k-content-body-foreground)',
  {
    variants: {
      /** Fill of the card: secondary (default), primary, tertiary, or ghost (no fill, no edge). */
      variant: {
        primary: 'border-(color:--k-container-subtle-borderColor) bg-(--k-container-primary-background)',
        secondary: 'border-(color:--k-container-subtle-borderColor) bg-(--k-container-secondary-background)',
        tertiary: 'border-(color:--k-container-subtle-borderColor) bg-(--k-container-tertiary-background)',
        ghost: 'border-transparent bg-transparent',
      },
      /** Hover and press feedback for a card that is itself a link or a button (use with asChild). */
      interactive: {
        true: [
          'cursor-pointer no-underline transition-[background-color,border-color,scale] duration-150',
          'hover:border-(color:--k-container-bold-borderColor) hover:bg-(--k-actionable-background-hover) active:scale-[0.99]',
          focusRing,
        ],
        false: '',
      },
    },
    defaultVariants: { variant: 'secondary', interactive: false },
  },
)

function Card({
  className,
  variant,
  interactive,
  asChild = false,
  ...props
}: ComponentProps<'div'> &
  VariantProps<typeof cardVariants> & {
    /** Render the single child (an a or a button, so the whole card is one target) with the card skin. */
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'div'
  return (
    <Comp
      data-slot="card"
      data-variant={variant ?? 'secondary'}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  )
}

/** Title, description and an optional action in the top-right corner. */
function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-tight font-semibold text-(color:--k-content-primary-foreground)', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('k-text-caption text-(color:--k-content-secondary-foreground)', className)}
      {...props}
    />
  )
}

/** Sits in the header's top-right corner (a menu button, a small toggle). */
function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('min-w-0', className)} {...props} />
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center gap-2', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, cardVariants }
