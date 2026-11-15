# PeerCards

照 TradingView 品种页的 Peers（2026-11-15 实测）：横向卡片带，左右翻页箭头（到头变灰）；每卡一个字母圆徽标、代码、名称（过长截断）、右上「+」、价格（带单位小字）与涨跌幅（涨跌色）；右上角整组一个「Select to compare」按钮。数、价格与文字都由调用方传，不放真实公司标志。

## Provide

`*` marks a required prop.

### PeerCards

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `PeerItem[]` | — | { key, code, name, price（写好的）, unit?, change（百分数）, logoSrc? }。 |
| `labels` | `PeerCardsLabels` | — | { list, prev, next, compare, add(item) }：读屏名与按钮字。 |
| `onSelect / onAdd / onCompare` | `callbacks` | — | 点卡、点「+」、点「Select to compare」。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PeerCards, type PeerItem } from '@katana-ui/react/quant'

const PEERS: readonly PeerItem[] = [
  { key: 'AAA', code: 'AAA', name: 'Alpha Devices Incorporated', price: '212.40', unit: 'USD', change: 0.84 },
  { key: 'BRV', code: 'BRV', name: 'Bravo Semiconductor Holdings', price: '1,044.10', unit: 'USD', change: -2.31 },
  { key: 'CHL', code: 'CHL', name: 'Charlie Software', price: '418.77', unit: 'USD', change: 1.12 },
  { key: 'DLT', code: 'DLT', name: 'Delta Cloud Systems Ltd', price: '96.05', unit: 'USD', change: -0.2 },
]

export function PeerCardsUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PeerCards
        items={PEERS}
        labels={{
          list: 'Peers',
          prev: 'Previous',
          next: 'Next',
          compare: 'Select to compare',
          add: (item) => `Add ${item.code} to compare`,
        }}
        onSelect={() => undefined}
        onAdd={() => undefined}
        onCompare={() => undefined}
      />
    </div>
  )
}
```

## States

- 滚到最左：上一页箭头 disabled；滚到最右：下一页箭头 disabled。
- 名称过长：省略号，悬停看全名。

## Don't

- 不要把「+」塞进卡的按钮里：它是卡旁边另一个按钮。
- 不要放真实公司标志。

## Composition

```
PeerCards
  按钮组（compare · prev · next）
  div role=list
    div role=listitem（button 卡 · button +）
```

## Keyboard

- `Tab / Enter`：卡、「+」、箭头、对比按钮
