// SPDX-License-Identifier: MIT
// KatanaWebSearch：联网检索的来源列表。WebSearch 本来就不存也不开 URL，来源只有站名、标题、摘要；点一张卡只发 onOpen，由宿主决定。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { WebSearch, type WebSource } from '../../index.ts'
import { Cell, actionSchema, parseList, weightSchema } from '../support.tsx'

const sourceSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the source. The host gets it back when the user opens it.'),
    site: z.string().describe('The site name, for example "Reuters".'),
    title: z.string().describe('The page title.'),
    snippet: z.string().describe('A short excerpt.').optional(),
  })
  .strict()

export const KatanaWebSearchApi = {
  name: 'KatanaWebSearch',
  schema: z
    .object({
      sources: z
        .union([z.array(sourceSchema), CommonSchemas.DataBinding])
        .describe(
          'The sources found so far. Either a literal array or {"@path": "/sources"} bound to a data-model array; add to it while searching. No URLs are shown or opened.',
        ),
      status: z
        .enum(['searching', 'done'])
        .default('done')
        .describe("'searching' draws a progress ring and placeholders for sources still to come.")
        .optional(),
      label: CommonSchemas.DynamicString.describe('The status text on the pill, for example "Searched 6 sources".'),
      moreLabel: CommonSchemas.DynamicString.describe('Text of the "show more" tile; may contain {count}.').optional(),
      lessLabel: CommonSchemas.DynamicString.describe('Text of the "show fewer" tile.').optional(),
      onOpen: actionSchema(
        'Dispatched when the user opens a source card. metadata.extensions.katanaSource carries {id, site, title}; the host decides what to open.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaWebSearch = createComponentImplementation(KatanaWebSearchApi, ({ props }) => {
  const sources = useMemo(() => parseList(sourceSchema, props.sources) as WebSource[], [props.sources])
  return (
    <Cell weight={props.weight}>
      <WebSearch
        sources={sources}
        status={props.status}
        label={props.label ?? ''}
        moreLabel={props.moreLabel}
        lessLabel={props.lessLabel}
        onOpen={
          props.onOpen
            ? (source) =>
                void props.onOpen?.({
                  metadata: { extensions: { katanaSource: { id: source.id, site: source.site, title: source.title } } },
                })
            : undefined
        }
      />
    </Cell>
  )
})
