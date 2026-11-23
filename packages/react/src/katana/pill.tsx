// SPDX-License-Identifier: MIT
/**
 * A single interactive pill: a button for its main action, an optional × button that removes it.
 * 单个可点、可关的小胶囊（#104 对照 Salt：ChipGroup 是一整组开关芯片、Tag 只展示，缺「单个可关闭的 pill」）。
 * 用处：TradingView 选股器顶上一排已生效的筛选条件（点开改条件、× 去掉这一条）、图上叠加品种的图例块（× 移除叠加），主会话在 TradingView 里实看过，出处页待核对。
 * 照 Salt Pill（@salt-ds/core，Apache-2.0；2026-11-23 读 packages/core/src/pill/Pill.tsx）：本体是原生 button、type=button、disabled 照原生，没有搬代码。
 * 跟 Salt 不同的一处：Salt 的「可关」例子把关闭图标放进 pill、整颗点了就关；这里拆成两个按钮，本体做主动作、× 只做关，想改条件时不会误删。
 * 焦点在本体上按 Backspace / Delete 也关（芯片输入的通行做法，待核对出处）。关掉以后焦点放哪由调用方定（通常是下一颗或输入框）。
 * 皮肤在 ../theme/pill.css：24 高、圆角 pill、actionable 的底与边，与 ChipGroup 的芯片同一套数值；选中时同分段切换的 --seg-on-bg / --seg-on-ink。
 */
import { X } from 'lucide-react'
import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

/** Size of a pill: md is 24px tall (default), sm 20px. */
export type PillSize = 'sm' | 'md'

export type PillProps = Omit<ComponentProps<'button'>, 'children'> & {
  /** Text of the pill: one or two words. */
  children: ReactNode
  /** Leading icon (13px); decorative, so give it aria-hidden. */
  icon?: ReactNode
  /** Pressed state (aria-pressed): the pill becomes a toggle drawn in the selected look. Leave undefined for an action pill. */
  selected?: boolean
  /** Given: an × button at the end removes the pill; Backspace or Delete on the pill does the same. */
  onDismiss?: () => void
  /** Accessible name of the × button, for example "Remove P/E < 20"; required with onDismiss (the package ships no text). */
  dismissLabel?: string
  /** md (24px, default) or sm (20px). */
  size?: PillSize
}

/**
 * One pill. The body is a button when it has onClick or selected, otherwise plain text;
 * with onDismiss a second button (×) sits at the end. className goes on the outer span, the other props on the body button.
 */
export function Pill({
  children,
  icon,
  selected,
  onDismiss,
  dismissLabel,
  size = 'md',
  disabled,
  className,
  onKeyDown,
  ...props
}: PillProps) {
  const pressable = props.onClick !== undefined || selected !== undefined
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !onDismiss || disabled) return
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      onDismiss()
    }
  }
  const body = (
    <>
      {icon ? <span className="k-pill-icon">{icon}</span> : null}
      <span className="k-pill-label">{children}</span>
    </>
  )
  return (
    <span
      data-slot="pill"
      data-size={size}
      data-selected={selected || undefined}
      data-dismissible={onDismiss ? true : undefined}
      data-disabled={disabled || undefined}
      className={cn('k-pill', className)}
    >
      {pressable ? (
        <button
          type="button"
          data-slot="pill-body"
          className="k-pill-main"
          aria-pressed={selected}
          disabled={disabled}
          onKeyDown={keyDown}
          {...props}
        >
          {body}
        </button>
      ) : (
        <span data-slot="pill-body" className="k-pill-main">
          {body}
        </span>
      )}
      {onDismiss ? (
        <button
          type="button"
          data-slot="pill-dismiss"
          className="k-pill-x"
          aria-label={dismissLabel}
          title={dismissLabel}
          disabled={disabled}
          onClick={onDismiss}
        >
          <X size={12} aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
