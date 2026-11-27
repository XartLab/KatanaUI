// SPDX-License-Identifier: MIT
// KatanaBadgeGroup：品种名后的上标徽标（板块、风险标记）。每枚徽标的单字与全称都由智能体写，全称是读屏名与悬停提示。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { BadgeGroup } from '../../index.ts'
import { Cell, parseList, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the badge.'),
    label: z.string().min(1).describe('The one-character mark drawn as a superscript.'),
    text: z.string().min(1).describe('The full name, used as the accessible name and the hover hint.'),
  })
  .strict()

export const KatanaBadgeGroupApi = {
  name: 'KatanaBadgeGroup',
  schema: z
    .object({
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The badges, for example a board or a risk flag. Either a literal array or {"@path": "/badges"} bound to a data-model array. Nothing is drawn for an empty list. Items that do not fit the shape are dropped.',
        ),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaBadgeGroup = createComponentImplementation(KatanaBadgeGroupApi, ({ props }) => (
  <Cell weight={props.weight}>
    <BadgeGroup items={parseList(itemSchema, props.items)} />
  </Cell>
))
