# QuantFormat

价格、涨跌幅、数量的写法（纯函数，不带 React；另有 @katana-ui/react/quant/format 出口给画布与 Worker）。小数位由调用方传，不在这里猜。

## Provide

`*` marks a required prop.

### formatPrice(value, { precision, tick, fallback })

千分位固定 en-US；不是有限数写 —。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `precision` | `number \| null` | — | Decimal places (the symbol's price precision); null or omitted falls back to tick, then to fallback. |
| `tick` | `number` | — | Minimum price increment (0.01 for A-shares, 1e-8 for crypto); sets the decimals when precision is missing. |
| `fallback` | `PriceFallback` | — | What to write when neither precision nor tick is given. |

### decimalsOfTick(tick)

1e-8 在 String() 里是科学计数，拆开尾数与指数数位。

### formatPercentChange(value, digits) / toneOf(value, digits)

都先四舍五入再定符号与方向。

### formatQuantity / formatCount / formatCompact / compactParts / AUTO_SIZE

数量的缩写（K / M / B）与千分位；单位 base 是币量、usd 带 $。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `abbreviate` * | `boolean` | — | Abbreviate large numbers with K, M or B. |
| `digits` * | `number \| null` | — | Decimal places of the abbreviated number. |

### formatVolume(value)

列表里的量与金额（照 TradingView 涨幅榜页，2026-11-15 读）：835.49 K、2.95 M、7.29 B，两位小数、数字与单位之间空一格；不到 1,000 取整；不带币种符号。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { formatCompact, formatPercentChange, formatPrice } from '@katana-ui/react/quant/format'

export function QuantFormatUsage() {
  return (
    <p>
      {formatPrice(1688, { tick: 0.01 })} {formatPercentChange(1.234)} {formatCompact(1_250_000)}
    </p>
  )
}
```

## States

- formatPrice：定了小数位就恒写这么多位；不是有限数写 —。
- formatPercentChange 与 toneOf 先舍入再定符号与方向：舍入成 0 的小负数是「平」。

## Don't

- 不要在格式化函数里猜品种的精度，由调用方传 precision 或 tick。
- 不要自己拼千分位。

## Composition

```
formatPrice
  decimalsOfTick
formatPercentChange
toneOf
formatQuantity
  formatCount
formatCompact
  compactParts
formatVolume
```
