// SPDX-License-Identifier: MIT
// KatanaGaugeBar：进度条加一句解释（名字、数、档位词、条、说明）。数与档位词由智能体写；数取不到时写原因并标 unavailable。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { GaugeBar } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaGaugeBarApi = {
  name: 'KatanaGaugeBar',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The name of the measure.'),
      value: CommonSchemas.DynamicString.describe(
        'The number, already formatted. When the number could not be fetched write the reason here and set unavailable.',
      ),
      unavailable: CommonSchemas.DynamicBoolean.describe(
        'True when the number could not be fetched: the text is drawn in a muted color.',
      ).optional(),
      share: CommonSchemas.DynamicNumber.describe(
        'Where the number sits between the minimum and the maximum, from 0 to 1 (out of range sticks to the ends). Omit to draw no fill.',
      ).optional(),
      level: CommonSchemas.DynamicString.describe(
        'A short level word shown after the number (for example "Elevated").',
      ).optional(),
      note: CommonSchemas.DynamicString.describe(
        'A line of explanation under the bar: how the number is derived.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaGaugeBar = createComponentImplementation(KatanaGaugeBarApi, ({ props }) => (
  <Cell weight={props.weight}>
    <GaugeBar
      label={props.label ?? ''}
      value={props.value ?? ''}
      unavailable={props.unavailable === true}
      share={typeof props.share === 'number' && Number.isFinite(props.share) ? props.share : null}
      level={props.level ? <span className="k-a2ui-level">{props.level}</span> : undefined}
      note={props.note}
    />
  </Cell>
))
