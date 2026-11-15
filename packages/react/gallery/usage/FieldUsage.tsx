// SPDX-License-Identifier: MIT
import { Field, FieldDescription, FieldError, FieldLabel, Input, useFieldControl } from '../../src/index'

function StopInput() {
  const control = useFieldControl()
  return <Input defaultValue="abc" {...control} />
}

export function FieldUsage() {
  return (
    <Field invalid>
      <FieldLabel>Stop distance</FieldLabel>
      <StopInput />
      <FieldDescription>In price ticks.</FieldDescription>
      <FieldError>Enter a number.</FieldError>
    </Field>
  )
}
