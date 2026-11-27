// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TagInput } from '../../src/index'

export function TagInputUsage() {
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT'])
  return (
    <TagInput
      label="Symbols"
      value={symbols}
      onValueChange={setSymbols}
      normalize={(tag) => tag.toUpperCase()}
      placeholder="Type a symbol, Enter to add"
      labels={{ remove: (tag) => `Remove ${tag}`, duplicate: (tag) => `${tag} is already in the list` }}
    />
  )
}
