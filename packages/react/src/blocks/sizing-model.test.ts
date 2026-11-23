// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vite-plus/test'
import {
  breakevenPrice,
  computeSizing,
  contractsForCost,
  contractsForRisk,
  exitPnl,
  floorToStep,
  liquidationPrice,
  type SizingInput,
} from './sizing-model.ts'

// BTCUSDT 永续的规格：一张 0.01 BTC，最小 0.01 张（OKX 交易页上写的「单张委托价值 0.01 BTC」，2026-11-19 看）。
const spec = { contractValue: 0.01, lotSize: 0.01, minSize: 0.01 }
const fees = { open: 0.0005, close: 0.0005 }
const base: SizingInput = { side: 'buy', price: 60000, leverage: 100, fees, spec, mode: 'cost', amount: 10 }

describe('floorToStep', () => {
  test('floors, never rounds up, and survives float noise', () => {
    expect(floorToStep(1.519, 0.01)).toBe(1.51)
    expect(floorToStep(0.3, 0.1)).toBe(0.3)
    expect(floorToStep(0.009, 0.01)).toBe(0)
    expect(floorToStep(250, 100)).toBe(200)
  })
})

describe('cost mode', () => {
  test('10 U at 100x with both fees: notional is 10 / (1/100 + 0.001), floored to the lot', () => {
    // 10 / 0.011 = 909.09 USDT，一张 600 USDT → 1.5151 张 → 1.51 张
    expect(contractsForCost(10, 60000, 100, fees, spec)).toBe(1.51)
    const r = computeSizing(base)
    expect(r.contracts).toBe(1.51)
    expect(r.notional).toBeCloseTo(906, 6)
    expect(r.margin).toBeCloseTo(9.06, 6)
    expect(r.openFee).toBeCloseTo(0.453, 6)
    expect(r.closeFee).toBeCloseTo(0.453, 6)
    expect(r.cost).toBeCloseTo(9.966, 6)
    expect(r.cost).toBeLessThanOrEqual(10)
    expect(r.issue).toBeUndefined()
  })

  test('opening fee only: 10 / (1/100 + 0.0005) buys more', () => {
    // 10 / 0.0105 = 952.38 → 1.5873 张 → 1.58 张
    const r = computeSizing({ ...base, includeCloseFee: false })
    expect(r.contracts).toBe(1.58)
    expect(r.cost).toBeCloseTo(9.48 + 0.474, 6)
  })

  test('changing leverage keeps the cost and changes the size', () => {
    const low = computeSizing({ ...base, leverage: 10 })
    // 10 / (0.1 + 0.001) = 99.0099 → 0.165 张 → 0.16 张
    expect(low.contracts).toBe(0.16)
    expect(low.cost).toBeLessThanOrEqual(10)
    expect(computeSizing(base).contracts).toBeGreaterThan(low.contracts)
  })

  test('spot: leverage 1 is buying by amount', () => {
    const r = computeSizing({
      ...base,
      leverage: 1,
      spec: { contractValue: 1, lotSize: 100 },
      price: 12.5,
      amount: 10000,
      fees: { open: 0.0003, close: 0.0003 },
    })
    // 10000 / 1.0006 / 12.5 = 799.5 股 → 700 股（一手 100）
    expect(r.contracts).toBe(700)
    expect(r.margin).toBeCloseTo(8750, 6)
  })

  test('too little money for one lot', () => {
    expect(computeSizing({ ...base, amount: 0.05 }).issue).toBe('below-min')
  })

  test('more than is available', () => {
    expect(computeSizing({ ...base, available: 5 }).issue).toBe('exceeds-available')
    expect(computeSizing({ ...base, available: 10 }).issue).toBeUndefined()
  })
})

