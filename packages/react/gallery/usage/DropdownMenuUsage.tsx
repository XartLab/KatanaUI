// SPDX-License-Identifier: MIT
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../src/index'

export function DropdownMenuUsage() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Add widget</DropdownMenuItem>
        <DropdownMenuItem variant="danger">Delete board</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
