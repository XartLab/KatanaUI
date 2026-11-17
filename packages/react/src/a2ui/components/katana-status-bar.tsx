// SPDX-License-Identifier: MIT
// KatanaStatusBar：一条状态栏（左中右三段，每项是灯、键名与值）。宽度不够时按优先级收进「…」。可点的项只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { StatusBar, type StatusItem } from '../../blocks/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the item. The host gets it back when the item is pressed.'),
    label: z.string().describe('The key name in small caps, for example "QUOTE".').optional(),
    value: z.string().describe('The value, already formatted as text.').optional(),
    led: z
      .enum(['off', 'on', 'ok', 'warn', 'danger'])
      .describe('A status light before the item. Needs ledLabel. Use it only for a real state.')
      .optional(),
    ledLabel: z.string().describe('Accessible name of the light. Required when led is given.').optional(),
    pressable: z.boolean().describe('Make the item a button that dispatches onItem.').optional(),
    title: z.string().describe('Hover text.').optional(),
    priority: z.number().int().describe('Higher stays longer when the bar is too narrow. Defaults to 0.').optional(),
    pinned: z.boolean().describe('Never fold this item into the more menu.').optional(),
    live: z.boolean().describe('Mark a live-trading item with an amber outline; it is never folded.').optional(),
    hidden: z.boolean().describe('Do not show the item.').optional(),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

const segment = (what: string) => z.array(itemSchema).max(24).describe(what).optional()

export const KatanaStatusBarApi = {
  name: 'KatanaStatusBar',
  schema: z
    .object({
      left: segment('Items in the left segment.'),
      center: segment('Items in the center segment.'),
      right: segment('Items in the right segment.'),
      label: CommonSchemas.DynamicString.describe('Accessible name of the bar.'),
      moreLabel: text('Accessible name of the "more" button that holds folded items.'),
      onItem: actionSchema(
        'Dispatched when the user presses an item with pressable set. metadata.extensions.katanaStatus carries {id}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaStatusBar = createComponentImplementation(KatanaStatusBarApi, ({ props }) => {
  const convert = (items: readonly Item[] | undefined): StatusItem[] =>
    (items ?? []).map((item) => ({
      id: item.id,
      ...(item.label === undefined ? {} : { label: item.label }),
      ...(item.value === undefined ? {} : { value: item.value }),
      ...(item.led === undefined ? {} : { led: item.led, ledLabel: item.ledLabel ?? '' }),
      ...(item.title === undefined ? {} : { title: item.title }),
      ...(item.priority === undefined ? {} : { priority: item.priority }),
      ...(item.pinned === undefined ? {} : { pinned: item.pinned }),
      ...(item.live === undefined ? {} : { live: item.live }),
      ...(item.hidden === undefined ? {} : { hidden: item.hidden }),
      ...(item.pressable && props.onItem
        ? { onClick: () => void props.onItem?.(withExtension('katanaStatus', { id: item.id })) }
        : {}),
    }))
  return (
    <Cell weight={props.weight}>
      <StatusBar
        left={convert(props.left)}
        center={convert(props.center)}
        right={convert(props.right)}
        label={props.label ?? ''}
        moreLabel={props.moreLabel}
      />
    </Cell>
  )
})
