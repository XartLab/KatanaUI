// SPDX-License-Identifier: MIT
/**
 * A plain container: a fill that takes the whole height of its slot and scrolls its own content. No title bar, no edge.
 * 不带标题栏的纯容器面板（#104 对照 Salt：原来只有带标题栏的工作台面板壳 PanelFrame）。
 * 用处：分栏里的一栏（Splitter 的一格、Sidebar 的窄侧）、对话框里的一块滚动区，要一块底色把内容托起来、又不要面板头的地方。
 * 照 Salt Panel（@salt-ds/core，Apache-2.0：primary / secondary / tertiary 三档底色，占满高度，内容超出自己滚；只取结构，没有搬代码）。
 * 底色读 container 的三档（同 Card）；不画边、不加圆角（贴边的版面块），要框就用 Card。内距 12 走 Tailwind 的 p-3，调用方可用 className 改。
 */
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

const FILL: Record<'primary' | 'secondary' | 'tertiary', string> = {
  primary: 'bg-(--k-container-primary-background)',
  secondary: 'bg-(--k-container-secondary-background)',
  tertiary: 'bg-(--k-container-tertiary-background)',
}

export type PanelProps = ComponentProps<'div'> & {
  /** Fill: primary (default, the brightest container fill), secondary or tertiary. */
  variant?: 'primary' | 'secondary' | 'tertiary'
}

/** A full-height container with a container fill; its content scrolls inside it. */
export function Panel({ variant = 'primary', className, ...props }: PanelProps) {
  return (
    <div
      data-slot="panel"
      data-variant={variant}
      className={cn(
        'box-border h-full min-h-0 overflow-auto p-3 text-(color:--k-content-body-foreground)',
        FILL[variant],
        className,
      )}
      {...props}
    />
  )
}
