// SPDX-License-Identifier: MIT
// KatanaDocReader：文档阅读器（目录、文中查找、按段引用）。块可以 @path 绑定；点引用钮发 onCite，metadata.extensions.katanaDoc.id 是那一块的 id，
// 宿主拿它拼引用（kref:）。件不取数、不解析 PDF。全部文字由智能体写；命中计数的模板里 {current}、{total} 会被换掉。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { DocReader } from '../../blocks/index.ts'
import { text } from '../chart-support.ts'
import { Cell, actionSchema, fill, parseList, weightSchema } from '../support.tsx'

const MAX_BLOCKS = 5000

const blockSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the block; the host builds the citation from it.'),
    kind: z.enum(['heading', 'paragraph']),
    text: z.string().max(20000),
    level: z.number().int().min(1).max(4).describe('Heading level, 1 is the top.').optional(),
  })
  .strict()

export const KatanaDocReaderApi = {
  name: 'KatanaDocReader',
  schema: z
    .object({
      title: text('Title of the document.'),
      meta: z.string().describe('One line under the title (date, kind, pages).').optional(),
      blocks: z
        .union([z.array(blockSchema).max(MAX_BLOCKS), CommonSchemas.DataBinding])
        .describe('Headings and paragraphs in order, or {"@path": "/doc"}.'),
      activeId: z.string().describe('Block to scroll to and mark.').optional(),
      hideOutline: z.boolean().describe('Hide the outline in narrow cells.').optional(),
      height: z.number().int().min(160).max(2000).describe('Height in px.').optional(),
      labels: z
        .object({
          reader: text('Accessible name of the reader.'),
          outline: text('Accessible name of the outline.'),
          search: text('Label and placeholder of the find box.'),
          matches: text('Match count; {current} and {total} are replaced.'),
          noMatch: text('Text when nothing is found.'),
          previous: text('Name of the previous-match button.'),
          next: text('Name of the next-match button.'),
          cite: text('Name of the cite button.'),
          empty: text('Text when there are no blocks.'),
        })
        .strict()
        .describe('All visible words of the reader.'),
      source: z.string().describe('Source line.').optional(),
      onCite: actionSchema(
        'Dispatched when the user cites a paragraph. metadata.extensions.katanaDoc.id carries the block id.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaDocReader = createComponentImplementation(KatanaDocReaderApi, ({ props }) => {
  const blocks = useMemo(() => parseList(blockSchema, props.blocks).slice(0, MAX_BLOCKS), [props.blocks])
  const { labels, onCite } = props
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <DocReader
        title={props.title ?? ''}
        meta={props.meta}
        blocks={blocks}
        activeId={props.activeId}
        hideOutline={props.hideOutline}
        height={props.height}
        source={props.source}
        labels={{ ...labels, matches: (current, total) => fill(labels.matches, { current, total }) }}
        onCite={
          onCite ? (block) => void onCite({ metadata: { extensions: { katanaDoc: { id: block.id } } } }) : undefined
        }
      />
    </Cell>
  )
})
