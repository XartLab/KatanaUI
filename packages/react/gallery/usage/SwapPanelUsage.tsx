// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SwapPanel } from '../../src/blocks'

const LABELS = {
  pay: 'You pay',
  receive: 'You receive',
  balance: 'Balance',
  max: 'Max',
  flip: 'Swap sides',
  chooseAsset: 'Change {side} asset, currently {symbol}',
  rate: 'Rate',
  fee: 'Fee',
  impact: 'Impact',
  slippage: 'Max slippage',
  submit: 'Review conversion',
  submitting: 'Converting…',
  retry: 'Try again',
  expires: 'Quote expires',
}

export function SwapPanelUsage() {
  const [amount, setAmount] = useState('1000')
  const [flipped, setFlipped] = useState(false)
  const [from, to] = flipped ? (['USD', 'CNH'] as const) : (['CNH', 'USD'] as const)
  const rate = flipped ? 7.236 : 0.1382
  return (
    <SwapPanel
      amount={amount}
      onAmountChange={setAmount}
      from={{ symbol: from, balance: 25000 }}
      to={{ symbol: to }}
      quote={{ output: (Number(amount) || 0) * rate, rate }}
      status="ready"
      labels={LABELS}
      onFlip={() => setFlipped((value) => !value)}
      onSubmit={() => undefined}
    />
  )
}
