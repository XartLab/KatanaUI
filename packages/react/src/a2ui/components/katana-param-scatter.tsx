// SPDX-License-Identifier: MIT
// KatanaParamScatter：参数扫描散点（两根参数轴，颜色是目标值，如夏普）。点是对象数组（可 @path 绑定）；选点发 Action，被选的点由 metadata.extensions.katanaChartPoint 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { ParamScatter, type ParamPoint } from '../../quant/index.ts'
import {
  MAX_POINTS,
  dispatch,
  formatSchema,
  listSchema,
  makeFormat,
  parseCapped,
  text,
  viewProps,
  viewShape,
} from '../chart-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

const pointSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the parameter set. The host gets it back when a point is chosen.'),
    x: z.number().describe('Value of the parameter on the horizontal axis.'),
    y: z.number().describe('Value of the parameter on the vertical axis.'),
    value: z
      .number()
      .nullable()
      .describe('The objective value of this set, for example the Sharpe ratio. Null when the run has no result.'),
  })
  .strict()

export const KatanaParamScatterApi = {
  name: 'KatanaParamScatter',
  schema: z
    .object({
      points: listSchema(pointSchema, MAX_POINTS, 'The parameter sets, one point each.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      axes: z
        .object({ x: text('Name of the horizontal parameter.'), y: text('Name of the vertical parameter.') })
        .strict()
        .describe('Names of the two parameter axes.'),
      valueName: text('Name of the objective value, used for the color bar and the read-out.'),
      xFormat: formatSchema('How a horizontal parameter is written.').optional(),
      yFormat: formatSchema('How a vertical parameter is written.').optional(),
      valueFormat: formatSchema('How the objective value is written.').optional(),
      goal: z
        .enum(['max', 'min'])
        .describe('Whether a larger or smaller objective is better. Defaults to max.')
        .optional(),
      ramp: z
        .enum(['auto', 'sequential', 'diverging'])
        .describe("Color ramp. 'auto' uses a diverging ramp when the objective crosses zero.")
        .optional(),
      bestLabel: text('The word for the best point, used in the read-out and accessible names.'),
      jumpLabel: text('Text of the button that jumps to the best point.'),
      noValue: text('What the read-out says for a point with no result.'),
      idle: text('What the read-out says when no point is chosen.'),
      selected: CommonSchemas.DynamicString.describe(
        'Id of the chosen point. Bind it to write the choice back.',
      ).optional(),
      actionLabels: viewShape.actionLabels,
      tableLabel: viewShape.tableLabel,
      tableHead: viewShape.tableHead,
      source: viewShape.source,
      onSelect: actionSchema(
        'Dispatched when the user chooses a point or jumps to the best. metadata.extensions.katanaChartPoint carries {id}; id is null when the choice is cleared.',
      ).optional(),
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaParamScatter = createComponentImplementation(KatanaParamScatterApi, ({ props }) => {
  const points = useMemo<ParamPoint[]>(() => parseCapped(pointSchema, props.points, MAX_POINTS), [props.points])
  const fx = useMemo(() => makeFormat(props.xFormat), [props.xFormat])
  const fy = useMemo(() => makeFormat(props.yFormat), [props.yFormat])
  const fv = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const label = props.label ?? ''
  const { axes, actionLabels, tableLabel, tableHead } = props
  if (!axes || !actionLabels || !tableLabel || !tableHead) return null
  return (
    <Cell weight={props.weight}>
      <ParamScatter
        points={points}
        label={label}
        axes={axes}
        valueName={props.valueName ?? ''}
        formatX={fx}
        formatY={fy}
        formatValue={fv}
        goal={props.goal}
        ramp={props.ramp}
        bestLabel={props.bestLabel ?? ''}
        jumpLabel={props.jumpLabel ?? ''}
        noValue={props.noValue ?? ''}
        idle={props.idle ?? ''}
        selected={props.selected}
        onSelect={(id) => dispatch(props.onSelect, 'katanaChartPoint', { id })}
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, label)}
      />
    </Cell>
  )
})
