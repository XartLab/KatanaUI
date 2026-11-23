// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Pill } from '../../src/index'

export function PillUsage() {
  const [filters, setFilters] = useState(['P/E < 20', 'Market cap > 10B'])
  const [editing, setEditing] = useState('')
  return (
    <>
      {filters.map((filter) => (
        <Pill
          key={filter}
          onClick={() => setEditing(filter)}
          onDismiss={() => setFilters((list) => list.filter((item) => item !== filter))}
          dismissLabel={`Remove ${filter}`}
        >
          {filter}
        </Pill>
      ))}
      <output>{editing}</output>
    </>
  )
}
