// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TagCombobox } from '../../src/index'

const OPTIONS = [
  { id: 'aisha', label: 'Aisha Khan', description: 'Design lead' },
  { id: 'ben', label: 'Ben Carter', description: 'Engineer' },
  { id: 'elena', label: 'Elena Petrova', description: 'Product manager' },
  { id: 'hiro', label: 'Hiro Tanaka', description: 'Researcher' },
]

export function TagComboboxUsage() {
  const [reviewers, setReviewers] = useState(['aisha'])
  return (
    <div style={{ width: 320 }}>
      <TagCombobox
        label="Reviewers"
        options={OPTIONS}
        value={reviewers}
        onValueChange={setReviewers}
        placeholder="Add people"
        labels={{ remove: (name) => `Remove ${name}`, empty: 'No match', toggle: 'Show options' }}
      />
    </div>
  )
}
