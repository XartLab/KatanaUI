// SPDX-License-Identifier: MIT
// KatanaButton：把 KatanaUI 的 Button 登记成 A2UI 组件。按钮只发 Action，由宿主决定做什么；交易类动作一律这样走。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Button } from '../../index.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

export const KatanaButtonApi = {
  name: 'KatanaButton',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The text on the button.'),
      variant: z
        .enum(['default', 'primary', 'danger', 'ghost'])
        .default('default')
        .describe(
          "Visual style. 'primary' is the one main call to action in a region, 'danger' marks a destructive action, 'ghost' is a quiet button without a border.",
        )
        .optional(),
      size: z.enum(['md', 'sm']).default('md').describe('Button height: md is 30px, sm is 26px.').optional(),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the button cannot be pressed.').optional(),
      action: actionSchema(
        'Dispatched when the user presses the button. Orders and other trades must only be requested through here.',
      ),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaButton = createComponentImplementation(KatanaButtonApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Button
      variant={props.variant}
      size={props.size}
      disabled={props.disabled === true || props.isValid === false}
      onClick={() => void props.action?.()}
    >
      {props.label}
    </Button>
  </Cell>
))
