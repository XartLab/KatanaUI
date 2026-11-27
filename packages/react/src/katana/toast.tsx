// SPDX-License-Identifier: MIT
import { BellRing, XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'
import { Button } from '../primitives/button.tsx'

// 弹出提示（toast）的画法：只管样子与读屏语义，不管条目表、定时、暂停——这些在调用方（应用里 AlertToasts 自己管条目表，toast-queue.ts 算去留，#1797、#747）。
// 不用 Radix Toast：它自带的定时与滑动手势我们用不上，条目表由调用方持有才能让超出条数的最旧一条先收、暂停时续上剩下的时间。
//   ToastViewport：固定在窗口一角的区域（role=region，aria-live=polite，新条目插进来读屏等空了再读，不打断），position 选哪个角；
//     下面两个角新的贴着窗口边、往上叠，上面两个角往下叠；左边的角「全部关掉」也靠左。
//   Toast：一条。phase 管进出：entering 是刚插进来（画一帧再改成 open，过渡才有起点）、closing 是收起中（过渡播完调用方再摘节点，时长见 TOAST_EXIT_MS）。
//     皮肤跟弹出菜单同一层（surface-4、7% 白边、同一组阴影），左边一道 2px 强调色条；过渡走 snappy 弹簧（theme/motion.css 的 token）。
//   ToastIcon、ToastTitle、ToastDescription、ToastClose（label 读屏名由调用方传）、ToastClear（「全部关掉」，文字由调用方传）、
//   ToastAction（一个文字钮，如「撤销」，文字由调用方传）、ToastCountdown（可选的剩余时间环，剩余比例由调用方传，包里不计时）。
// 出处：样子是原来应用里 shell.css 的 .kc-toast（2026-11-14 搬进包），数值没改。
// G3：加 tone（lib/severity.ts 的 Severity）：neutral 是原来的样子（色条取主文字色、图标取 --accent），ok / warn / danger 色条与图标都取 --k-status-*-foreground，
//   跟 Alert、Progress 同一套语气；说明文字从 ink-3 提到 ink-2（console 主题下 ink-3 压在 surface-4 上只有 4.45:1，a11y 已知违规里那条）。
//   色条与图标的颜色经 --toast-tone 传：Toast 按 tone 设它，ToastIcon 读它（不在 Toast 里用时退回 --accent）。
// #251 批 A（kubai Vibe Design Tips 016「Toast 还是通知」）：视口从 assertive 改 polite——「已复制」这类状态提示不该打断读屏；
//   视口常驻在页面里，往里插的条目靠它礼貌播报（只靠动态插进来的 role=status 节点，读屏不一定读）。需要注意的 warn / danger 那一条自己带 role=alert（插入即打断播报）。
//   加 ToastAction、ToastCountdown：能撤销的操作先做、再给「撤销」。皮肤、位置与进出场没动。

const TONE: Record<Severity, string> = {
  neutral: 'border-l-(color:--k-content-primary-foreground) [--toast-tone:var(--accent)]',
  ok: 'border-l-(color:--k-status-ok-foreground) [--toast-tone:var(--k-status-ok-foreground)]',
  warn: 'border-l-(color:--k-status-warn-foreground) [--toast-tone:var(--k-status-warn-foreground)]',
  danger: 'border-l-(color:--k-status-danger-foreground) [--toast-tone:var(--k-status-danger-foreground)]',
}

export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type ToastPhase = 'entering' | 'open' | 'closing'

/** 收起过渡的时长：与 theme/motion.css 里 toast 的 translate 过渡同一个 token（--dur-snappy，333ms），调用方在这么久之后再摘节点（原 AlertToasts 取 250，过渡没播完就被摘掉，所以改成取 token 的值）。 */
export const TOAST_EXIT_MS = 333

function ToastViewport({
  className,
  position = 'bottom-right',
  ...props
}: ComponentProps<'div'> & {
  /** Which corner: at the bottom corners new toasts stack upward from the window edge, at the top corners downward. */
  position?: ToastPosition
}) {
  return (
    <div
      role="region"
      aria-live="polite"
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

function Toast({
  className,
  phase = 'open',
  tone = 'neutral',
  ...props
}: ComponentProps<'div'> & {
  /** Tone of the color bar and the icon: neutral (default), ok, warn or danger. Say it in the title too, not only in color. */
  tone?: Severity
  /** entering is just inserted (draw one frame, then switch to open so the transition has a start); closing is leaving, and the caller removes the node after TOAST_EXIT_MS. */
  phase?: ToastPhase
}) {
  return (
    <div
      data-slot="toast"
      data-phase={phase}
      data-tone={tone}
      // warn / danger 要打断读屏（视口是 polite，neutral / ok 走视口）；调用方显式给的 role 排在后面，能盖掉它。
      {...(tone === 'warn' || tone === 'danger' ? { role: 'alert' } : {})}
      {...(phase === 'entering' ? { 'data-starting-style': '' } : {})}
      {...(phase === 'closing' ? { 'data-ending-style': '' } : {})}
      className={cn(
        // 底、边、圆角、阴影用浮层材质（k-mat-overlay：7% 白的边就是 --k-overlay-borderColor）；左边 2px 的色条由 TONE 盖。
        'k-toast k-mat-overlay k-text-body border-l-2 p-3 text-ink-2',
        TONE[tone],
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

/** 左边的图标：16px，颜色跟 Toast 的 tone（neutral 是强调色）。不传 children 画铃铛。 */
function ToastIcon({ className, children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="toast-icon"
      aria-hidden="true"
      className={cn(
        'mt-0.5 flex size-4 flex-none items-center justify-center text-[color:var(--toast-tone,var(--accent))] [&>svg]:size-4',
        className,
      )}
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
      className={cn('k-text-caption m-0 leading-[15px] [overflow-wrap:anywhere] text-ink-2 tabular-nums', className)}
      {...props}
    />
  )
}

/** 关掉这一条的钮。label 是读屏名（必填）。 */
function ToastClose({
  label,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, 'aria-label'> & {
  /** Accessible name (required; the package ships no text). */
  label: string
}) {
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

/**
 * 动作 toast 的那一个钮（如「撤销」）：文字由调用方给，强调色字，悬停才有底。
 * 做法：先把操作做了，再弹这一条给「撤销」；不能撤销的事先确认（AlertDialog），不要事后 toast。
 */
function ToastAction({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="toast-action"
      className={cn(
        'flex-none self-start font-semibold text-[color:var(--toast-tone,var(--accent))] not-disabled:hover:text-[color:var(--toast-tone,var(--accent))]',
        className,
      )}
      {...props}
    />
  )
}

// 倒计时环：16px 的空心环，半径 6、线宽 2；周长 2π·6。
const COUNTDOWN_RADIUS = 6
const COUNTDOWN_LENGTH = 2 * Math.PI * COUNTDOWN_RADIUS

/** 倒计时环随剩余比例变短（dashoffset 由 remaining 算）。 */
export function countdownOffset(remaining: number): number {
  const clamped = Number.isFinite(remaining) ? Math.min(1, Math.max(0, remaining)) : 0
  return COUNTDOWN_LENGTH * (1 - clamped)
}

/**
 * 可选的倒计时环：16px 的空心环随剩余比例变短，中间不写秒数（密度优先）。
 * 计时仍在调用方（toast-queue），包里不计时；remaining 由调用方传，0 到 1。纯装饰，不进读屏。
 */
function ToastCountdown({
  remaining,
  className,
  ...props
}: Omit<ComponentProps<'svg'>, 'children'> & {
  /** Time left as a fraction, 1 (just shown) down to 0 (about to close). The caller keeps the clock. */
  remaining: number
}) {
  return (
    <svg
      data-slot="toast-countdown"
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn('mt-0.5 size-4 flex-none -rotate-90', className)}
      {...props}
    >
      <circle
        cx="8"
        cy="8"
        r={COUNTDOWN_RADIUS}
        fill="none"
        strokeWidth="2"
        className="stroke-(color:--k-separable-tertiary-borderColor)"
      />
      <circle
        data-slot="toast-countdown-arc"
        cx="8"
        cy="8"
        r={COUNTDOWN_RADIUS}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={COUNTDOWN_LENGTH}
        strokeDashoffset={countdownOffset(remaining)}
        // linear：它是在「跑」的东西（kubai 011：linear 只给转圈、进度、倒计时）；时长略大于调用方更新的间隔，走起来不抖。
        className="stroke-[color:var(--toast-tone,var(--accent))] transition-[stroke-dashoffset] duration-200 ease-linear"
      />
    </svg>
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
  ToastAction,
  ToastClear,
  ToastClose,
  ToastContent,
  ToastCountdown,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
}
