// SPDX-License-Identifier: MIT
import type { ComponentProps } from 'react'
import { formatPercentChange, toneOf } from './format/index.ts'
import { ToneText } from './tone-text.tsx'

/** 涨跌幅：value 已经是百分数（1.5 就是 1.5%），写成「+1.50%」，涨跌色跟 data-updown。位数由调用方传。 */
export function ChangeText({
  value,
  digits = 2,
  arrow,
  ...rest
}: {
  /** A percentage already (1.5 means 1.5%). */
  value: number
  /** Number of decimal places. */
  digits?: number
  /** Put an up or down triangle before the text (none for flat) so direction does not rely on color alone. */
  arrow?: boolean
} & Omit<ComponentProps<'span'>, 'children'>) {
  return (
    <ToneText tone={toneOf(value, digits)} arrow={arrow} data-slot="change-text" {...rest}>
      {formatPercentChange(value, digits)}
    </ToneText>
  )
}