describe('risk mode', () => {
  test('size is risk over the loss per contract at the stop, fees included', () => {
    // 每张：价差 (60000−59400)×0.01 = 6，开仓费 0.3，平仓费 0.297 → 6.597；50 / 6.597 = 7.579 → 7.57 张
    expect(contractsForRisk(50, 'buy', 60000, 59400, fees, spec)).toBe(7.57)
    const r = computeSizing({ ...base, mode: 'risk', amount: 50, stopLoss: 59400 })
    expect(r.contracts).toBe(7.57)
    expect(r.stopLoss?.pnl).toBeCloseTo(-7.57 * 6.597, 6)
    expect(-(r.stopLoss?.pnl ?? 0)).toBeLessThanOrEqual(50)
  })

  test('needs a stop on the losing side', () => {
    expect(computeSizing({ ...base, mode: 'risk', amount: 50 }).issue).toBe('no-stop')
    expect(computeSizing({ ...base, mode: 'risk', amount: 50, stopLoss: 61000 }).issue).toBe('stop-wrong-side')
    expect(computeSizing({ ...base, side: 'sell', mode: 'risk', amount: 50, stopLoss: 61000 }).issue).toBeUndefined()
  })
})

describe('exits', () => {
  test('breakeven covers both fees', () => {
    const long = breakevenPrice('buy', 60000, fees)
    expect(long).toBeCloseTo((60000 * 1.0005) / 0.9995, 9)
    expect(exitPnl('buy', 60000, long, 1, spec, fees)).toBeCloseTo(0, 9)
    const short = breakevenPrice('sell', 60000, fees)
    expect(exitPnl('sell', 60000, short, 1, spec, fees)).toBeCloseTo(0, 9)
  })

  test('take-profit, stop-loss and reward to risk', () => {
    const r = computeSizing({ ...base, mode: 'quantity', amount: 1, takeProfit: 61200, stopLoss: 59400 })
    // 1 张 = 0.01 BTC：止盈 12 − 0.3 − 0.306 = 11.394；止损 −6 − 0.3 − 0.297 = −6.597
    expect(r.takeProfit?.pnl).toBeCloseTo(11.394, 6)
    expect(r.stopLoss?.pnl).toBeCloseTo(-6.597, 6)
    expect(r.rewardRisk).toBeCloseTo(11.394 / 6.597, 6)
  })

  test('liquidation estimate sits on the losing side and is absent without a maintenance rate', () => {
    // 多头 60000 × 0.99 / (1 − 0.004 − 0.0005) = 59668.5
    expect(liquidationPrice('buy', 60000, 100, 0.004, 0.0005)).toBeCloseTo(59668.508, 2)
    // 空头 60000 × 1.01 / 1.0045 = 60328.5
    expect(liquidationPrice('sell', 60000, 100, 0.004, 0.0005)).toBeCloseTo(60328.522, 2)
    expect(liquidationPrice('buy', 60000, 1, 0.004, 0.0005)).toBeUndefined()
    expect(computeSizing(base).liquidationPrice).toBeUndefined()
    expect(computeSizing({ ...base, maintenanceMarginRate: 0.004 }).liquidationPrice).toBeCloseTo(59668.508, 2)
  })
})

describe('existing position', () => {
  test('adding averages the entry', () => {
    const r = computeSizing({
      ...base,
      mode: 'quantity',
      amount: 1,
      position: { side: 'buy', size: 3, entryPrice: 58000 },
    })
    expect(r.after).toEqual({ side: 'buy', size: 4, entryPrice: 58500 })
  })

  test('an opposite order reduces first, then flips', () => {
    const held = { side: 'buy' as const, size: 3, entryPrice: 58000 }
    const reduce = computeSizing({ ...base, side: 'sell', mode: 'quantity', amount: 1, position: held })
    expect(reduce.after).toEqual({ side: 'buy', size: 2, entryPrice: 58000 })
    const flip = computeSizing({ ...base, side: 'sell', mode: 'quantity', amount: 5, position: held })
    expect(flip.after).toEqual({ side: 'sell', size: 2, entryPrice: 60000 })
  })
})
