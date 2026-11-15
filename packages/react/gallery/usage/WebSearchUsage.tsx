// SPDX-License-Identifier: MIT
import { WebSearch, type WebSource } from '../../src/index'

const SOURCES: readonly WebSource[] = [
  { id: 'a', site: 'Reuters', title: 'Central bank cuts reserve ratio', snippet: 'About 1 trillion yuan released.' },
  { id: 'b', site: 'Bloomberg', title: 'Tech leads the rally' },
]

export function WebSearchUsage() {
  return (
    <WebSearch
      sources={SOURCES}
      status="done"
      label="Searched 2 sites"
      moreLabel={(count) => `${count} more`}
      lessLabel="Collapse"
    />
  )
}
