// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { OptionsChain, type OptionExpiry, type OptionRow, type OptionsChainLabels } from '../../src/blocks'

// 演示数据：标的价与期权报价都是编出来的（闭式公式，不是定价模型的输出）；越远期时间价值越大。
export const UNDERLYING = 64250
export const EXPIRIES: readonly OptionExpiry[] = [
  { id: '1129', label: '11-29', note: '7 天' },
  { id: '1227', label: '12-27', note: '35 天' },
  { id: '0327', label: '03-27', note: '125 天' },
]
const TIME_VALUE: Record<string, number> = { '1129': 900, '1227': 1700, '0327': 3000 }

export function chainFor(expiry: string): OptionRow[] {
  const time = TIME_VALUE[expiry] ?? 900
  return Array.from({ length: 9 }, (_, i) => {
    const strike = 60000 + i * 1000
    const away = Math.abs(UNDERLYING - strike)
    const value = time * Math.exp(-away / 3500)
    const callMid = Math.max(UNDERLYING - strike, 0) + value
    const putMid = Math.max(strike - UNDERLYING, 0) + value
    const callDelta = 1 / (1 + Math.exp((strike - UNDERLYING) / 2500))
    const iv = 52 + (away / UNDERLYING) * 80
    const open = Math.round(2400 * Math.exp(-away / 4200) + 300)
    return {
      strike,
      call: { bid: callMid * 0.99, ask: callMid * 1.01, last: callMid, iv, delta: callDelta, openInterest: open },
      put: {
        bid: putMid * 0.99,
        ask: putMid * 1.01,
        last: putMid,
        iv,
        delta: callDelta - 1,
        openInterest: Math.round(open * 0.8),
      },
    }
  })
}

export const OPTIONS_LABELS: OptionsChainLabels = {
  region: '期权 T 型报价（演示数据）',
  expiry: '到期日',
  underlying: '标的',
  call: '认购',
  put: '认沽',
  strike: '行权价',
  fields: { bid: '买价', ask: '卖价', last: '最新', iv: 'IV', delta: 'Delta', openInterest: '持仓量' },
  atm: '平值',
  cell: (strike, side, field, text) =>
    `${strike} ${side === 'call' ? '认购' : '认沽'} ${OPTIONS_LABELS.fields[field]} ${text}`,
  empty: '没有报价',
}

export function OptionsChainUsage() {
  const [expiry, setExpiry] = useState('1129')
  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <OptionsChain
        rows={chainFor(expiry)}
        underlyingPrice={UNDERLYING}
        expiries={EXPIRIES}
        expiry={expiry}
        onExpiryChange={setExpiry}
        onQuoteSelect={(strike, side, field) => console.log('选中', strike, side, field)}
        labels={OPTIONS_LABELS}
      />
    </div>
  )
}
