// SPDX-License-Identifier: MIT
import { QuoteCard, type QuoteRow } from '../../src/quotes'

const ROW: QuoteRow = { id: 'a', symbol: 'AAA', name: 'Alpha', last: 11.8, change: 1.8, changePct: 18 }

export function QuoteCardUsage() {
  return <QuoteCard {...ROW} />
}
