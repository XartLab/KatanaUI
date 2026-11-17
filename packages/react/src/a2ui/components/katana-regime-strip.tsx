// SPDX-License-Identifier: MIT
// KatanaRegimeStrip：市场状态带加图例。状态靠图例里的名字认，不只靠颜色；点图例高亮某个状态，写回 activeState 并发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useState } from 'react'
import { z } from 'zod'
import { RegimeStrip } from '../../blocks/index.ts'
import { text } from '../blocks-support.ts'
import { Cell, actionSchema, parseList, weightSchema } from '../support.tsx'

const stateSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the state, referenced by the segments.'),
    name: z.string().min(1).describe('The name shown in the legend.'),
    color: z
      .number()
      .int()
      .min(1)
      .max(7)
      .describe('Category color slot from 1 to 7. Colors are categories, not good or bad. Prefer slots 1, 2, 4, 7.'),
    detail: z.string().describe('Small text after the name in the legend (for example "47%").').optional(),
  })
  .strict()

const segmentSchema = z
  .object({
    from: z.number().describe('Start, in the same unit as `to` (a timestamp or an index).'),
    to: z.number().describe('End, in the same unit as `from`.'),
    state: z.string().min(1).describe('The id of the state of this segment.'),
    estimated: z.boolean().describe('True when later data has not confirmed it yet: drawn with stripes.').optional(),
  })
  .strict()

export const KatanaRegimeStripApi = {
  name: 'KatanaRegimeStrip',
  schema: z
    .object({
      states: z
        .union([z.array(stateSchema), CommonSchemas.DataBinding])
        .describe(
          'The states of the legend. Either a literal array or a {"@path": "/regimes/states"} binding. Items that do not fit are dropped.',
        ),
      segments: z
        .union([z.array(segmentSchema), CommonSchemas.DataBinding])
        .describe(
          'The time segments, drawn left to right from the earliest to the latest. Either a literal array or a {"@path": "/regimes/segments"} binding. Items that do not fit are dropped.',
        ),
      label: CommonSchemas.DynamicString.describe('Accessible name of the band as a whole sentence.'),
      title: CommonSchemas.DynamicString.describe(
        'A heading beside the legend (for example "HMM, 4 states").',
      ).optional(),
      current: CommonSchemas.DynamicString.describe(
        'The id of the state the market is in now. It is marked in the legend.',
      ).optional(),
      labels: z
        .object({
          current: text(
            'The word that marks the current state (for example "Now"). Required when current is given.',
          ).optional(),
          estimate: text('The legend text for striped, unconfirmed segments (for example "est.").'),
        })
        .strict()
        .describe('All visible text, in the language of the user.'),
      activeState: CommonSchemas.DynamicString.describe(
        'The id of the highlighted state; the others fade. Bind it with {"@path": "/regime/active"} so a press on the legend is written back. Empty means none.',
      ).optional(),
      onSelect: actionSchema(
        'Dispatched when the user presses a legend item to highlight a state. metadata.extensions.katanaRegime.state carries the id, or null when the highlight is cleared.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaRegimeStrip = createComponentImplementation(KatanaRegimeStripApi, ({ props }) => {
  const { onSelect } = props
  // 高亮先留在本地（没绑数据模型时点了也有反应），智能体改了 activeState 就跟着它。
  const incoming = props.activeState || null
  const [active, setActive] = useState<string | null>(incoming)
  const [seen, setSeen] = useState(incoming)
  if (incoming !== seen) {
    setSeen(incoming)
    setActive(incoming)
  }
  return (
    <Cell weight={props.weight}>
      <RegimeStrip
        states={parseList(stateSchema, props.states) as never}
        segments={parseList(segmentSchema, props.segments)}
        label={props.label ?? ''}
        title={props.title}
        current={props.current || undefined}
        labels={props.labels}
        activeState={active}
        onSelect={(picked) => {
          const state = picked?.id ?? null
          setActive(state)
          props.setActiveState?.(state ?? '')
          void onSelect?.({ metadata: { extensions: { katanaRegime: { state } } } })
        }}
      />
    </Cell>
  )
})
