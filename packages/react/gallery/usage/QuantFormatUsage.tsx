// SPDX-License-Identifier: MIT
import { formatCompact, formatPercentChange, formatPrice } from '../../src/lib/chart/format'

export function QuantFormatUsage() {
  return (
    <p>
      {formatPrice(1688, { tick: 0.01 })} {formatPercentChange(1.234)} {formatCompact(1_250_000)}
    </p>
  )
}
