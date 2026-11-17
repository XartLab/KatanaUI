// SPDX-License-Identifier: MIT
// KatanaLimitLadder：连板天梯（按几连板分层，每层列出个股、封板状态与晋级率）。点一行与行快捷动作只发 Action，带股票代码。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import type { RowAction } from '../../index.ts'
import { LimitLadder, type LadderLevel } from '../../quant/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, parseList, weightSchema } from '../support.tsx'

const STATUS = ['sealed', 'broken', 'down', 'none'] as const

const itemSchema = z
  .object({
    code: z.string().min(1).describe('The stock code. The host gets it back with every action.'),
    name: z.string().describe('The stock name.'),
    change: z.number().describe('Price change as a percent already: 10 is +10%.'),
    firstSeal: z
      .string()
      .describe('When it first hit the limit, written by you, for example "09:31". Omit if never.')
      .optional(),
    sealAmount: z.number().min(0).describe('Amount of orders sealing the limit, in the account currency.').optional(),
    opens: z.number().int().min(0).describe('How many times the limit opened.').optional(),
    industry: z.string().describe('The industry name.').optional(),
    status: z
      .enum(STATUS)
      .describe("'sealed' at the limit, 'broken' opened after sealing, 'down' limit down, 'none' no limit."),
  })
  .strict()

const levelSchema = z
  .object({
    board: z.number().int().min(1).describe('How many consecutive limit-up days this layer stands for.'),
    promoted: z
      .array(z.number().int().min(0))
      .length(2)
      .describe(
        "[promoted count, candidate count]: of yesterday's stocks one level lower, how many reached this level today.",
      )
      .optional(),
    items: z.array(itemSchema).describe('The stocks of this layer.'),
  })
  .strict()

export const KatanaLimitLadderApi = {
  name: 'KatanaLimitLadder',
  schema: z
    .object({
      levels: z
        .union([z.array(levelSchema), CommonSchemas.DataBinding])
        .describe(
          'The layers, highest board first. Either a literal array or {"@path": "/ladder"} bound to a data-model array.',
        ),
      labels: z
        .object({
          board: text('Unit written beside a layer number, for example "boards".'),
          promoted: text(
            'Promotion rate in a layer header; {done} and {total}, for example "Promoted {done}/{total}".',
          ),
          count: text('Stock count in a layer header; {n}, for example "{n} stocks".'),
          statusSealed: text('Status word: sealed at the limit.'),
          statusBroken: text('Status word: limit opened.'),
          statusDown: text('Status word: limit down.'),
          statusNone: text('Status word: no limit.'),
          columnName: text('Column header: name.'),
          columnChange: text('Column header: change.'),
          columnFirstSeal: text('Column header: first seal time.'),
          columnSealAmount: text('Column header: seal amount.'),
          columnOpens: text('Column header: number of openings.'),
          columnIndustry: text('Column header: industry.'),
          summarySealed: text('Summary reading: number of stocks at the limit.'),
          summaryHighest: text('Summary reading: highest board.'),
          summaryPromoteRate: text('Summary reading: overall promotion rate.'),
          list: text('Accessible name of the whole ladder.'),
          empty: text('Text when there are no layers.'),
          rowActions: text('Accessible name of the row quick-action bar.'),
          rowMenu: text('Accessible name of the row context menu.'),
        })
        .strict()
        .describe('All visible and screen-reader text of the ladder, in the language of the user.'),
      rowActions: z
        .array(
          z
            .object({
              key: z.string().min(1).describe('Stable key of the action.'),
              label: text('The action name, shown in the row context menu.'),
              action: actionSchema(
                'Dispatched when the user picks it. metadata.extensions.katanaStock carries {code, key}.',
              ),
            })
            .strict(),
        )
        .max(6)
        .describe('Actions on a stock row, in its context menu.')
        .optional(),
      onSelect: actionSchema(
        'Dispatched when the user picks a stock row. metadata.extensions.katanaStock carries {code}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

type ActionProp = { key: string; label: string; action?: (extra?: unknown) => unknown }

export const KatanaLimitLadder = createComponentImplementation(KatanaLimitLadderApi, ({ props }) => {
  const [selected, setSelected] = useState<string | null>(null)
  const levels = useMemo(
    () =>
      parseList(levelSchema, props.levels).map((level): LadderLevel => ({
        board: level.board,
        ...(level.promoted === undefined
          ? {}
          : { promoted: [level.promoted[0] ?? 0, level.promoted[1] ?? 0] as [number, number] }),
        items: level.items.map((item) => ({
          code: item.code,
          name: item.name,
          change: item.change,
          status: item.status,
          ...(item.firstSeal === undefined ? {} : { firstSeal: item.firstSeal }),
          ...(item.sealAmount === undefined ? {} : { sealAmount: item.sealAmount }),
          ...(item.opens === undefined ? {} : { opens: item.opens }),
          ...(item.industry === undefined ? {} : { industry: item.industry }),
        })),
      })),
    [props.levels],
  )
  const t = props.labels
  const actions = (props.rowActions ?? []) as ActionProp[]
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <LimitLadder
        levels={levels}
        selected={selected}
        onSelect={({ code }) => {
          setSelected(code)
          void props.onSelect?.(withExtension('katanaStock', { code }))
        }}
        rowActions={
          actions.length > 0
            ? (item): readonly RowAction[] =>
                actions.map((entry) => ({
                  key: entry.key,
                  label: entry.label,
                  onSelect: () =>
                    void entry.action?.(withExtension('katanaStock', { code: item.code, key: entry.key })),
                }))
            : undefined
        }
        labels={{
          board: t.board,
          promoted: (done, total) => fill(t.promoted, { done, total }),
          count: (n) => fill(t.count, { n }),
          status: { sealed: t.statusSealed, broken: t.statusBroken, down: t.statusDown, none: t.statusNone },
          columns: {
            name: t.columnName,
            change: t.columnChange,
            firstSeal: t.columnFirstSeal,
            sealAmount: t.columnSealAmount,
            opens: t.columnOpens,
            industry: t.columnIndustry,
          },
          summary: { sealed: t.summarySealed, highest: t.summaryHighest, promoteRate: t.summaryPromoteRate },
          list: t.list,
          empty: t.empty,
          rowActions: t.rowActions,
          rowMenu: t.rowMenu,
        }}
      />
    </Cell>
  )
})
