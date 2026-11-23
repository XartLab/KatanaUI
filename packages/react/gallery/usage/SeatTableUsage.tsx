// SPDX-License-Identifier: MIT
import { SeatTable } from '../../src/cn'

export function SeatTableUsage() {
  return (
    <SeatTable
      buy={[
        { name: 'Example branch A', tag: 'Hot money', buy: 126_800_000, sell: 2_300_000 },
        { name: 'Institutional seat', tag: 'Institution', buy: 95_200_000, sell: 0 },
        { name: 'Example branch B', buy: 81_000_000, sell: 30_400_000 },
      ]}
      sell={[
        { name: 'Institutional seat', tag: 'Institution', buy: 0, sell: 108_200_000 },
        { name: 'Example branch C', buy: 3_000_000, sell: 91_000_000 },
        { name: 'Example branch D', buy: 25_000_000, sell: 63_000_000 },
      ]}
      labels={{
        region: 'Dragon-tiger seats',
        buyTitle: 'Top buyers',
        sellTitle: 'Top sellers',
        columns: { seat: 'Seat', buy: 'Bought', sell: 'Sold', net: 'Net' },
        total: 'Total',
        netTotal: 'Net total',
        empty: 'No seats',
        unavailable: 'Not available',
        tableAria: (title) => `${title} seats`,
      }}
    />
  )
}
