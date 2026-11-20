// SPDX-License-Identifier: MIT
import { MarketPulse } from '../../src/cn'

export function MarketPulseUsage() {
  return (
    <MarketPulse
      counts={{ rising: 302, falling: 5239, limitUp: 30, limitDown: 62, flat: 31 }}
      readings={{ nonStLimitUp: 28, highestBoard: 4, turnover: { value: null, reason: 'Not provided yet' } }}
    />
  )
}
