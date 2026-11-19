// SPDX-License-Identifier: MIT
import { AiSuggestions } from '../../src/index'

export function AiSuggestionsUsage() {
  return (
    <AiSuggestions
      label="可以接着问"
      suggestions={[
        { id: 'a', label: '同板块还有哪些在跌' },
        { id: 'b', label: '把止损收紧会怎样' },
      ]}
      onSelect={() => undefined}
    />
  )
}
