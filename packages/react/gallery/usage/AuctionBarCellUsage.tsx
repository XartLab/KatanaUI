// SPDX-License-Identifier: MIT
import { AuctionBarCell } from '../../src/cn'

export function AuctionBarCellUsage() {
  return (
    <div style={{ width: 200 }}>
      <AuctionBarCell amount={312_000_000} previous={96_000_000} limitBid={185_000_000} max={320_000_000} />
    </div>
  )
}
