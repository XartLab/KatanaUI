// SPDX-License-Identifier: MIT
import type { ComponentProps } from 'react'
import { formatPercentChange, toneOf } from './format'
import { ToneText } from './tone-text'

/** 涨跌幅：value 已经是百分数（1.5 就是 1.5%），写成「+1.50%」，涨跌色跟 data-updown。位数由调用方传。 */
export function ChangeText({
  value,
  digits = 2,
  arrow,
  ...rest
}: { value: number; digits?: number; arrow?: boolean } & Omit<ComponentProps<'span'>, 'children'>) {
  return (
    <ToneText tone={toneOf(value, digits)} arrow={arrow} data-slot="change-text" {...rest}>
      {formatPercentChange(value, digits)}
    </ToneText>
  )
}
