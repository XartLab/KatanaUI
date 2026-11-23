// SPDX-License-Identifier: MIT
import { MiniKCardGrid } from '../../src/cn'

const rise = (start: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const open = start + i * 0.3
    return { open, high: open + 0.5, low: open - 0.2, close: open + (i % 3 === 2 ? -0.1 : 0.35) }
  })

export function MiniKCardGridUsage() {
  return (
    <MiniKCardGrid
      columns={3}
      items={[
        { code: '600101', name: 'Example A', candles: rise(12) },
        { code: '600102', name: 'Example B', candles: rise(20).reverse() },
        { code: '000103', name: 'Example C', candles: rise(8) },
      ]}
      onSelect={() => {}}
      labels={{
        region: 'Picked stocks',
        card: (name, code, change) => `${name} ${code}, ${change}`,
        chart: (count) => `Last ${count} candles`,
        noCandles: 'No candles',
        empty: 'Nothing picked',
        unavailable: 'Not available',
      }}
    />
  )
}
