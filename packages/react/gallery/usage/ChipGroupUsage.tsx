// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ChipGroup, type ChipItem } from '../../src/index'

const CHIP_ITEMS: readonly ChipItem[] = [
  { value: 'cn', label: 'A 股', count: 38 },
  { value: 'hk', label: '港股', count: 12 },
  { value: 'us', label: '美股', count: 9 },
  { value: 'fut', label: '期货', count: 0, disabled: true },
  { value: 'crypto', label: '加密', count: 21 },
]

export function ChipGroupUsage() {
  const [markets, setMarkets] = useState<string[]>(['cn', 'crypto'])
  const [one, setOne] = useState<string[]>(['hk'])
  return (
    <>
      <ChipGroup
        label="市场"
        items={CHIP_ITEMS}
        value={markets}
        onValueChange={setMarkets}
        labels={{ clear: '清除筛选' }}
      />
      <output data-gallery-chips>{markets.join(',') || '无'}</output>

      <ChipGroup
        label="市场（单选）"
        selection="single"
        items={CHIP_ITEMS.slice(0, 3)}
        value={one}
        onValueChange={setOne}
      />
      <output data-gallery-chips-one>{one.join(',') || '无'}</output>
    </>
  )
}
