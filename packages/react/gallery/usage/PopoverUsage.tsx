// SPDX-License-Identifier: MIT
import { Button, Popover, PopoverContent, PopoverTrigger } from '../../src/index'

export function PopoverUsage() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Details</Button>
      </PopoverTrigger>
      <PopoverContent>The default trading day is the latest one.</PopoverContent>
    </Popover>
  )
}
