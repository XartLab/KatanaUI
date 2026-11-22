// SPDX-License-Identifier: MIT
// KatanaEmptyState：面板的「空」态（标签、标题、说明、动作）。动作位是子组件，一般放 KatanaButton；不画假数据。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { EmptyState } from '../../blocks/index.ts'
import { childRefs } from '../blocks-support.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaEmptyStateApi = {
  name: 'KatanaEmptyState',
  schema: z
    .object({
      title: CommonSchemas.DynamicString.describe('The title, for example "No positions".'),
      tag: CommonSchemas.DynamicString.describe(
        'A small dot-matrix tag above the title, for example NO DATA.',
      ).optional(),
      description: CommonSchemas.DynamicString.describe(
        'A line or two under the title saying why it is empty and what to do.',
      ).optional(),
      actions: CommonSchemas.ChildList.describe('Components under the text, usually KatanaButton.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaEmptyState = createComponentImplementation(KatanaEmptyStateApi, ({ props, buildChild }) => {
  const actions = childRefs(props.actions)
  return (
    <Cell weight={props.weight}>
      <EmptyState
        tag={props.tag}
        title={props.title ?? ''}
        actions={
          actions.length > 0
            ? actions.map((child) => (
                <span key={`${child.basePath ?? ''}/${child.id}`} style={{ display: 'contents' }}>
                  {buildChild(child.id, child.basePath)}
                </span>
              ))
            : undefined
        }
      >
        {props.description}
      </EmptyState>
    </Cell>
  )
})
