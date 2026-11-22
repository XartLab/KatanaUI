# StatusBar

顶栏、底栏的分段模型：左 / 中 / 右三段，每段一组项（点阵键名、值、状态灯、可点）；项由数据声明，宽度不够时按优先级收进「…」。实盘项有琥珀框、不可收起。

## Provide

`*` marks a required prop.

### StatusBar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `left / center / right` | `StatusItem[]` | — | 三段各一组项。 |
| `label` | `string` | — | 状态栏的名字（读屏念）。 |
| `labels` | `{ more }` | — | 「…」按钮的名字（旧名 moreLabel 留一个版本）。 |

### StatusItem

一项的数据。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | — | 稳定的 id。 |
| `label / value` | `string / ReactNode` | — | 点阵键名（灰）与等宽的值（亮）。 |
| `tone / ledLabel` | `SeverityExt / string` | — | 前面状态灯的语气（灯由 ledOf 取，accent 是点亮的强调色）与它的名字（给了灯就必须给名字）；旧名 led（LedState）留一个版本。 |
| `onClick` | `() => void` | — | 给了整项是按钮（QUOTE → 数据源）。 |
| `priority` | `number` | `0` | 越大越晚被收起。 |
| `pinned / live` | `boolean` | — | 永不收起；live 另外画琥珀内描边（实盘账户）。 |
| `hidden` | `boolean` | — | 隐藏（宿主「无事则隐藏」算出的结果），不占位。 |

### collapsedItems(items, available, gap, moreWidth)

收起哪些项的纯函数，StatusBar 内部用，自己排版时也能拿去。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { StatusBar, type StatusItem } from '@katana-ui/react/blocks'
import { Button } from '@katana-ui/react'

const STATUS_ITEMS: readonly StatusItem[] = [
  { id: 'quote', label: 'QUOTE', value: '42 ms', tone: 'ok', ledLabel: 'OK', priority: 3, onClick: () => {} },
  { id: 'exec', label: 'EXEC', value: '118 ms', tone: 'warn', ledLabel: 'Slow', priority: 3, onClick: () => {} },
  { id: 'live', label: 'LIVE', value: 'IBKR U123', live: true, tone: 'accent', ledLabel: 'Live account' },
  { id: 'link', label: 'LINK', value: 'A · BTCUSDT', priority: 1, onClick: () => {} },
  { id: 'mode', label: 'MODE', value: 'QUIET', priority: 0 },
  { id: 'clock', value: '09:30:12', priority: 4 },
]

export function StatusBarUsage() {
  const [width, setWidth] = useState(720)
  const items = STATUS_ITEMS
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 760 }}>
      <div style={{ width }} data-testid="status-demo">
        <StatusBar
          label="Status bar"
          labels={{ more: 'More status items' }}
          left={items.slice(0, 3)}
          center={items.slice(3, 5)}
          right={items.slice(5)}
        />
      </div>
      <Button onClick={() => setWidth(720)}>720</Button>
      <Button onClick={() => setWidth(420)}>420</Button>
      <Button onClick={() => setWidth(260)}>260</Button>
    </div>
  )
}
```

## States

- 宽度够：所有项都在条上，段与段交替 bg-400 / bg-200，斜切叠接。
- 宽度不够：先收优先级最低的（同级收靠后的）进「…」弹层，pinned 与 live 不收。
- 项可点：悬停提亮，是按钮；不可点是纯读数。
- 实盘项：琥珀内描边，不能被隐藏策略收掉。
- 灯：项给 tone（Severity，加 off / accent），灯由 ledOf 取——neutral、off 不亮，accent 是点亮的强调色（实盘项用它）；旧的 led（LedState）留一个版本。

## Don't

- 段不要超过 8 个，更多进运行中心。
- 整条栏亮灯不超过两盏（时钟不算）。
- 不要把键名与值写成一个长句，键名用短大写词。

## Composition

```
StatusBar
  group（左 / 中 / 右）
    StatusItem：Led · 键名 · 值
  Popover（「…」收起的项）
```

## Keyboard

- `Tab`：依次到可点的项与「…」
- `Enter / Space`：触发项；「…」打开收起的项
