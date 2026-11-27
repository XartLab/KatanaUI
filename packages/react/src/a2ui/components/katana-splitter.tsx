// SPDX-License-Identifier: MIT
// KatanaSplitter：两栏（左右或上下），中间一条可拖的分割线；两栏各是一个子组件。分的比例由用户拖，件自己记，不回写数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useState } from 'react'
import { z } from 'zod'
import { Splitter } from '../../index.ts'
import { text } from '../blocks-support.ts'
import { Cell, fill, weightSchema } from '../support.tsx'

export const KatanaSplitterApi = {
  name: 'KatanaSplitter',
  schema: z
    .object({
      axis: z
        .enum(['row', 'column'])
        .describe("'row' puts the two panes side by side (a vertical line), 'column' stacks them (a horizontal line)."),
      first: CommonSchemas.ComponentId.describe('The left (row) or top (column) pane.'),
      second: CommonSchemas.ComponentId.describe('The right (row) or bottom (column) pane.'),
      ratio: z
        .number()
        .min(0.05)
        .max(0.95)
        .default(0.5)
        .describe('Initial share of the first pane, 0.05 to 0.95.')
        .optional(),
      minFirst: z.number().min(0).max(2000).describe('Smallest size of the first pane in px.').optional(),
      minSecond: z.number().min(0).max(2000).describe('Smallest size of the second pane in px.').optional(),
      height: z
        .number()
        .min(80)
        .max(2000)
        .describe(
          'Height in px. Needed for a column split, which has no natural height; a row split follows its panes.',
        )
        .optional(),
      label: CommonSchemas.DynamicString.describe('Accessible name of the dividing line, read by screen readers.'),
      valueLabel: text(
        'Spoken value of the line; {percent} is the share of the first pane, for example "First pane {percent}%".',
      ),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSplitter = createComponentImplementation(KatanaSplitterApi, ({ props, buildChild }) => {
  const start = props.ratio ?? 0.5
  const [ratio, setRatio] = useState(start)
  const row = props.axis !== 'column'
  const first = Math.round(ratio * 1000)
  const template = `${first}fr auto ${1000 - first}fr`
  return (
    <Cell weight={props.weight}>
      <div
        className="k-a2ui-split"
        style={{
          [row ? 'gridTemplateColumns' : 'gridTemplateRows']: template,
          height: props.height,
        }}
      >
        <div>{buildChild(props.first)}</div>
        <Splitter
          axis={row ? 'row' : 'column'}
          ratio={ratio}
          defaultRatio={start}
          minFirst={props.minFirst}
          minSecond={props.minSecond}
          onChange={setRatio}
          label={props.label ?? ''}
          valueText={(value) => fill(props.valueLabel, { percent: Math.round(value * 100) })}
        />
        <div>{buildChild(props.second)}</div>
      </div>
    </Cell>
  )
})
