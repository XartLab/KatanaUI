// SPDX-License-Identifier: MIT
// KatanaFlowSankey：资金流向桑基图。节点与链路是对象数组（可 @path 绑定）；节点颜色不由智能体传（走 token 的中性色）。
// 图里有环或没有链路时库里写 labels.cycle / labels.empty，所以这两句也由智能体给。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { FlowSankey, type FlowLink, type FlowNode } from '../../quant/index.ts'
import { formatSchema, listSchema, makeFormat, parseCapped, text, viewProps, viewShape } from '../chart-support.ts'
import { Cell, weightSchema } from '../support.tsx'

const MAX_NODES = 200
const MAX_LINKS = 500

const nodeSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the node, referenced by links.'),
    label: text('Name of the node.'),
    column: z
      .number()
      .int()
      .min(0)
      .max(12)
      .describe(
        'Which column the node sits in, from 0. Used only when every node gives one; otherwise columns follow link depth.',
      )
      .optional(),
  })
  .strict()

const linkSchema = z
  .object({
    id: z.string().describe('Id of the link. Defaults to source>target>kind.').optional(),
    source: z.string().min(1).describe('Id of the node the flow leaves.'),
    target: z.string().min(1).describe('Id of the node the flow enters.'),
    value: z.number().min(1e-9).describe('Size of the flow in the unit of valueFormat.'),
    kind: z
      .enum(['flow', 'revaluation'])
      .describe("'flow' is traded volume; 'revaluation' is a price effect. Defaults to flow.")
      .optional(),
    note: z.string().describe('An extra line in the hover box.').optional(),
  })
  .strict()

type Node = z.infer<typeof nodeSchema>
type Link = z.infer<typeof linkSchema>

export const KatanaFlowSankeyApi = {
  name: 'KatanaFlowSankey',
  schema: z
    .object({
      nodes: listSchema(nodeSchema, MAX_NODES, 'The nodes.'),
      links: listSchema(linkSchema, MAX_LINKS, 'The flows between nodes. Links to a missing node are dropped.'),
      columnLabels: z
        .array(z.string())
        .max(12)
        .describe('Title above each column, for example source, channel, use. Omit for none.')
        .optional(),
      valueFormat: formatSchema('How an amount is written, with its unit.').optional(),
      shareDigits: z
        .number()
        .int()
        .min(0)
        .max(3)
        .describe('Decimal places of shares, written as percentages. Defaults to 1.')
        .optional(),
      labels: z
        .object({
          chart: text('Accessible name of the whole chart.'),
          flow: text('Name of the traded flow kind.'),
          revaluation: text('Name of the price revaluation kind.'),
          showRevaluation: text('Text of the switch that shows revaluation links.'),
          amount: text('Name of the amount row in the read-out.'),
          shareOfSource: text('Name of the share of source row.'),
          shareOfTotal: text('Name of the share of total row.'),
          inflow: text('Name of the inflow row.'),
          outflow: text('Name of the outflow row.'),
          revalIn: text('Name of the revaluation in row.'),
          revalOut: text('Name of the revaluation out row.'),
          empty: text('Text shown when there are no links to draw.'),
          cycle: text('Text shown when the links form a loop and cannot be laid out.'),
        })
        .strict()
        .describe('All visible words of the chart; it carries none of its own.'),
      badge: z.string().describe('A small note at the foot, for example that the data is a demo.').optional(),
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

export const KatanaFlowSankey = createComponentImplementation(KatanaFlowSankeyApi, ({ props }) => {
  const nodes = useMemo<FlowNode[]>(
    () =>
      parseCapped<Node>(nodeSchema, props.nodes, MAX_NODES).map((node) => ({
        id: node.id,
        label: node.label,
        ...(node.column === undefined ? {} : { column: node.column }),
      })),
    [props.nodes],
  )
  const links = useMemo<FlowLink[]>(
    () =>
      parseCapped<Link>(linkSchema, props.links, MAX_LINKS).map((link) => ({
        ...(link.id === undefined ? {} : { id: link.id }),
        source: link.source,
        target: link.target,
        value: link.value,
        ...(link.kind === undefined ? {} : { kind: link.kind }),
        ...(link.note === undefined ? {} : { note: link.note }),
      })),
    [props.links],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const share = useMemo(() => makeFormat({ style: 'percent', digits: props.shareDigits ?? 1 }), [props.shareDigits])
  const { labels, actionLabels, tableLabel, tableHead } = props
  if (!labels || !actionLabels || !tableLabel || !tableHead) return null
  return (
    <Cell weight={props.weight}>
      <FlowSankey
        nodes={nodes}
        links={links}
        labels={labels}
        columnLabels={props.columnLabels}
        formatValue={format}
        formatShare={(ratio) => share(ratio * 100)}
        badge={props.badge}
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, labels.chart)}
      />
    </Cell>
  )
})
