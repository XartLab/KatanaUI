// SPDX-License-Identifier: MIT
// KatanaQuoteTable：分组行情表（每组一个页签，行里有价、涨跌幅与迷你走势）。行是自选列表的行（统一行情行 { id, symbol, name, last, change, changePct }，2026-11-18），
// 价格位数由 digits 定；文字全在 labels 里；点一行只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { QuoteTable, type QuoteGroup } from '../../quotes/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, numberList, parseList, weightSchema } from '../support.tsx'

const rowSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the row. The host gets it back when the row is pressed.'),
    symbol: z.string().describe('The instrument code, in small text beside the name.'),
    name: z.string().describe('The instrument name; the code takes its place when omitted.').optional(),
    last: z.number().describe('The latest price.'),
    change: z.number().describe('Price change in price units; its sign sets the direction.'),
    changePct: z.number().describe('Price change as a percent already: 1.5 is +1.50%.'),
    spark: z.array(z.number()).max(200).describe('Recent prices, oldest first, for the small line.').optional(),
    sparkLabel: z.string().describe('Accessible name of the small line. Required when spark is given.').optional(),
  })
  .strict()

const groupSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the group.'),
    label: text('The tab text of the group.'),
    rows: z.array(rowSchema).describe('The rows of the group.'),
  })
  .strict()

export const KatanaQuoteTableApi = {
  name: 'KatanaQuoteTable',
  schema: z
    .object({
      groups: z
        .union([z.array(groupSchema).min(1), CommonSchemas.DataBinding])
        .describe(
          'The groups, one tab each. Either a literal array or {"@path": "/quotes"} bound to a data-model array.',
        ),
      digits: z.number().int().min(0).max(8).default(2).describe('Decimal places of prices.').optional(),
      labels: z
        .object({
          list: text('Accessible name of the tab strip.'),
          columnName: text('Header of the name column.'),
          columnTrend: text('Header of the trend column.'),
          columnPrice: text('Header of the price column.'),
          columnChange: text('Header of the change column.'),
          empty: text('Text when a group has no rows.'),
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      defaultGroup: z.string().describe('Id of the group shown first. Defaults to the first group.').optional(),
      onSelect: actionSchema(
        'Dispatched when the user presses a row. metadata.extensions.katanaQuote carries {id, groupId}.',
      ).optional(),
      onGroupChange: actionSchema(
        'Dispatched when the user opens another tab. metadata.extensions.katanaQuote carries {groupId}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaQuoteTable = createComponentImplementation(KatanaQuoteTableApi, ({ props }) => {
  const groups = useMemo(
    () =>
      parseList(groupSchema, props.groups).map((group): QuoteGroup => ({
        id: group.id,
        label: group.label,
        rows: group.rows.map((row) => ({
          id: row.id,
          symbol: row.symbol,
          last: row.last,
          change: row.change,
          changePct: row.changePct,
          ...(row.name === undefined ? {} : { name: row.name }),
          ...(row.spark === undefined || numberList(row.spark).length < 2
            ? {}
            : { spark: numberList(row.spark), sparkLabel: row.sparkLabel ?? row.name ?? row.symbol }),
        })),
      })),
    [props.groups],
  )
  const owner = (id: string) => groups.find((group) => group.rows.some((row) => row.id === id))?.id
  const digits = props.digits ?? 2
  const t = props.labels
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <QuoteTable
        groups={groups}
        formatPrice={(value) =>
          value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        }
        labels={{
          list: t.list,
          columns: { name: t.columnName, trend: t.columnTrend, price: t.columnPrice, change: t.columnChange },
          empty: t.empty,
        }}
        defaultValue={props.defaultGroup}
        onValueChange={(groupId) => void props.onGroupChange?.(withExtension('katanaQuote', { groupId }))}
        onSelect={
          props.onSelect
            ? (row) =>
                void props.onSelect?.(withExtension('katanaQuote', { id: row.id, groupId: owner(row.id) ?? null }))
            : undefined
        }
      />
    </Cell>
  )
})
