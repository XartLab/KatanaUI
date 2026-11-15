// SPDX-License-Identifier: MIT
import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../src/index'

export function SheetUsage() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open drawer</Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel="Close">
        <SheetHeader>
          <SheetTitle>Symbol details</SheetTitle>
          <SheetDescription>Details of the selected symbol.</SheetDescription>
        </SheetHeader>
        <SheetBody>Body</SheetBody>
      </SheetContent>
    </Sheet>
  )
}
