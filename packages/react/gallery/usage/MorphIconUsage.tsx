// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, MorphIcon } from '../../src/index'

export function MorphIconUsage() {
  const [open, setOpen] = useState(false)
  return (
    <Button size="icon" aria-label="Menu" onClick={() => setOpen((value) => !value)}>
      <MorphIcon variant="menu" active={open} size={15} />
    </Button>
  )
}
