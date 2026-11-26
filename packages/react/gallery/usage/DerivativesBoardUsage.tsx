// SPDX-License-Identifier: MIT
import { DerivativesBoard, type DerivativesData } from '../../src/blocks'
import { derivativesLabelsZh } from './derivatives-labels-zh.ts'

// 演示数据：编出来的（闭式公式，不是行情）；整点一根，从 2026-11-24 00:00 UTC 起。
const HOUR = 3600 * 1000
const START = Date.UTC(2026, 10, 24)
const hours = (count: number) => Array.from({ length: count }, (_, i) => ({ i, time: START + i * HOUR }))

export const DERIVATIVES_DEMO: DerivativesData = {
  openInterestVolume: hours(24).map(({ i, time }) => ({
    time,
    openInterest: Math.round(52000 + 1800 * Math.sin(i / 3.1) + i * 40),
    volume: Math.round(900 + 700 * Math.abs(Math.sin(i * 0.9)) + 120 * Math.cos(i / 2)),
  })),
  fundingRate: Array.from({ length: 21 }, (_, i) => ({
    time: START + i * 8 * HOUR,
    rate: +(0.012 * Math.sin(i / 2.2) + 0.004 * Math.cos(i * 1.3) - 0.001).toFixed(4),
  })),
  takerVolume: hours(24).map(({ i, time }) => ({
    time,
    buy: Math.round(420 + 260 * (1 + Math.sin(i / 2))),
    sell: Math.round(380 + 240 * (1 + Math.cos(i / 2.4))),
  })),
  longShortRatio: hours(24).map(({ i, time }) => ({
    time,
    long: Math.round(5200 + 900 * Math.sin(i / 4)),
    short: Math.round(4300 + 700 * Math.cos(i / 3)),
  })),
  topTraderRatio: hours(24).map(({ i, time }) => ({
    time,
    long: Math.round(3100 + 500 * Math.sin(i / 5 + 1)),
    short: Math.round(2400 + 400 * Math.cos(i / 4)),
  })),
  basis: hours(24).map(({ i, time }) => {
    const index = 67000 + 400 * Math.sin(i / 5)
    return {
      time,
      index: Math.round(index * 10) / 10,
      contract: Math.round((index + 25 * Math.sin(i / 2.5) - 4) * 10) / 10,
    }
  }),
}

export function DerivativesBoardUsage() {
  return <DerivativesBoard data={DERIVATIVES_DEMO} labels={derivativesLabelsZh} />
}
