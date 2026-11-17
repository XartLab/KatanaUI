# TimeMachineStack

一摞面板按深度排开，只有最前一张可读；滚轮、拖动、方向键往后翻，前一张飞过观众、后一张补上。回看策略版本史：最前是当前版本，往后是更早的。

## Provide

`*` marks a required prop.

### TimeMachineStack

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly TimeMachineStackItem[]` | — | The panels, front first. |
| `label` * | `string` | — | What screen readers call the stack (required). |
| `status` * | `(index: number, total: number) => string` | — | Spoken position, e.g. |
| `index` | `number` | — | Index of the front item (controlled). |
| `onIndexChange` | `(index: number) => void` | — | Called with the new front index. |
| `depth` | `number` | `DEFAULTS.depth` | How far each receding panel is pushed back, px. |
| `offsetY` | `number` | `DEFAULTS.offsetY` | How far each receding panel moves up, px. |
| `scaleStep` | `number` | `DEFAULTS.scaleStep` | How much each receding panel shrinks, 0 to 1. |
| `visibleCount` | `number` | `DEFAULTS.visibleCount` | How many panels show at once; the rest stay unmounted. |
| `perspective` | `number` | `DEFAULTS.perspective` | CSS perspective of the stack, px. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TimeMachineStack } from '@katana-ui/react'

export function TimeMachineStackUsage() {
  return (
    <TimeMachineStack
      label="Strategy history"
      status={(index, total) => `Version ${total - index} of ${total}`}
      items={[
        { id: 'v3', content: <div style={{ padding: 16 }}>v3 · current</div> },
        { id: 'v2', content: <div style={{ padding: 16 }}>v2 · volatility filter</div> },
        { id: 'v1', content: <div style={{ padding: 16 }}>v1 · first cut</div> },
      ]}
    />
  )
}
```

## States

- 静止：最前一张完整，后面的缩小、上移、往后推。
- 翻页：最前一张飞出，下一张升到最前；往回翻则从前面落下。
- 到头：滚轮交还给页面。
- 读屏：aria-live 播报位置。

## Don't

- 不要放需要同时对比的东西：只有最前一张可读（要对比用 ExpandableCards）。
- 不要放超过几十项：每次只挂 visibleCount 张，但翻起来要很多下。

## Composition

```
TimeMachineStack
  div role=listbox
    motion.div role=option（一张面板）
  div aria-live
```

## Keyboard

- `↓ / ↑`：往后 / 往前翻一张
- `Home / End`：到最前 / 最后一张
- `滚轮 / 拖动`：翻页
