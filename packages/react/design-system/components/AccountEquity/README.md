# AccountEquity

账户四件之一（#104）：总权益、可用、已用保证金、未实现盈亏四个读数，下面是保证金率风险条：安全、警告、危险三段按调用方给的阈值切开（direction 默认越高越危险，维持保证金率那种越低越危险写 lower），指针标当前位置，档位同时写成文字；保证金率不传就按已用保证金 / 总权益算。可选 curve 画迷你权益曲线。

## Provide

`*` marks a required prop.

### AccountEquity

读数都是调用方算好的数；阈值与方向见 MarginThresholds。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `equity` * | `number` | — | Total equity. |
| `available` * | `number` | — | Balance that can open new positions. |
| `usedMargin` * | `number` | — | Margin held by open positions and orders. |
| `unrealizedPnl` * | `number` | — | Unrealized PnL of all positions. |
| `marginRatio` | `number \| null` | — | Margin ratio in percent; defaults to usedMargin over equity. |
| `thresholds` * | `MarginThresholds` | — | Risk thresholds of the margin ratio, in percent: { warn, danger, direction }. |
| `scaleMax` | `number` | — | Top of the risk bar in percent; defaults to 1.5 times the outer threshold. |
| `curve` | `readonly number[]` | — | Equity samples from old to new for the mini curve; omit for no curve. |
| `currency` | `string` | — | Settlement currency shown under the readings (USDT). |
| `formatAmount` | `(value: number) => string` | `defaultAmount` | How a money amount is written; defaults to two decimals with grouping. |
| `formatRatio` | `(value: number) => string` | `defaultRatio` | How the margin ratio is written; defaults to two decimals and a percent sign. |
| `labels` * | `AccountEquityLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### marginLevel

纯函数：保证金率落在哪一档，阈值上的值算更危险的一档。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `warn` * | `number` | — | Ratio, in percent, at which the warn level starts. |
| `danger` * | `number` | — | Ratio, in percent, at which the danger level starts. |
| `direction` | `'higher' \| 'lower'` | — | Which way is riskier: `higher` (default) or `lower`. |

### marginRatioOf

纯函数：已用保证金 / 权益，百分数。

### riskBands

纯函数：风险条的三段。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `warn` * | `number` | — | Ratio, in percent, at which the warn level starts. |
| `danger` * | `number` | — | Ratio, in percent, at which the danger level starts. |
| `direction` | `'higher' \| 'lower'` | — | Which way is riskier: `higher` (default) or `lower`. |

### riskPosition

纯函数：指针位置，0 到 1。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AccountEquity, type AccountEquityLabels } from '@katana-ui/react/blocks'

// 演示数据：账户数字与权益曲线都是编出来的（闭式公式），不是真实账户。
export const EQUITY_CURVE: readonly number[] = Array.from({ length: 48 }, (_, i) =>
  Math.round(50000 + i * 52 + 900 * Math.sin(i / 4) + 400 * Math.cos(i / 1.7)),
)

export const EQUITY_LABELS: AccountEquityLabels = {
  region: '账户权益（演示数据）',
  equity: '总权益',
  available: '可用',
  usedMargin: '已用保证金',
  unrealizedPnl: '未实现盈亏',
  marginRatio: '保证金率',
  level: { safe: '安全', warn: '警告', danger: '危险' },
  threshold: (level, value, direction) =>
    `${level === 'warn' ? '警告' : '危险'} ${direction === 'higher' ? '≥' : '≤'} ${value}%`,
  curve: '近 48 个周期权益',
}

export function AccountEquityUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <AccountEquity
        equity={52430.18}
        available={31720.4}
        usedMargin={20709.78}
        unrealizedPnl={-1691}
        thresholds={{ warn: 50, danger: 80 }}
        curve={EQUITY_CURVE}
        currency="USDT"
        labels={EQUITY_LABELS}
      />
    </div>
  )
}
```

## States

- 安全 / 警告 / 危险：指针落在对应段，数字与档位标签同色。
- 越界：超出刻度时指针贴端点；权益不是正数时写「—」，不画指针。
- 没传 curve 或点数不足两个，不画曲线。

## Don't

- 不要在件里定阈值：各家口径不同，warn 与 danger 由调用方传。
- 不要把档位只画成颜色：档位标签是文字。

## Composition

```
AccountEquity
  Lcd × 4
  风险条（三段 + 指针 + 档位）
  曲线（可选）
```
