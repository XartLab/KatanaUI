// SPDX-License-Identifier: MIT
// KatanaQuoteTable：分组行情表（每组一个页签，行里有价、涨跌幅与迷你走势）。价与涨跌幅文字由智能体格式化好传来；点一行只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { QuoteTable, type QuoteGroup } from '../../index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, numberList, parseList, weightSchema } from '../support.tsx'

const rowSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the row. The host gets it back when the row is pressed.'),
    name: z.string().describe('The instrument name.'),
    symbol: z.string().describe('The instrument code, in small text beside the name.').optional(),
    price: z.string().describe('The price, already formatted as text.'),
    percent: z.string().describe('The change, already formatted as text such as "+1.20%".').optional(),
    tone: z.enum(['up', 'down', 'flat']).describe('Direction of the change; colors the change text.').optional(),
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
      label: CommonSchemas.DynamicString.describe('Accessible name of the tab strip.'),
      columnName: text('Header of the name column.'),
      columnTrend: text('Header of the trend column.'),
      columnPrice: text('Header of the price column.'),
      columnChange: text('Header of the change column.'),
      empty: text('Text when a group has no rows.'),
      defaultGroup: z.string().describe('Id of the group shown first. Defaults to the first group.').optional(),
      onRow: actionSchema(
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
          name: row.name,
          price: row.price,
          ...(row.symbol === undefined ? {} : { symbol: row.symbol }),
          ...(row.percent === undefined ? {} : { percent: row.percent }),
          ...(row.tone === undefined ? {} : { tone: row.tone }),
          ...(row.spark === undefined || numberList(row.spark).length < 2
            ? {}
            : { spark: numberList(row.spark), sparkLabel: row.sparkLabel ?? row.name }),
        })),
      })),
    [props.groups],
  )
  const owner = (id: string) => groups.find((group) => group.rows.some((row) => row.id === id))?.id
  return (
    <Cell weight={props.weight}>
      <QuoteTable
        groups={groups}
        label={props.label ?? ''}
        columns={{
          name: props.columnName,
          trend: props.columnTrend,
          price: props.columnPrice,
          change: props.columnChange,
        }}
        empty={props.empty}
        defaultValue={props.defaultGroup}
        onValueChange={(groupId) => void props.onGroupChange?.(withExtension('katanaQuote', { groupId }))}
        onRow={
          props.onRow
            ? (row) => void props.onRow?.(withExtension('katanaQuote', { id: row.id, groupId: owner(row.id) ?? null }))
            : undefined
        }
      />
    </Cell>
  )
})
