// SPDX-License-Identifier: MIT
// KatanaCompanyProfile：公司简介卡（公司名、几项事实、可折叠的简介正文）。事实可以 @path 绑定；全部文字由智能体写；没有事实也没有正文时画空态。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { CompanyProfile } from '../../quotes/index.ts'
import { text } from '../chart-support.ts'
import { Cell, parseList, weightSchema } from '../support.tsx'

const MAX_FACTS = 24

const factSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the fact (sector, industry, employees).'),
    label: text('Small grey label of the fact.'),
    value: z.string().describe('The value, already written; omit to draw an em dash.').optional(),
  })
  .strict()

export const KatanaCompanyProfileApi = {
  name: 'KatanaCompanyProfile',
  schema: z
    .object({
      name: text('Company name; heading and accessible name of the card.'),
      facts: z
        .union([z.array(factSchema).max(MAX_FACTS), CommonSchemas.DataBinding])
        .describe('Facts under the name in reading order, or {"@path": "/facts"}.')
        .optional(),
      description: z.string().max(8000).describe('Plain-text company description.').optional(),
      collapsedLines: z
        .number()
        .int()
        .min(1)
        .max(20)
        .describe('Lines shown before the description is expanded.')
        .optional(),
      labels: z
        .object({
          more: text('Text of the expand button.'),
          less: text('Text of the collapse button.'),
          empty: text('Text when there are no facts and no description.'),
        })
        .strict()
        .describe('All visible words of the card.'),
      source: z.string().describe('Small line at the bottom (source, as-of date).').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaCompanyProfile = createComponentImplementation(KatanaCompanyProfileApi, ({ props }) => {
  const facts = useMemo(() => parseList(factSchema, props.facts).slice(0, MAX_FACTS), [props.facts])
  if (!props.labels) return null
  return (
    <Cell weight={props.weight}>
      <CompanyProfile
        name={props.name ?? ''}
        facts={facts}
        description={props.description}
        collapsedLines={props.collapsedLines}
        labels={props.labels}
        source={props.source}
      />
    </Cell>
  )
})
