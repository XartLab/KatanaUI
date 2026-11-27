// SPDX-License-Identifier: MIT
// KatanaJsonViewer：只读的 JSON 树（折叠加查找）。不编辑、不复制；值只当文字画。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { JsonViewer, type JsonViewerLabels } from '../../index.ts'
import { Cell, fill, weightSchema } from '../support.tsx'

export const KatanaJsonViewerApi = {
  name: 'KatanaJsonViewer',
  schema: z
    .object({
      value: CommonSchemas.DynamicValue.describe(
        'The value to inspect: any JSON, written inline or bound with {"@path": "/raw"} to the data model. It is only displayed.',
      ),
      label: CommonSchemas.DynamicString.describe('Accessible name of the whole tree.'),
      labels: z
        .object({
          search: z.string().describe('Accessible name and hint text of the search box.'),
          matches: z.string().describe('Text of the match count; must contain {count}.'),
          noMatches: z.string().describe('Text shown when the search finds nothing.'),
          more: z.string().describe('Text of the row that stands for hidden children; must contain {count}.'),
        })
        .strict()
        .describe(
          'All the texts, all required: the component carries no wording of its own. Write them in the language of the user.',
        ),
      defaultExpandDepth: z
        .number()
        .int()
        .min(1)
        .max(8)
        .default(1)
        .describe('How many levels are open at first: 1 opens only the root.')
        .optional(),
      maxChildren: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .describe('Most children drawn per container; the rest fold into one "more" row.')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaJsonViewer = createComponentImplementation(KatanaJsonViewerApi, ({ props }) => {
  const { labels } = props
  const text = useMemo<JsonViewerLabels>(
    () => ({
      search: labels.search,
      matches: (count) => (count === 0 ? labels.noMatches : fill(labels.matches, { count })),
      more: (count) => fill(labels.more, { count }),
    }),
    [labels],
  )
  return (
    <Cell weight={props.weight}>
      <JsonViewer
        value={props.value}
        label={props.label ?? ''}
        labels={text}
        defaultExpandDepth={props.defaultExpandDepth}
        maxChildren={props.maxChildren}
      />
    </Cell>
  )
})
