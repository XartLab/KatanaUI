# KeyStats

照 TradingView 品种页的 Key stats（2026-11-15 实测）：标题带「›」，三列网格，每项一个灰色小标签（带「›」，给了 onItem 就可点）、一个大号数值（带单位小字）、可选徽标（中性灰胶囊，不用 TV 的紫色）。数值与文字由调用方传。

## Provide

`*` marks a required prop.

### KeyStats

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | — | 标题。 |
| `items` | `KeyStatItem[]` | — | { id（旧名 key）, label, value?, unit?, badge? }；没有值画「—」。 |
| `onTitle / onSelect` | `callbacks` | — | 给了标题与标签就变成按钮，带「›」（onSelect 旧名 onItem）。 |
| `columns` | `number` | `3` | 列数。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { KeyStats } from '@katana-ui/react/quant'

export function KeyStatsUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <KeyStats
        title="Key stats"
        onTitle={() => undefined}
        onItem={() => undefined}
        items={[
          { key: 'cap', label: 'Market cap', value: '3.41T', unit: 'USD', badge: 'Mega cap' },
          { key: 'pe', label: 'Price to earnings (P/E TTM)', value: '31.20' },
          { key: 'eps', label: 'Basic EPS (TTM)', value: '6.57', unit: 'USD' },
          { key: 'beta', label: 'Beta (1Y)', value: '—' },
        ]}
      />
    </div>
  )
}
```

## States

- 没给 onSelect：标签是普通文字，没有「›」。
- 没有值：数值位写「—」。
- 数值变了：闪一次涨跌色。

## Don't

- 不要在件里格式化数值；由调用方传。
- 徽标不要用彩色。

## Composition

```
KeyStats section
  h3 标题（›）
  dl 网格
    div（dt 标签 › · dd 数值 · 单位 · 徽标）
```

## Keyboard

- `Tab / Enter`：给了回调时到标题、标签上、触发
