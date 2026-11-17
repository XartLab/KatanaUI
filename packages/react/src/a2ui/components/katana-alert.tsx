// SPDX-License-Identifier: MIT
// KatanaAlert：行内提示条（说明、成功、警告、危险），语气靠色条加文字，不只靠颜色。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaAlertApi = {
  name: 'KatanaAlert',
  schema: z
    .object({
      tone: z
        .enum(['default', 'ok', 'warn', 'danger'])
        .default('default')
        .describe("Tone of the notice. 'warn' and 'danger' are announced to screen readers at once.")
        .optional(),
      title: CommonSchemas.DynamicString.describe(
        'A short heading. The tone must also be readable from the words, not only from the color.',
      ),
      description: CommonSchemas.DynamicString.describe('The detail text.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaAlert = createComponentImplementation(KatanaAlertApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Alert tone={props.tone}>
      <AlertTitle>{props.title}</AlertTitle>
      {props.description ? <AlertDescription>{props.description}</AlertDescription> : null}
    </Alert>
  </Cell>
))
