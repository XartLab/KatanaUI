// SPDX-License-Identifier: MIT
import { BellRing, XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'
import { Button } from '../primitives/button'

// 弹出提示（toast）的画法：只管样子与读屏语义，不管条目表、定时、暂停——这些在调用方（应用里 AlertToasts 自己管条目表，toast-queue.ts 算去留，#1797、#747）。
// 不用 Radix Toast：它自带的定时与滑动手势我们用不上，条目表由调用方持有才能让超出条数的最旧一条先收、暂停时续上剩下的时间。
//   ToastViewport：固定在窗口一角的区域（role=region，aria-live=assertive，新条目插进来读屏马上读），position 选哪个角；
//     下面两个角新的贴着窗口边、往上叠，上面两个角往下叠；左边的角「全部关掉」也靠左。
//   Toast：一条。phase 管进出：entering 是刚插进来（画一帧再改成 open，过渡才有起点）、closing 是收起中（过渡播完调用方再摘节点，时长见 TOAST_EXIT_MS）。
//     皮肤跟弹出菜单同一层（surface-4、7% 白边、同一组阴影），左边一道 2px 强调色条；过渡走 snappy 弹簧（theme/motion.css 的 token）。
//   ToastIcon、ToastTitle、ToastDescription、ToastClose（label 读屏名由调用方传）、ToastClear（「全部关掉」，文字由调用方传）。
// 出处：样子是原来应用里 shell.css 的 .kc-toast（2026-11-14 搬进包），数值没改。

export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type ToastPhase = 'entering' | 'open' | 'closing'

/** 收起过渡的时长：与 theme/motion.css 里 toast 的 translate 过渡同一个 token（--dur-snappy，333ms），调用方在这么久之后再摘节点（原 AlertToasts 取 250，过渡没播完就被摘掉，所以改成取 token 的值）。 */
export const TOAST_EXIT_MS = 333

function ToastViewport({
  className,
  position = 'bottom-right',
  ...props
}: ComponentProps<'div'> & { position?: ToastPosition }) {
  return (
    <div
      role="region"
      aria-live="assertive"
      aria-atomic="false"
      aria-relevant="additions"
      data-slot="toast-viewport"
      data-position={position}
      className={cn(
        'group/toasts k-toasts fixed z-60 flex w-[min(340px,calc(100vw-32px))] gap-2 outline-0',
        position.startsWith('top') ? 'top-4 flex-col' : 'bottom-4 flex-col-reverse',
        position.endsWith('left') ? 'left-4' : 'right-4',
        className,
      )}
      {...props}
    />
  )
}

function Toast({ className, phase = 'open', ...props }: ComponentProps<'div'> & { phase?: ToastPhase }) {
  return (
    <div
      data-slot="toast"
      data-phase={phase}
      {...(phase === 'entering' ? { 'data-starting-style': '' } : {})}
      {...(phase === 'closing' ? { 'data-ending-style': '' } : {})}
      className={cn(
        'k-toast k-text-body rounded-[var(--radius-overlay)] border border-l-2 border-alpha-white-6 border-l-brand bg-surface-4 p-3 text-ink-2',
        'shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)]',
        'data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0',
        'group-data-[position^=top]/toasts:data-[starting-style]:-translate-y-2 group-data-[position^=top]/toasts:data-[ending-style]:-translate-y-2',
        className,
      )}
      {...props}
    />
  )
}

/** 图标 + 文字 + 关闭钮并排。 */
function ToastContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="toast-content" className={cn('flex items-start gap-3', className)} {...props} />
}

/** 左边的图标：16px 强调色。不传 children 画铃铛。 */
function ToastIcon({ className, children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="toast-icon"
      aria-hidden="true"
      className={cn('mt-0.5 flex size-4 flex-none items-center justify-center text-brand [&>svg]:size-4', className)}
      {...props}
    >
      {children ?? <BellRing />}
    </span>
  )
}

function ToastText({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="toast-text" className={cn('flex min-w-0 flex-1 flex-col gap-1', className)} {...props} />
}

function ToastTitle({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="toast-title"
      className={cn('k-text-body m-0 leading-4 font-semibold text-ink tabular-nums', className)}
      {...props}
    />
  )
}

function ToastDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="toast-description"
      className={cn('k-text-caption m-0 leading-[15px] [overflow-wrap:anywhere] text-ink-3 tabular-nums', className)}
      {...props}
    />
  )
}

/** 关掉这一条的钮。label 是读屏名（必填）。 */
function ToastClose({
  label,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'aria-label'> & { label: string }) {
  return (
    <Button
      type="button"
      variant="icon"
      size="icon"
      data-slot="toast-close"
      aria-label={label}
      className={cn('flex-none', className)}
      {...props}
    >
      <XIcon />
    </Button>
  )
}

/** 两条以上时放在最后的「全部关掉」，在视口里离窗口边最远的一头；靠左的角靠左。 */
function ToastClear({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      data-slot="toast-clear"
      className={cn(
        'k-toasts-clear k-text-caption cursor-pointer self-end rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-4 px-3 py-1 text-ink-2 hover:text-ink group-data-[position$=left]/toasts:self-start',
        className,
      )}
      {...props}
    />
  )
}

export {
  Toast,
  ToastClear,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
}
