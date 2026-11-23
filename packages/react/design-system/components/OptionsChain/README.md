# OptionsChain

账户四件之一（#104）：行权价居中，左认购右认沽；每翼的列可配（买价、卖价、最新、IV、Delta、持仓量），认购翼镜像排，第一个字段两翼都贴着行权价；离标的价最近的行权价是平值行，整行加亮并标「平值」，认购在平值之下、认沽在平值之上是实值区，铺淡底；上方是到期日切换（选项由调用方传，rows 由调用方换）；点任一格回调 onQuoteSelect(strike, side, field)。认购认沽靠位置区分，不用涨跌色。

## Provide

`*` marks a required prop.

### OptionsChain

行 OptionRow 与每侧 OptionQuote 见类型；iv 是百分数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` * | `readonly OptionRow[]` | — | Rows of the selected expiry, any order (sorted by strike here). |
| `underlyingPrice` * | `number` | — | Underlying price: decides the at-the-money row and the in-the-money zone. |
| `expiries` * | `readonly OptionExpiry[]` | — | Expiries to switch between. |
| `expiry` * | `string` | — | The selected expiry id. |
| `onExpiryChange` | `(id: string) => void` | — | Called with the id of the expiry the user picked; the caller swaps `rows`. |
| `fields` | `readonly OptionField[]` | `DEFAULT_FIELDS` | Columns of each wing, in the order they are listed from the strike outward on the put side; defaults to bid, ask, last, IV, delta, open interest. |
| `onQuoteSelect` | `(strike: number, side: OptionSide, field: OptionField) => void` | — | Called when a quote cell is pressed (click, Enter or Space). |
| `formatValue` | `(value: number \| null \| undefined, field: OptionField) => string` | `(value, field) => formatOptionField(field, value)` | How a cell value is written; defaults to prices with two decimals, IV with one and a percent sign, delta with two. |
| `formatStrike` | `(value: number) => string` | `plain` | How the underlying price and strikes are written; defaults to the plain number. |
| `labels` * | `OptionsChainLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### atmStrike

纯函数：离标的价最近的行权价，一样近取低的。

### isItm

纯函数：实值判定。

### sortedRows

纯函数：按行权价从低到高排，不改输入。

### wingFields

纯函数：一翼的列次序，认购翼镜像。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { OptionsChain, type OptionExpiry, type OptionRow, type OptionsChainLabels } from '@katana-ui/react/blocks'

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
```

## States

- 平值行：整行加亮并写「平值」；标的价变了平值跟着换。
- 实值区：认购在平值之下、认沽在平值之上的格子铺淡底。
- 没有值的格子写「—」，点了不发回调。
- 没有行时写 labels.empty。

## Don't

- 不要在件里定价：IV、Delta、买卖价都由调用方给。
- 不要用涨跌色区分认购认沽：靠左右位置与表头。

## Composition

```
OptionsChain
  到期日切换 + 标的价
  grid
    表头
    行 × n：认购格 | 行权价 | 认沽格
```

## Keyboard

- `↑ ↓ ← →`：在格子间移动
- `Enter / Space`：选中当前格
