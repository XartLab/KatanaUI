// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { InlineEdit } from '../../src/index'

export function InlineEditUsage() {
  const [name, setName] = useState('Core holdings')
  return (
    <InlineEdit
      as="h3"
      value={name}
      label="Watchlist name"
      validate={(next) => (next ? null : 'A name is required')}
      onSave={(next) => setName(next)}
      labels={{
        editHint: 'Activate to edit',
        save: 'Save name',
        cancel: 'Cancel editing',
        failed: (text) => `Could not save “${text}”, the last saved name is back.`,
        retry: 'Try again',
      }}
    />
  )
}
