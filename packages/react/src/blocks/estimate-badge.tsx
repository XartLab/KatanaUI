// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'
import { Tag } from '../katana/tag.tsx'

// 「按 K 线估算」类的小标记（#1869，原应用 panels/kit/EstimateBadge）：Tag 的 md 档，warn 语气、描边（琥珀字、同色 1px 边），跟警示文字同一种颜色；悬停写规则摘要。
// 写什么字、什么规则由调用方传（包里不带语言，也不知道回放交易）。G3 起基于 Tag（体检 §1：徽标共用底座），样子没变。

export function EstimateBadge({
  label,
  title,
  className,
}: {
  /** Text on the badge. */
  label: string
  /** Hover hint. */
  title?: string
  /** Extra class name on the badge. */
  className?: string
}) {
  return (
    <Tag tone="warn" outlined className={cn('k-estimate', className)} title={title} data-slot="estimate-badge">
      {label}
    </Tag>
  )
}
