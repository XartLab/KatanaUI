// SPDX-License-Identifier: MIT
import type { ComponentProps, ReactNode } from 'react'
import { toneOf, type Tone } from './format/index.ts'
import { ToneText } from './tone-text.tsx'

/**
 * 盈亏文字：children 是调用方格式化好的字（币种、位数、符号都由调用方定），value 只用来定方向。
 * 方向不是由 value 的符号推出来的时候（例：亏损额写成正数）传 tone 盖掉。
 */
export function PnlText({
  value,
  tone,
  arrow,
  as,
  children,
  ...rest
}: {
  /** Only decides the direction; 0, empty and unparseable values count as flat. */
  value: number | string | null | undefined
  /**
   * Overrides the direction when it is not given by the sign of value (a loss written as a positive number, say).
   */
  tone?: Tone
  /** Put an up or down triangle before the text. */
  arrow?: boolean
  /** Which element to render. */
  as?: 'span' | 'strong'
  /** The text to show. */
  children: ReactNode
} & Omit<ComponentProps<'span'>, 'children'>) {
  return (
    <ToneText tone={tone ?? toneOf(value)} arrow={arrow} as={as} data-slot="pnl-text" {...rest}>
      {children}
    </ToneText>
  )
}
