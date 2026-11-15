// SPDX-License-Identifier: MIT
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '../../src/index'

export function CommandUsage() {
  return (
    <Command label="Commands">
      <CommandInput placeholder="Search commands" />
      <CommandList aria-label="Commands">
        <CommandEmpty>No matching command</CommandEmpty>
        <CommandItem value="trend-line">Trend line</CommandItem>
        <CommandItem value="fib">Fibonacci retracement</CommandItem>
      </CommandList>
    </Command>
  )
}
