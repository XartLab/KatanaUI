// SPDX-License-Identifier: MIT
// KatanaWatchlist：自选表（代码、最新价、涨跌额、涨跌幅，可按列排序，可标旗）。价格位数由 digits 定；点一行与标旗只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Watchlist, type WatchlistRow } from '../../quant/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, parseList, weightSchema } from '../support.tsx'

const rowSchema = z
  .object({
    key: z.string().min(1).describe('Stable key of the row. The host gets it back with every action.'),
    code: z.string().describe('The instrument code.'),
    name: z.string().describe('The instrument name.').optional(),
    last: z.number().describe('The latest price.'),
    change: z.number().describe('Price change in price units.'),
    changePct: z.number().describe('Price change as a percent already: 1.5 is +1.50%.'),
    flagged: z.boolean().describe('Whether the row is flagged.').optional(),
  })
  .strict()

export const KatanaWatchlistApi = {
  name: 'KatanaWatchlist',
  schema: z
    .object({
      rows: z
        .union([z.array(rowSchema), CommonSchemas.DataBinding])
        .describe(
          'The rows. Either a literal array or {"@path": "/watch"} bound to a data-model array, so prices can tick.',
        ),
      digits: z.number().int().min(0).max(8).default(2).describe('Decimal places of prices and changes.').optional(),
      labels: z
        .object({
          columnSymbol: text('Column header: symbol.'),
          columnLast: text('Column header: last price.'),
          columnChange: text('Column header: change.'),
          columnChangePct: text('Column header: change percent.'),
          list: text('Accessible name of the table.'),
          empty: text('Text when there are no rows.'),
          flag: text('Accessible name of the flag button; {code} is the instrument code, for example "Flag {code}".'),
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      onRow: actionSchema(
        'Dispatched when the user presses a row. metadata.extensions.katanaWatch carries {key, code}.',
      ).optional(),
      onFlag: actionSchema(
        'Dispatched when the user flags or unflags a row. metadata.extensions.katanaWatch carries {key, code, flagged}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaWatchlist = createComponentImplementation(KatanaWatchlistApi, ({ props }) => {
  const source = useMemo(() => parseList(rowSchema, props.rows), [props.rows])
  const [flags, setFlags] = useState<Readonly<Record<string, boolean>>>({})
  // 数据模型更新了：以数据里的旗为准。
  useEffect(() => setFlags((current) => (Object.keys(current).length > 0 ? {} : current)), [source])
  const rows: WatchlistRow[] = source.map((row) => ({
    key: row.key,
    code: row.code,
    last: row.last,
    change: row.change,
    changePct: row.changePct,
    flagged: flags[row.key] ?? row.flagged === true,
    ...(row.name === undefined ? {} : { name: row.name }),
  }))
  const digits = props.digits ?? 2
  const t = props.labels
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <Watchlist
        rows={rows}
        formatPrice={(value) =>
          value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        }
        onRow={
          props.onRow
            ? (row) => void props.onRow?.(withExtension('katanaWatch', { key: row.key, code: row.code }))
            : undefined
        }
        onFlag={(row, flagged) => {
          setFlags((current) => ({ ...current, [row.key]: flagged }))
          void props.onFlag?.(withExtension('katanaWatch', { key: row.key, code: row.code, flagged }))
        }}
        labels={{
          columns: { symbol: t.columnSymbol, last: t.columnLast, chg: t.columnChange, chgPct: t.columnChangePct },
          list: t.list,
          empty: t.empty,
          flag: (row) => fill(t.flag, { code: row.code }),
        }}
      />
    </Cell>
  )
})
