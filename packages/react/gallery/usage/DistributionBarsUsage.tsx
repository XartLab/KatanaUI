// SPDX-License-Identifier: MIT
import { DistributionBars } from '../../src/quant'

export function DistributionBarsUsage() {
  return (
    <DistributionBars
      label="Change distribution"
      bins={[
        { key: 'a', label: '-5%', count: 320, tone: 'down' },
        { key: 'b', label: '0', count: 90, tone: 'muted' },
        { key: 'c', label: '+5%', count: 540, tone: 'up' },
      ]}
      totals={{ up: 'Up', muted: 'Flat', down: 'Down' }}
    />
  )
}
