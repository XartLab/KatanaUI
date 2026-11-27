// SPDX-License-Identifier: MIT
// KatanaCombobox：可搜索的单选下拉。选项由智能体给（文字、值、搜索用的别名），选中的值双向绑定回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useState } from 'react'
import { z } from 'zod'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  Field,
  FieldError,
  FieldLabel,
  useFieldControl,
} from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaComboboxApi = {
  name: 'KatanaCombobox',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe(
        'The field label shown above the trigger. Also the accessible name of the search box.',
      ),
      options: z
        .array(
          z
            .object({
              label: z.string().describe('The text shown for this option.'),
              value: z
                .string()
                .min(1)
                .describe('The stable value written to the data model when this option is chosen.'),
              keywords: z
                .array(z.string())
                .describe('Extra words the search also matches, for example a ticker code.')
                .optional(),
            })
            .strict(),
        )
        .min(1)
        .describe('The choices, in display order.'),
      value: CommonSchemas.DynamicString.describe(
        'The value of the chosen option. Bind it to the data model with {"@path": "/form/x"} so the choice is written back.',
      ),
      placeholder: CommonSchemas.DynamicString.describe('Text on the trigger while nothing is chosen.'),
      searchPlaceholder: CommonSchemas.DynamicString.describe('Hint text in the search box.'),
      emptyText: CommonSchemas.DynamicString.describe('Text shown when the search matches no option.'),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the combobox cannot be opened.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

function Trigger({ text, disabled }: { text: string; disabled: boolean }) {
  const field = useFieldControl()
  return (
    <ComboboxTrigger {...field} disabled={disabled}>
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{text}</span>
    </ComboboxTrigger>
  )
}

export const KatanaCombobox = createComponentImplementation(KatanaComboboxApi, ({ props }) => {
  const [open, setOpen] = useState(false)
  const errors = props.validationErrors ?? []
  const chosen = props.options.find((option) => option.value === props.value)
  return (
    <Cell weight={props.weight}>
      <Field invalid={errors.length > 0}>
        <FieldLabel>{props.label}</FieldLabel>
        <Combobox open={open} onOpenChange={setOpen}>
          <Trigger text={chosen?.label ?? props.placeholder ?? ''} disabled={props.disabled === true} />
          <ComboboxContent label={props.label ?? ''}>
            <ComboboxInput placeholder={props.searchPlaceholder} />
            <ComboboxList>
              <ComboboxEmpty>{props.emptyText}</ComboboxEmpty>
              {props.options.map((option) => (
                <ComboboxItem
                  key={option.value}
                  value={option.label}
                  keywords={option.keywords}
                  selected={option.value === props.value}
                  onSelect={() => {
                    props.setValue?.(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {errors.length > 0 ? <FieldError>{errors.join(' ')}</FieldError> : null}
      </Field>
    </Cell>
  )
})
