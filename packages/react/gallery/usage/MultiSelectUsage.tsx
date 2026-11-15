// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { MultiSelect } from '../../src/index'

export function MultiSelectUsage() {
  const [values, setValues] = useState(['name'])
  return (
    <MultiSelect
      label="Columns"
      values={values}
      onValuesChange={setValues}
      options={[
        ['name', 'Name'],
        ['price', 'Price'],
        ['volume', 'Volume'],
      ]}
      empty="None"
      separator=", "
    />
  )
}
