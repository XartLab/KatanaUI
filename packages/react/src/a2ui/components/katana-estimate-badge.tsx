// SPDX-License-Identifier: MIT
// KatanaEstimateBadge：「按 K 线估算」一类的小标记（琥珀描边小字）。字与悬停说明都由智能体写。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { EstimateBadge } from '../../blocks/index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaEstimateBadgeApi = {
  name: 'KatanaEstimateBadge',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The text on the badge (for example "Estimated").'),
      title: CommonSchemas.DynamicString.describe(
        'A hover hint that summarizes the rule behind the estimate.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaEstimateBadge = createComponentImplementation(KatanaEstimateBadgeApi, ({ props }) => (
  <Cell weight={props.weight}>
    <EstimateBadge label={props.label ?? ''} title={props.title} />
  </Cell>
))
