// SPDX-License-Identifier: MIT
// KatanaStatusIcon：成功、失败、警告、说明、进行中的状态图标。读屏名必填；旁边已有文字写明状态时传空串，图标就当装饰。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { StatusIcon } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

const TONES = ['ok', 'warn', 'danger', 'neutral', 'info', 'pending'] as const

export const KatanaStatusIconApi = {
  name: 'KatanaStatusIcon',
  schema: z
    .object({
      tone: z
        .enum(TONES)
        .or(CommonSchemas.DataBinding)
        .describe(
          "The tone: 'ok' is a check, 'danger' a cross, 'warn' an exclamation, 'info' and 'neutral' an i, 'pending' a spinning arc. May be bound to the data model so the icon changes as work finishes.",
        ),
      label: CommonSchemas.DynamicString.describe(
        'Accessible name stating the status. Send an empty string when text next to the icon already says it; the icon is then decorative.',
      ),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaStatusIcon = createComponentImplementation(KatanaStatusIconApi, ({ props }) => (
  <Cell weight={props.weight}>
    <StatusIcon tone={TONES.find((item) => item === props.tone) ?? 'pending'} label={props.label ?? ''} />
  </Cell>
))
