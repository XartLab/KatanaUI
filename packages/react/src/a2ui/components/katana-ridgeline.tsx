// SPDX-License-Identifier: MIT
// KatanaRidgeline：山脊图，每组一条核密度曲线、竖着叠起来比分布。组是对象数组（可 @path 绑定），每组原始样本有上限；密度由组件算，智能体只给样本。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { Ridgeline, type RidgeGroup } from '../../quant/index.ts'
import {
  MAX_POINTS,
  pair,
  formatSchema,
  listSchema,
  makeFormat,
  numbersCapped,
  parseCapped,
  text,
  viewProps,
  viewShape,
} from '../chart-support.ts'
import { Cell, fill, weightSchema } from '../support.tsx'

const MAX_GROUPS = 30

const groupSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the group.'),
    label: text('Name of the group.'),
    values: z
      .array(z.number())
      .max(MAX_POINTS)
      .describe('Raw samples of the group, at most 5000. The chart estimates the density itself.'),
  })
  .strict()

type Group = z.infer<typeof groupSchema>

export const KatanaRidgelineApi = {
  name: 'KatanaRidgeline',
  schema: z
    .object({
      groups: listSchema(groupSchema, MAX_GROUPS, 'The groups, one ridge each.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      describe: text(
        'One sentence per group (accessible name and read-out) with {label}, {n}, {mean}, {median}, {min} and {max}, for example "{label}: {n} samples, median {median}".',
      ),
      valueFormat: formatSchema('How a sample value is written on the axis and in the sentence.').optional(),
      baseline: z
        .number()
        .describe('A reference value such as 0, drawn as a dashed line through all ridges.')
        .optional(),
      domain: z
        .array(z.number())
        .length(2)
        .describe('Horizontal range [min, max]. Defaults to the data with margin.')
        .optional(),
      bandwidth: z
        .number()
        .min(1e-9)
        .describe('Smoothing width of the density. Defaults to Silverman rule per group.')
        .optional(),
      overlap: z
        .number()
        .min(0.5)
        .max(4)
        .describe(
          'How many row heights the highest peak reaches; above 1 the ridges overlap. Defaults to the library value.',
        )
        .optional(),
      idle: z.string().describe('What the read-out says when nothing is hovered or focused.').optional(),
      actionLabels: viewShape.actionLabels,
      tableLabel: viewShape.tableLabel,
      tableHead: viewShape.tableHead,
      source: viewShape.source,
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaRidgeline = createComponentImplementation(KatanaRidgelineApi, ({ props }) => {
  const groups = useMemo<RidgeGroup[]>(
    () =>
      parseCapped<Group>(groupSchema, props.groups, MAX_GROUPS).map((group) => ({
        id: group.id,
        label: group.label,
        values: numbersCapped(group.values),
      })),
    [props.groups],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const label = props.label ?? ''
  const { actionLabels, tableLabel, tableHead } = props
  if (!actionLabels || !tableLabel || !tableHead) return null
  return (
    <Cell weight={props.weight}>
      <Ridgeline
        groups={groups}
        label={label}
        describe={(group, stats) =>
          fill(props.describe ?? '', {
            label: group.label,
            n: stats.n,
            mean: format(stats.mean),
            median: format(stats.median),
            min: format(stats.min),
            max: format(stats.max),
          })
        }
        formatValue={format}
        baseline={props.baseline}
        domain={pair(props.domain)}
        bandwidth={props.bandwidth}
        overlap={props.overlap}
        idle={props.idle}
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, label)}
      />
    </Cell>
  )
})
