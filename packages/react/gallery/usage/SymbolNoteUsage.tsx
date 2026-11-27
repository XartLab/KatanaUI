// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolNote } from '../../src/quotes'

const LABELS = { note: 'Note', add: 'Add note', edit: 'Edit', save: 'Save', cancel: 'Cancel' }

export function SymbolNoteUsage() {
  // The caller stores the note; the component only hands back what the user saved.
  const [note, setNote] = useState('Earnings on 11-28 after the close.')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <b>AAPL</b>
      <SymbolNote value={note} onValueChange={setNote} title="AAPL" labels={LABELS} />
    </span>
  )
}
