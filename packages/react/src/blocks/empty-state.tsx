// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

// 面板的「空」态（#1869，原应用 panels/kit/PanelState）：点阵标签 + 一行标题 + 说明 + 动作。不画假数据：没有连接、没选品种、没有数据时
// 摆它，而不是样本数据。点阵字体（Doto / Ark Pixel）没打包时按 tokens 的字体栈回退到等宽字体。
// 照 Blueprint 的 NonIdealState（Apache-2.0，2026-11-14 读文档，只取结构：图标 / 标题 / 描述 / 动作四段）与 Salt 的 patterns；没有搬代码。

export type EmptyStateSlot = 'root' | 'tag' | 'title' | 'text' | 'actions'

export function EmptyState({
  tag,
  title,
  children,
  actions,
  classNames = {},
}: {
  /**
   * Small dot-matrix tag such as NO DATA (the caller writes the text).
   * 点阵小标签（NO DATA 之类，调用方给字）。
   */
  tag?: string
  /** The title. */
  title: string
  /**
   * The description under the title.
   * 标题下的说明。
   */
  children?: ReactNode
  /** The action area (buttons). */
  actions?: ReactNode
  /**
   * Extra class names per part.
   * 各部分额外挂的类名。
   */
  classNames?: Partial<Record<EmptyStateSlot, string>>
}) {
  return (
    <div className={cn('k-empty', classNames.root)} role="status" data-slot="empty-state">
      {tag && <span className={cn('k-empty-tag', classNames.tag)}>{tag}</span>}
      <h3 className={cn('k-empty-title', classNames.title)}>{title}</h3>
      {children && <div className={cn('k-empty-text', classNames.text)}>{children}</div>}
      {actions && <div className={cn('k-empty-actions', classNames.actions)}>{actions}</div>}
    </div>
  )
}
