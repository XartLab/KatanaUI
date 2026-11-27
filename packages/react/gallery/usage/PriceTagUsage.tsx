// SPDX-License-Identifier: MIT
import { formatPrice } from '../../src/quant'
import { PriceTag } from '../../src/quotes'

export function PriceTagUsage() {
  return (
    <PriceTag
      name="BTCUSDT"
      last={106977.4}
      changePct={1.2}
      formatPrice={(value) => formatPrice(value, { tick: 0.1 })}
    />
  )
}
