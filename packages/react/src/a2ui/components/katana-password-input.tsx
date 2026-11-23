// SPDX-License-Identifier: MIT
// KatanaPasswordInput：密钥输入，只收不回显。框是非受控的：数据模型里已有的值不会被画出来，所以智能体预填不了、也读不到屏幕上的字；
// 用户打的字写进数据模型（要不要发回智能体由宿主决定）。宿主把绑定的值清成空串时，框跟着清空。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { Field, FieldError, FieldLabel, PasswordInput, useFieldControl } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaPasswordInputApi = {
  name: 'KatanaPasswordInput',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the input.'),
      value: CommonSchemas.DataBinding.describe(
        'Where the typed secret is written: only a binding such as {"@path": "/form/secret"} is accepted, never a literal. This is write-only: the component never shows a value already in the data model, so you cannot prefill it, and it only writes what the user types. Setting the bound path to an empty string clears the box. Whether the data model is sent back to you is up to the host; do not ask the user to type a secret unless the host keeps it out of your context.',
      ),
      labels: z
        .object({
          toggle: z.string().describe('Accessible name of the show/hide eye button. It does not change with state.'),
        })
        .strict()
        .describe(
          'All the texts, all required: the component carries no wording of its own. Write them in the language of the user.',
        ),
      placeholder: CommonSchemas.DynamicString.describe('Hint text shown while the box is empty.').optional(),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the box cannot be edited.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

function Control({
  epoch,
  labels,
  placeholder,
  disabled,
  onText,
}: {
  epoch: number
  labels: { toggle: string }
  placeholder?: string
  disabled: boolean
  onText: (text: string) => void
}) {
  const field = useFieldControl()
  // epoch 变了就换一个新的框，等于清空；框本身不受控，值从不从数据模型回到屏幕。
  return (
    <PasswordInput
      key={epoch}
      {...field}
      labels={labels}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onText(event.target.value)}
    />
  )
}

export const KatanaPasswordInput = createComponentImplementation(KatanaPasswordInputApi, ({ props }) => {
  const errors = props.validationErrors ?? []
  const written = useRef('')
  const [epoch, setEpoch] = useState(0)
  const cleared = props.value === ''
  useEffect(() => {
    if (cleared && written.current !== '') {
      written.current = ''
      setEpoch((count) => count + 1)
    }
  }, [cleared])
  return (
    <Cell weight={props.weight}>
      <Field invalid={errors.length > 0}>
        <FieldLabel>{props.label}</FieldLabel>
        <Control
          epoch={epoch}
          labels={props.labels}
          placeholder={props.placeholder}
          disabled={props.disabled === true}
          onText={(text) => {
            written.current = text
            props.setValue?.(text)
          }}
        />
        {errors.length > 0 ? <FieldError>{errors.join(' ')}</FieldError> : null}
      </Field>
    </Cell>
  )
})
