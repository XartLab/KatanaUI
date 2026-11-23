// SPDX-License-Identifier: MIT
import { AuctionStep } from '../../src/cn'

export function AuctionStepUsage() {
  return (
    <AuctionStep
      prevClose={10}
      points={[
        { time: '09:15', price: 10, volume: 120 },
        { time: '09:17:40', price: 10.15, volume: 2100 },
        { time: '09:20', price: 10.22, volume: 5200 },
        { time: '09:22:30', price: 10.36, volume: 9100 },
        { time: '09:25', price: 10.45, volume: 12_600 },
      ]}
      labels={{
        region: 'Opening auction',
        axis: { from: '09:15', cancelCutoff: 'No cancel from 09:20', to: '09:25' },
        price: 'Matched',
        volume: 'Volume',
        prevClose: 'Prev close',
        empty: 'No auction data',
        unavailable: 'Not available',
        aria: (last) => `Opening auction steps, last matched price ${last}`,
      }}
    />
  )
}
