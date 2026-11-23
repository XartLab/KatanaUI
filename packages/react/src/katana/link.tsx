// SPDX-License-Identifier: MIT
/**
 * An inline text link: underlined, with an optional external mark that also opens in a new tab.
 * 行内文字链接（#104 对照 Salt：原来只有 Button 的 variant=link 加 asChild，没有独立的 Link）。
 * 用处：新闻正文里的出处、公告与研报的原文、品种名跳行情页、帮助说明；TradingView 新闻与品种页里的文字链接都是下划线加外链标（出处页待核对）。
 * 照 Salt Link（@salt-ds/core，Apache-2.0；只取结构：行内 a、external 时带外链图标与「新窗口打开」的读屏提示）；没有搬代码。
 * 样子与 Button 的 link 变体同一套：字取 content，下划线取 separable-primary 的颜色、偏移 3px；悬停字提到 primary、下划线换成字色。
 * 不只靠颜色认出链接：下划线一直在（WCAG 1.4.1）。external 时 target=_blank、rel=noopener noreferrer，末尾一个 12px 的外链图标，
 * 读屏另读 externalLabel（如「（在新窗口打开）」，文字由调用方给）。asChild 时把样子交给唯一的子元素（路由库的 Link），不加外链图标。
 */
import { ExternalLink } from 'lucide-react'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

export type LinkProps = ComponentProps<'a'> & {
  /** primary (default): the primary text color; secondary: the secondary text color (footnotes, captions). */
  tone?: 'primary' | 'secondary'
  /** Opens in a new tab (target=_blank, rel=noopener noreferrer) and ends with an external-link icon. */
  external?: boolean
  /** Read after the text when external, for example "(opens in a new tab)"; the package ships no text. */
  externalLabel?: string
  /** Render the single child (a router's Link) with this skin instead of an a. */
  asChild?: boolean
}

/** An inline text link, always underlined. */
export function Link({
  tone = 'primary',
  external = false,
  externalLabel,
  asChild = false,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) {
  const skin = cn('k-link', className)
  if (asChild) {
    return (
      <Slot.Root data-slot="link" data-tone={tone} className={skin} {...props}>
        {children}
      </Slot.Root>
    )
  }
  return (
    <a
      data-slot="link"
      data-tone={tone}
      data-external={external || undefined}
      className={skin}
      target={external ? (target ?? '_blank') : target}
      rel={external ? (rel ?? 'noopener noreferrer') : rel}
      {...props}
    >
      {children}
      {external ? (
        <>
          <ExternalLink className="k-link-mark" size={12} aria-hidden />
          {externalLabel ? <span className="sr-only">{externalLabel}</span> : null}
        </>
      ) : null}
    </a>
  )
}
