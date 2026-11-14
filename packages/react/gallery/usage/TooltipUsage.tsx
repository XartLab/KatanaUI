// SPDX-License-Identifier: MIT
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../src/index'

export function TooltipUsage() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Fill ratio = filled / touched</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
