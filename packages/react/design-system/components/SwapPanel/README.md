# SwapPanel

付出一栏（输入、余额、Max）、收到一栏（报价算出的数额，换了会往上滚；报价中扫光）、中间翻转钮、报价明细（汇率、费用、影响、滑点，有效期画成倒计时圆环）与提交钮。文案全走 labels。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### SwapPanel

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` * | `string` | — | The pay amount as typed (text, so "1." and "" are possible). |
| `onAmountChange` * | `(value: string) => void` | — | Called with the new text on every edit of the pay amount. |
| `from` * | `SwapAsset` | — | The asset paid. |
| `to` * | `SwapAsset` | — | The asset received. |
| `quote` | `SwapQuote` | — | Current quote; leave out before the first one arrives. |
| `slippage` | `number` | — | Maximum slippage as a fraction. |
| `status` * | `SwapStatus` | — | Drives the shimmer on the receive row and the submit button. |
| `error` | `string` | — | Error text shown under the quote (role=alert). |
| `labels` * | `SwapPanelLabels` | — | All visible text and accessible names. |
| `locale` | `string` | — | BCP 47 tag for number formatting, defaults to the browser language. |
| `onFlip` * | `() => void` | — | Called when the flip button is clicked; swap `from` and `to` yourself. |
| `onSelectAsset` | `(side: 'pay' \| 'receive') => void` | — | Called when an asset chip is clicked, to open your asset picker. |
| `onSubmit` * | `() => void` | — | Called when the submit button is clicked. |
| `className` | `string` | — | Extra class name on the panel. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SwapPanel } from '@katana-ui/react/blocks'

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
```

## States

- idle / ready：显示报价明细，提交钮可点。
- quoting：收到栏扫光，提交钮禁用。
- submitting：提交钮写 submitting 的文字并禁用。
- error：error 文字显示在报价下面（role=alert），提交钮写 retry 的文字。

## Don't

- 报价要有时效：给 expiresAt，过期由调用方重新取价，面板不自己续。
- 数额不超过精度时再提交，校验与下单在调用方。
- 要两个以上币对的列表用 QuoteTable，这个件只做一对。

## Composition

```
SwapPanel
  label · input · AssetChip（Button）
  Button（翻转）
  RollingFigure · AssetChip
  CountdownRing · 报价明细
  Button（提交）
```

## Keyboard

- `Tab`：输入、币种钮、Max、翻转、提交，依次走
- `Enter`：在币种钮、翻转、提交上触发
