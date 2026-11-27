// SPDX-License-Identifier: MIT
import { RatingText } from '../../src/quotes'

export function RatingTextUsage() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <RatingText level="strong-buy">强力买入</RatingText>
      <RatingText level="neutral">中性</RatingText>
      <RatingText level="strong-sell">强力卖出</RatingText>
    </div>
  )
}
