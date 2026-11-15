// SPDX-License-Identifier: MIT
import { RatingGauge } from '../../src/index'

const ZONES = ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'] as const

export function RatingGaugeUsage() {
  return <RatingGauge score={0.3} zones={ZONES} label="Technical rating" />
}
