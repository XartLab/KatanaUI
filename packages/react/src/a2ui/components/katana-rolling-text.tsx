// SPDX-License-Identifier: MIT
// KatanaRollingText：数字变了就像里程表一样转过去的文字。显示的字由智能体格式化好传来，数值只用来定转动方向。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { RollingText } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaRollingTextApi = {
  name: 'KatanaRollingText',
  schema: z
    .object({
      text: CommonSchemas.DynamicString.describe(
        'The whole string to show, already formatted, including thousands separators and the decimal point.',
      ),
      value: CommonSchemas.DynamicNumber.describe(
        'The same number as a raw value. Only used to decide whether the digits roll up or down when it changes.',
      ),
      animate: z.boolean().default(true).describe('When false a change replaces the text without rolling.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaRollingText = createComponentImplementation(KatanaRollingTextApi, ({ props }) => (
  <Cell weight={props.weight}>
    <RollingText
      text={props.text ?? ''}
      value={typeof props.value === 'number' && Number.isFinite(props.value) ? props.value : 0}
      animate={props.animate ?? true}
    />
  </Cell>
))
