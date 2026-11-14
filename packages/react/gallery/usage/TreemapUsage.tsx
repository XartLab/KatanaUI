// SPDX-License-Identifier: MIT
import { Treemap, layoutTreemap, type TreemapItem } from '../../src/index'

type Tile = { name: string; change: number }
const ITEMS: readonly TreemapItem<Tile>[] = [
  { group: 'Sector 1', size: 600, data: { name: 'A', change: 0.031 } },
  { group: 'Sector 1', size: 300, data: { name: 'B', change: -0.012 } },
  { group: 'Sector 2', size: 220, data: { name: 'C', change: 0 } },
]

export function TreemapUsage() {
  return (
    <Treemap
      blocks={layoutTreemap(ITEMS, true)}
      heads
      describe={(item) => ({ name: item.name, text: `${(item.change * 100).toFixed(2)}%`, change: item.change })}
      legendText={(step) => `${step}%`}
    />
  )
}
