// SPDX-License-Identifier: MIT
import { cn } from '../lib/cn.ts'

// 「按 K 线估算」类的小标记（#1869，原应用 panels/kit/EstimateBadge）：琥珀色描边的小字，跟警示文字同一种颜色；悬停写规则摘要。
// 写什么字、什么规则由调用方传（包里不带语言，也不知道回放交易）。

export function EstimateBadge({ label, title, className }: { label: string; title?: string; className?: string }) {
  return (
    <span className={cn('k-estimate', className)} title={title} data-slot="estimate-badge">
      {label}
    </span>
  )
}
