// SPDX-License-Identifier: MIT
import { PinnedList } from '../../src/index'

export function PinnedListUsage() {
  return (
    <PinnedList
      items={[
        { id: 'btc', title: 'BTCUSDT', meta: '106,977.4' },
        { id: 'eth', title: 'ETHUSDT', meta: '3,814.2' },
      ]}
      labels={{
        list: 'Watchlist',
        pin: (title) => `Pin ${title}`,
        unpin: (title) => `Unpin ${title}`,
        emptyPinned: 'Pin a row to keep it on top',
      }}
    />
  )
}
