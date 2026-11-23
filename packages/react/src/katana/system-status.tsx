// SPDX-License-Identifier: MIT
/**
 * A full-width bar at the top of the app for platform-wide news: maintenance, outages, delayed data, a new feature.
 * 全站系统消息条（#104 对照 Salt：原来只有页内的 Alert 与顶底状态栏，没有贴在页面顶上、可关的全站消息条）。
 * 用处：行情源断开正在重连、数据延迟、计划停机维护、券商通道故障、新功能上线；TradingView 在图表顶上也是这样一条横幅（主会话实看，出处页待核对）。
 * 照 Salt SystemStatus（@salt-ds/lab，Apache-2.0；2026-11-23 读用法页）：四种语气、一两行字、可选标题与动作；只管全站的事，
 * 跟当前任务有关的提示用 Alert（Salt 的 Banner），要打断操作的用 Dialog；没有搬代码。
 * 语气是 Severity 加 info（同 StatusIcon）：info 蓝、ok 绿、warn 黄、danger 红、neutral 灰；每种语气的图标形状不同，不只靠颜色。
 * role 默认按语气定：warn 与 danger 是 alert（读屏马上读），其余是 status（同 Alert）；页面一打开就在、不是后来冒出来的可以传 role="note"。
 * 关闭钮只在给了 onDismiss 时出现；关了以后要不要再出现（记在哪里）是调用方的事。文字全由调用方传，皮肤在 ../theme/system-status.css。
 */
import { CircleCheck, Info, OctagonAlert, TriangleAlert, X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'

/** Tone of a system status: a Severity, or info (blue: news, not a problem). */
export type SystemStatusTone = Severity | 'info'

const ICON: Record<SystemStatusTone, typeof Info> = {
  info: Info,
  neutral: Info,
  ok: CircleCheck,
  warn: TriangleAlert,
  danger: OctagonAlert,
}

export type SystemStatusProps = Omit<ComponentProps<'div'>, 'title'> & {
  /** info (default), neutral, ok, warn or danger: the color of the bar and the shape of its icon. */
  tone?: SystemStatusTone
  /** A short bold lead before the message, for example "Scheduled maintenance". */
  title?: ReactNode
  /** Buttons or links at the end of the bar (a small Button, a Link). */
  actions?: ReactNode
  /** Replace the tone's icon; pass null for no icon. */
  icon?: ReactNode
  /** Given: a close button at the right end calls it. */
  onDismiss?: () => void
  /** Accessible name of the close button; required with onDismiss (the package ships no text). */
  dismissLabel?: string
}

/** A full-width system message bar: icon, optional bold title, one or two lines of message, actions, close. */
export function SystemStatus({
  tone = 'info',
  title,
  actions,
  icon,
  onDismiss,
  dismissLabel,
  role,
  className,
  children,
  ...props
}: SystemStatusProps) {
  const Icon = ICON[tone]
  return (
    <div
      data-slot="system-status"
      data-tone={tone}
      data-dismissible={onDismiss ? true : undefined}
      role={role ?? (tone === 'warn' || tone === 'danger' ? 'alert' : 'status')}
      className={cn('k-sysstat', className)}
      {...props}
    >
      {icon === null ? null : (
        <span className="k-sysstat-icon" aria-hidden="true">
          {icon ?? <Icon size={16} />}
        </span>
      )}
      <div className="k-sysstat-content">
        {title ? <strong className="k-sysstat-title">{title}</strong> : null}
        <span className="k-sysstat-message">{children}</span>
      </div>
      {actions ? <div className="k-sysstat-actions">{actions}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          className="k-sysstat-close"
          aria-label={dismissLabel}
          title={dismissLabel}
          onClick={onDismiss}
        >
          <X size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
