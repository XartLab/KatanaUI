// SPDX-License-Identifier: MIT
import { ExpandableCards } from '../../src/index'

export function ExpandableCardsUsage() {
  return (
    <ExpandableCards
      label="Strategy versions"
      cards={[
        { id: 'v1', title: 'v1', face: 'Sharpe 1.1', detail: 'First version: fixed 20-day lookback.' },
        { id: 'v2', title: 'v2', face: 'Sharpe 1.4', detail: 'Added a volatility filter.' },
      ]}
    />
  )
}
