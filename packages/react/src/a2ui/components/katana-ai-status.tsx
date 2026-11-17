// SPDX-License-Identifier: MIT
// KatanaAiStatus：一行智能体状态（思考、检索、编写、完成、出错），智能体边干活边改它。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { AiStatus } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaAiStatusApi = {
  name: 'KatanaAiStatus',
  schema: z
    .object({
      state: z
        .enum(['thinking', 'searching', 'writing', 'done', 'error'])
        .or(CommonSchemas.DataBinding)
        .describe(
          'What the agent is doing. The first three animate; done and error stop. May be bound to the data model so it changes as you work.',
        ),
      label: CommonSchemas.DynamicString.describe('The status text, for example "Reading the filing".'),
      detail: CommonSchemas.DynamicString.describe('A second, quieter line of detail.').optional(),
      elapsed: CommonSchemas.DynamicNumber.describe(
        'Seconds since the step began; shown only while the state is active.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

const STATES = ['thinking', 'searching', 'writing', 'done', 'error'] as const

export const KatanaAiStatus = createComponentImplementation(KatanaAiStatusApi, ({ props }) => {
  const state = STATES.find((item) => item === props.state) ?? 'thinking'
  return (
    <Cell weight={props.weight}>
      <AiStatus state={state} label={props.label ?? ''} detail={props.detail} elapsed={props.elapsed} />
    </Cell>
  )
})
