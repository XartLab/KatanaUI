// SPDX-License-Identifier: MIT
// KatanaNewsReader：新闻阅读窗（标题、来源、要点、相关品种、正文段落）。正文只收纯文字段落，不收 HTML；
// 关闭、举报、复制链接、点品种都只发 Action（链接由宿主自己知道，这里不带）。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { NewsReader } from '../../blocks/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

export const KatanaNewsReaderApi = {
  name: 'KatanaNewsReader',
  schema: z
    .object({
      title: CommonSchemas.DynamicString.describe('The headline.'),
      source: CommonSchemas.DynamicString.describe('The name of the source.'),
      meta: CommonSchemas.DynamicString.describe(
        'A written meta line, for example "7 min ago · Reuters · 2 min read".',
      ),
      keyPoints: z.array(z.string()).max(8).describe('Key points shown above the body.').optional(),
      symbols: z
        .array(
          z
            .object({
              code: z.string().min(1).describe('Instrument code.'),
              name: z.string().describe('Instrument name.').optional(),
              change: z.number().describe('Price change as a percent already: -0.59 is -0.59%.').optional(),
            })
            .strict(),
        )
        .max(12)
        .describe('Instruments the news is about.')
        .optional(),
      body: z.array(z.string()).max(60).describe('The article body, one plain-text string per paragraph. No markup.'),
      labels: z
        .object({
          reader: text('Accessible name of the reader.'),
          keyPoints: text('Heading of the key points.'),
          close: text('Name of the close button.'),
          report: text('Name of the report button.'),
          copyLink: text('Name of the copy-link button.'),
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      onClose: actionSchema('Dispatched when the user closes the reader.').optional(),
      onReport: actionSchema('Dispatched when the user presses report.').optional(),
      onCopyLink: actionSchema('Dispatched when the user presses copy link; the host knows the link.').optional(),
      onSymbolPick: actionSchema(
        'Dispatched when the user presses an instrument. metadata.extensions.katanaSymbol carries {code}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaNewsReader = createComponentImplementation(KatanaNewsReaderApi, ({ props }) => {
  const t = props.labels
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <NewsReader
        title={props.title ?? ''}
        source={props.source ?? ''}
        meta={props.meta ?? ''}
        keyPoints={props.keyPoints}
        symbols={props.symbols}
        labels={t}
        onClose={props.onClose ? () => void props.onClose?.() : undefined}
        onReport={props.onReport ? () => void props.onReport?.() : undefined}
        onCopyLink={props.onCopyLink ? () => void props.onCopyLink?.() : undefined}
        onSymbolPick={
          props.onSymbolPick
            ? (symbol) => void props.onSymbolPick?.(withExtension('katanaSymbol', { code: symbol.code }))
            : undefined
        }
      >
        {(props.body ?? []).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </NewsReader>
    </Cell>
  )
})
