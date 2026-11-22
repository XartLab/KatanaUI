// SPDX-License-Identifier: MIT
// KatanaAccordion：折叠面板。每一项是一个标题加一个子组件；打开哪几项由用户点，件自己记。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaAccordionApi = {
  name: 'KatanaAccordion',
  schema: z
    .object({
      items: z
        .array(
          z
            .object({
              id: z.string().min(1).describe('Stable id of the item, unique inside this accordion.'),
              title: CommonSchemas.DynamicString.describe('The text of the header row.'),
              child: CommonSchemas.ComponentId.describe('The component shown when the item is open.'),
              open: z.boolean().describe('Start open. Defaults to closed.').optional(),
            })
            .strict(),
        )
        .min(1)
        .describe('The items, top to bottom.'),
      multiple: z
        .boolean()
        .default(false)
        .describe('When true several items can be open at once; otherwise opening one closes the others.')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaAccordion = createComponentImplementation(KatanaAccordionApi, ({ props, buildChild }) => {
  const items = (props.items ?? []) as {
    id: string
    title?: string
    child: string | { id: string; basePath?: string }
    open?: boolean
  }[]
  const opened = items.filter((item) => item.open === true).map((item) => item.id)
  const body = items.map((item) => {
    const child = typeof item.child === 'string' ? { id: item.child } : item.child
    return (
      <AccordionItem key={item.id} value={item.id}>
        <AccordionTrigger>{item.title ?? ''}</AccordionTrigger>
        <AccordionContent>{buildChild(child.id, 'basePath' in child ? child.basePath : undefined)}</AccordionContent>
      </AccordionItem>
    )
  })
  return (
    <Cell weight={props.weight}>
      {props.multiple === true ? (
        <Accordion type="multiple" defaultValue={opened}>
          {body}
        </Accordion>
      ) : (
        <Accordion type="single" collapsible defaultValue={opened[0]}>
          {body}
        </Accordion>
      )}
    </Cell>
  )
})
