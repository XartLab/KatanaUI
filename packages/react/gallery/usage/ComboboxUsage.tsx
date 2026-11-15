// SPDX-License-Identifier: MIT
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '../../src/index'
import { useState } from 'react'

export function ComboboxUsage() {
  const [value, setValue] = useState('1h')
  const [open, setOpen] = useState(false)
  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <ComboboxTrigger aria-label="Timeframe">
        <span>{value}</span>
      </ComboboxTrigger>
      <ComboboxContent label="Search timeframes">
        <ComboboxInput placeholder="Search" />
        <ComboboxList>
          <ComboboxEmpty>No match</ComboboxEmpty>
          {['1m', '5m', '1h', '1d'].map((frame) => (
            <ComboboxItem
              key={frame}
              value={frame}
              selected={frame === value}
              onSelect={() => {
                setValue(frame)
                setOpen(false)
              }}
            >
              {frame}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
