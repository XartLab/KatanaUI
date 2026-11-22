// SPDX-License-Identifier: MIT
// 品种名后的上标徽标（板块、风险标记）：Tag 的 sm 档（micro 小字、行高 1、neutral 语气的次要文字色），贴在品种名右上，不抢品种名；皮肤在 ../theme/badge.css（排布）与 tag.css（徽标本身）。
// 搬自 src/ui/Badges.tsx（#1860）：徽标有哪些、全称怎么写（含按界面语言翻）是应用的事（市场包的 badgesOf），这里只管画。
// 一个徽标是一个 role=img，名字是全称，读屏读「科创板：涨跌幅 20%」而不是单字「科」。G3 起每个徽标是一个 Tag（体检 §1：徽标共用底座）。
import type { Severity } from '../lib/severity.ts'
import { Tag } from './tag.tsx'

export type BadgeItem = {
  id: string
  /** 上标上的字（单字）。 */
  label: string
  /** 全称：读屏名，也是悬停提示。 */
  text: string
  /** 语气：风险标记（如 ST）给 warn 或 danger；不给是 neutral。 */
  tone?: Severity
}

/** 一排上标徽标；没有徽标时什么都不画。 */
export function BadgeGroup({
  items,
}: {
  /** The badges: label is the one-character mark, text is the full name (accessible name and hover hint), tone colors a risk flag. */
  items: readonly BadgeItem[]
}) {
  if (items.length === 0) return null
  return (
    <span className="k-badges">
      {items.map(({ id, label, text, tone }) => (
        <Tag key={id} size="sm" tone={tone} className="k-badge" role="img" aria-label={text} title={text}>
          {label}
        </Tag>
      ))}
    </span>
  )
}
