// SPDX-License-Identifier: MIT
// KatanaLed：状态灯。只表达真实状态，读屏名必填（旁边没有文字时灯本身就是唯一的说明）。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Led } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

const STATES = ['off', 'on', 'ok', 'warn', 'danger'] as const
const GROUPS = ['A', 'B', 'C', 'D'] as const

export const KatanaLedApi = {
  name: 'KatanaLed',
  schema: z
    .object({
      state: z
        .enum(STATES)
        .or(CommonSchemas.DataBinding)
        .describe(
          "The state: 'on' glows orange, 'ok' is green, 'warn' amber, 'danger' red, 'off' is dark. May be bound to the data model so the light follows live status.",
        ),
      label: CommonSchemas.DynamicString.describe(
        'Accessible name that says what the light stands for and its state, as a whole phrase (for example "Market feed: connected").',
      ),
      group: z
        .enum(GROUPS)
        .describe(
          'Link group A to D: panels in the same group follow the same symbol. The group color overrides state.',
        )
        .optional(),
      hollow: z.boolean().describe('Transparent fill with a thin border and no glow.').optional(),
      bare: z
        .boolean()
        .describe('Set when no text next to the light names the state: the off state then draws a visible ring.')
        .optional(),
      small: z.boolean().describe('A 6px light for inline use inside pills.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaLed = createComponentImplementation(KatanaLedApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Led
      state={STATES.find((item) => item === props.state) ?? 'off'}
      group={GROUPS.find((item) => item === props.group)}
      hollow={props.hollow}
      bare={props.bare}
      small={props.small}
      label={props.label ?? ''}
    />
  </Cell>
))
