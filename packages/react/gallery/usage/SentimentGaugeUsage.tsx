// SPDX-License-Identifier: MIT
import { SentimentGauge } from '../../src/cn'

export function SentimentGaugeUsage() {
  return (
    <SentimentGauge
      score={62}
      basis="Rule-based score, not calibrated on history"
      today={{ limitUp: 30, limitDown: 62, sealRate: 62.5, broken: 10 }}
      yesterday={{ limitUp: 23, limitDown: 68, sealRate: 48, broken: 24 }}
      labels={{
        region: 'Sentiment',
        levels: ['Frozen', 'Weak', 'Neutral', 'Warm', 'Hot'],
        rows: { limitUp: 'Limit-up', limitDown: 'Limit-down', sealRate: 'Seal rate', broken: 'Opened' },
        today: 'Today',
        yesterday: 'Yesterday',
        scoreCaption: 'Score',
        unavailable: 'Not available',
        scoreAria: (score, level) => `Sentiment ${score}, ${level}`,
      }}
    />
  )
}
