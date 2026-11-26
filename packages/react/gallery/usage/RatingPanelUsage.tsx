// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RatingPanel, type RatingPanelLabels } from '../../src/quotes'

const LABELS: RatingPanelLabels = {
  zones: ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'],
  verdict: { sell: 'Sell', neutral: 'Neutral', buy: 'Buy' },
  panel: 'Technical rating',
  timeframe: 'Timeframe',
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'].map((value) => ({ value, label: value }))

// Demo counts, not market data.
const GAUGES = [
  { key: 'oscillators', label: 'Oscillators', score: 0.45, counts: { sell: 1, neutral: 4, buy: 6 } },
  { key: 'summary', label: 'Summary', score: 0.65, counts: { sell: 2, neutral: 5, buy: 19 } },
  { key: 'ma', label: 'Moving averages', score: 0.8, counts: { sell: 1, neutral: 1, buy: 13 } },
]

export function RatingPanelUsage() {
  const [timeframe, setTimeframe] = useState('1D')
  return (
    <RatingPanel
      gauges={GAUGES}
      labels={LABELS}
      timeframes={TIMEFRAMES}
      value={timeframe}
      onValueChange={setTimeframe}
    />
  )
}
