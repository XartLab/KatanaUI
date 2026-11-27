# ProximityHighlight

一块高亮底色在列表或菜单的行间平滑滑动，而不是逐行亮灭；指针划过行间的缝与容器内边时底色不灭，快速划过不抖（取最近的行，带 2px 迟滞）。没有指针时跟当前行（键盘高亮）。位置写在元素 style 上，不走 React 状态。万能框用它，菜单与列表也能用。

## Provide

`*` marks a required prop.

### useProximityHighlight(containerRef, options)

返回 highlightRef：把它挂在容器里第一个子元素（className="k-proximity-highlight"、aria-hidden）上；容器要 position: relative，行要 position: relative 盖在它上面。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `itemSelector` * | `string` | — | CSS selector of the rows inside the container (for example `[cmdk-item]`). |
| `activeSelector` | `string` | — | CSS selector of the current row when the pointer is away (keyboard highlight), for example `[cmdk-item][aria-selected="true"]`. |
| `enabled` | `boolean` | — | Turn the highlight off (rows keep their own background). |
| `hysteresis` | `number` | — | Pixels past a row's edge in which the pointer still counts as on it, so the highlight does not flip back and forth at the seam. |
| `reach` | `number` | — | Farthest distance in pixels from a row at which the pointer still picks it (the gap and padding around rows). |

### nearestRow(rects, y, options?)

指针 y 落在哪一行的纯函数：行里就是它，缝里取最近的，离得超过 reach 算没有；current 离上下沿不超过 hysteresis 时不换。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `current` | `number \| null` | — | Index of the row picked last time; kept while the pointer stays within `hysteresis` of its edges. |
| `hysteresis` | `number` | — | Pixels past the current row's edges in which it is kept. |
| `reach` | `number` | — | Farthest distance in pixels from a row at which it is still picked. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { useProximityHighlight } from '@katana-ui/react'

const ROWS = ['AAPL', 'AMD', 'BTC-USDT', 'TSLA']

export function ProximityHighlightUsage() {
  const ref = useRef<HTMLUListElement>(null)
  // 容器要 position: relative；底色元素放在容器里排第一个，行（position: relative）盖在它上面，行自己不画悬停底色。
  const { highlightRef } = useProximityHighlight(ref, { itemSelector: '[data-row]' })
  return (
    <ul
      ref={ref}
      aria-label="演示列表"
      style={{ position: 'relative', margin: 0, padding: 6, listStyle: 'none', width: 220 }}
    >
      <div ref={highlightRef} aria-hidden="true" className="k-proximity-highlight" />
      {ROWS.map((row) => (
        <li
          key={row}
          data-row=""
          style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center', padding: '0 8px' }}
        >
          {row}
        </li>
      ))}
    </ul>
  )
}
```

## States

- 指针在容器里：底色在最近的行上，换行时滑过去；第一次出现直接落在行上，不从别处滑来。
- 指针离开：回到当前行（activeSelector 给的，比如 cmdk 的 aria-selected 行），没有就收起。
- 指针在行间的缝里：底色回到当前行，不停在「最近的行」上，免得高亮的行与回车选中的行不是同一行；禁用的行不亮。

## Don't

- 不要再给行写悬停底色：行自己的悬停与选中底色要改成透明，不然两层叠在一起。
- 不要把它放进 role=listbox 以外又没有 aria-hidden 的位置：底色元素是纯装饰，要带 aria-hidden（listbox 里再加 role="presentation"）。

## Composition

```
container（position: relative）
  div.k-proximity-highlight（highlightRef，aria-hidden）
  行 × N（position: relative）
```
