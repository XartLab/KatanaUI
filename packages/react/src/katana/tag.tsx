// SPDX-License-Identifier: MIT
/**
 * Small inline label with a severity tone, a size and an outlined or filled look: the base of badges and marks.
 * 小标签的底座（G3，体检 §1「徽标六个无底座」）：BadgeGroup 的上标徽标、EstimateBadge 的估算标记都是它，别的批次的 SymbolMark、NewsSymbolChip、PriceTag 之后也往它上靠。
 * 颜色只读 characteristics 的 --k-status-*（lib/severity.ts 的 Severity）：字是 foreground；填充（默认）底是 background，描边（outlined）底透明、边取字色。
 * 尺寸两档：sm 是 micro 字号、行高 1（品种名后的上标）；md 是 caption 字号 500（行内标记）。皮肤在 ../theme/tag.css。
 * 照 Salt 的 Tag / Pill 只取结构（语气 × 尺寸 × 描边与否三个维度），没有搬代码。
 */
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'

/** Size of a tag: sm is the micro superscript size, md the caption size. */
export type TagSize = 'sm' | 'md'

export type TagProps = ComponentProps<'span'> & {
  /** Tone of the text, and of the fill or the edge: neutral (default), ok, warn or danger. */
  tone?: Severity
  /** sm is micro text with line height 1 (marks after a symbol name); md is caption text (inline marks). Defaults to md. */
  size?: TagSize
  /** Draw a 1px edge in the text color on a transparent fill instead of a tinted fill. */
  outlined?: boolean
}

/** A small inline label: the text says what it is; color only repeats the tone. */
export function Tag({ tone = 'neutral', size = 'md', outlined = false, className, ...props }: TagProps) {
  return (
    <span
      data-slot="tag"
      data-tone={tone}
      data-size={size}
      data-outlined={outlined || undefined}
      className={cn('k-tag', className)}
      {...props}
    />
  )
}
