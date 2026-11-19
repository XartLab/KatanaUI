// SPDX-License-Identifier: MIT
// KatanaCommand：可搜索的命令列表（行内，不是弹层）。命令由智能体列出，选中只发 Action（带命令 id）交给宿主；组件自己什么都不执行，所以能登记。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '../../index.ts'
import { Cell, actionSchema, parseList, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the command. The host gets it back in the action.'),
    label: z.string().describe('The command text.'),
    group: z.string().describe('A group heading; commands with the same heading are listed together.').optional(),
    hint: z.string().describe('Small text on the right, for example a shortcut such as "Ctrl K".').optional(),
    keywords: z.array(z.string()).describe('Extra words the search also matches.').optional(),
    disabled: z.boolean().describe('When true the command cannot be chosen.').optional(),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

export const KatanaCommandApi = {
  name: 'KatanaCommand',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('Accessible name of the search box and the list.'),
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe('The commands. Either a literal array or {"@path": "/commands"} bound to a data-model array.'),
      placeholder: CommonSchemas.DynamicString.describe('Hint text in the search box.'),
      emptyText: CommonSchemas.DynamicString.describe('Text shown when the search matches no command.'),
      onSelect: actionSchema(
        'Dispatched when the user chooses a command. The command is in metadata.extensions.katanaCommand.id. Choosing never runs anything by itself: the host decides what the id means, and asks the user to confirm anything that trades.',
      ),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

/** 按出现的先后分组：没有分组名的排在最前。 */
function grouped(items: readonly Item[]): [string | undefined, Item[]][] {
  const groups = new Map<string | undefined, Item[]>()
  for (const item of items) groups.set(item.group, [...(groups.get(item.group) ?? []), item])
  const plain = groups.get(undefined)
  return [
    ...(plain ? ([[undefined, plain]] as [string | undefined, Item[]][]) : []),
    ...[...groups].filter(([name]) => name !== undefined),
  ]
}

export const KatanaCommand = createComponentImplementation(KatanaCommandApi, ({ props }) => {
  const items = useMemo(() => parseList<Item>(itemSchema, props.items), [props.items])
  return (
    <Cell weight={props.weight}>
      <div className="overflow-hidden rounded-[var(--radius-overlay)] border border-line bg-surface-2">
        <Command label={props.label ?? ''}>
          <CommandInput placeholder={props.placeholder} />
          <CommandList>
            <CommandEmpty>{props.emptyText}</CommandEmpty>
            {grouped(items).map(([group, rows]) => (
              <CommandGroup key={group ?? ''} heading={group}>
                {rows.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    keywords={[item.label, ...(item.keywords ?? [])]}
                    disabled={item.disabled}
                    onSelect={() =>
                      void props.onSelect?.({ metadata: { extensions: { katanaCommand: { id: item.id } } } })
                    }
                  >
                    <span>{item.label}</span>
                    {item.hint ? <CommandShortcut>{item.hint}</CommandShortcut> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
    </Cell>
  )
})
