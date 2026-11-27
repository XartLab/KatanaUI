// SPDX-License-Identifier: MIT
// KatanaPanelFrame：面板壳（标题栏加内容区，可折叠，可显示加载与空态）。标题栏的工具条与动作位、内容区都是子组件（ChildList），
// 智能体往里放读数、表格或按钮；壳自己不做事，也不认识工作区。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../blocks/index.ts'
import { childRefs, text } from '../blocks-support.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaPanelFrameApi = {
  name: 'KatanaPanelFrame',
  schema: z
    .object({
      heading: CommonSchemas.DynamicString.describe('The panel title, shown in the title bar.'),
      object: CommonSchemas.DynamicString.describe(
        'What the panel is about right now, for example an instrument or a filter, in small monospace text after the title.',
      ).optional(),
      toolbar: CommonSchemas.ChildList.describe(
        'Components placed in the title bar after the title, for example small buttons.',
      ).optional(),
      actions: CommonSchemas.ChildList.describe(
        'Components at the right end of the title bar. Keep it to three or fewer.',
      ).optional(),
      children: CommonSchemas.ChildList.describe(
        'The components in the body of the panel, stacked top to bottom.',
      ).optional(),
      collapsible: z
        .boolean()
        .default(false)
        .describe(
          'When true the title bar has a button that folds the body. Requires labels.collapse and labels.expand.',
        )
        .optional(),
      defaultCollapsed: z.boolean().default(false).describe('Start folded. Only with collapsible.').optional(),
      status: z
        .enum(['ready', 'loading', 'empty', 'disconnected'])
        .default('ready')
        .describe(
          "'ready' shows the children; 'loading' a placeholder (needs labels.loading); 'empty' and 'disconnected' an empty state (needs view). No fake data is drawn.",
        )
        .optional(),
      labels: z
        .object({
          collapse: text(
            'Accessible name of the fold button while the body is open. Required when collapsible is true.',
          ).optional(),
          expand: text(
            'Accessible name of the fold button while the body is folded. Required when collapsible is true.',
          ).optional(),
          loading: text('Accessible name of the placeholder. Required when status is loading.').optional(),
        })
        .strict()
        .describe('Screen-reader text, in the language of the user.')
        .optional(),
      view: z
        .object({
          tag: text('A short dot-matrix tag such as NO DATA.').optional(),
          title: text('The title of the empty state.'),
          description: text('A line under the title.').optional(),
        })
        .strict()
        .describe('What to write when status is empty or disconnected. Required for those states.')
        .optional(),
      weight: weightSchema,
    })
    .strict()
    .superRefine((value, ctx) => {
      if (value.collapsible && (!value.labels?.collapse || !value.labels?.expand)) {
        ctx.addIssue({
          code: 'custom',
          path: ['labels'],
          message: 'labels.collapse and labels.expand are required when collapsible is true.',
        })
      }
      if (value.status === 'loading' && !value.labels?.loading) {
        ctx.addIssue({
          code: 'custom',
          path: ['labels'],
          message: 'labels.loading is required when status is loading.',
        })
      }
      if ((value.status === 'empty' || value.status === 'disconnected') && !value.view) {
        ctx.addIssue({
          code: 'custom',
          path: ['view'],
          message: 'view is required when status is empty or disconnected.',
        })
      }
    }),
} satisfies ComponentApi

export const KatanaPanelFrame = createComponentImplementation(KatanaPanelFrameApi, ({ props, buildChild }) => {
  const draw = (list: unknown) =>
    childRefs(list).map((child) => (
      <span key={`${child.basePath ?? ''}/${child.id}`} style={{ display: 'contents' }}>
        {buildChild(child.id, child.basePath)}
      </span>
    ))
  const toolbar = childRefs(props.toolbar)
  const actions = childRefs(props.actions)
  return (
    <Cell weight={props.weight}>
      <PanelFrame defaultCollapsed={props.defaultCollapsed === true}>
        <PanelFrameHeader
          heading={props.heading}
          object={props.object}
          toolbar={toolbar.length > 0 ? <div className="k-a2ui-panel-tools">{draw(props.toolbar)}</div> : undefined}
          actions={actions.length > 0 ? draw(props.actions) : undefined}
          collapsible={props.collapsible === true}
          labels={{ collapse: props.labels?.collapse, expand: props.labels?.expand }}
        />
        <PanelFrameBody
          status={props.status}
          labels={{ loading: props.labels?.loading }}
          view={
            props.view
              ? { tag: props.view.tag, title: props.view.title, description: props.view.description }
              : undefined
          }
        >
          <div className="k-a2ui-stack">{draw(props.children)}</div>
        </PanelFrameBody>
      </PanelFrame>
    </Cell>
  )
})
