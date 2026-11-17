// SPDX-License-Identifier: MIT
// KatanaPeerCards：同业卡带（代码、名称、价格、涨跌幅，两侧翻页）。卡是统一行情行的 id / symbol / last / changePct（2026-11-18），价格位数由 digits 定；
// 全部文字由智能体写；选卡、加入、对比都只发 Action；不收公司标志地址。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { PeerCards } from '../../quotes/index.ts'
import { Cell, actionSchema, fill, parseList, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the peer. The host gets it back with every action.'),
    symbol: z.string().min(1).describe('The symbol code (for example a ticker).'),
    name: z.string().describe('The company or fund name; long names are truncated.'),
    last: z.number().describe('The latest price.'),
    unit: z.string().describe('A small unit after the price (for example "USD").').optional(),
    changePct: z.number().describe('The change as a percentage already: 1.5 means +1.50%.'),
  })
  .strict()

export const KatanaPeerCardsApi = {
  name: 'KatanaPeerCards',
  schema: z
    .object({
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The peers. Either a literal array or {"@path": "/peers"} bound to a data-model array. Items that do not fit the shape are dropped.',
        ),
      digits: z.number().int().min(0).max(8).default(2).describe('Decimal places of prices.').optional(),
      labels: z
        .object({
          list: z.string().describe('Accessible name of the whole strip.'),
          prev: z.string().describe('Accessible name of the previous-page arrow.'),
          next: z.string().describe('Accessible name of the next-page arrow.'),
          compare: z.string().describe('Text of the compare button at the top right.'),
          add: z
            .string()
            .describe('Accessible name of the "+" button on each card. {symbol} and {name} are replaced by the peer.'),
        })
        .strict()
        .describe('All the words of the component, written in the language of the user.'),
      onSelect: actionSchema(
        'Dispatched when the user presses a peer card. metadata.extensions.katanaPeer.id carries the id.',
      ).optional(),
      onAdd: actionSchema(
        'Dispatched when the user presses the "+" on a card. metadata.extensions.katanaPeer.id carries the id.',
      ).optional(),
      onCompare: actionSchema('Dispatched when the user presses the compare button.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaPeerCards = createComponentImplementation(KatanaPeerCardsApi, ({ props }) => {
  const { onSelect, onAdd, onCompare } = props
  const labels = props.labels
  const digits = props.digits ?? 2
  const peer = (id: string) => ({ metadata: { extensions: { katanaPeer: { id } } } })
  return (
    <Cell weight={props.weight}>
      <PeerCards
        items={parseList(itemSchema, props.items)}
        formatPrice={(value) =>
          value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        }
        labels={{
          list: labels?.list ?? '',
          prev: labels?.prev ?? '',
          next: labels?.next ?? '',
          compare: labels?.compare ?? '',
          add: (item) => fill(labels?.add ?? '', { symbol: item.symbol, name: item.name }),
        }}
        onSelect={(item) => void onSelect?.(peer(item.id))}
        onAdd={(item) => void onAdd?.(peer(item.id))}
        onCompare={() => void onCompare?.()}
      />
    </Cell>
  )
})
