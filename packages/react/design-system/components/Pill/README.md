# Pill

单个可点、可关的小胶囊：本体是一个按钮（主动作，如点开改条件），给了 onDismiss 末尾多一个 × 钮只做「去掉」；24 高（sm 20）、圆角 pill、actionable 的底与边，与 ChipGroup 的芯片同一套数值。selected 时是开关，选中画法同分段切换。照 Salt Pill（Apache-2.0，只取结构）。

## Provide

`*` marks a required prop.

### Pill

className 给外层 span；其余属性透传给本体 button（本体只在有 onClick 或 selected 时是 button，否则是纯文字）。给了 onDismiss 必须给 dismissLabel。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | Text of the pill: one or two words. |
| `icon` | `ReactNode` | — | Leading icon (13px); decorative, so give it aria-hidden. |
| `selected` | `boolean` | — | Pressed state (aria-pressed): the pill becomes a toggle drawn in the selected look. |
| `onDismiss` | `() => void` | — | Given: an × button at the end removes the pill; Backspace or Delete on the pill does the same. |
| `dismissLabel` | `string` | — | Accessible name of the × button, for example "Remove P/E < 20"; required with onDismiss (the package ships no text). |
| `size` | `PillSize` | `'md'` | md (24px, default) or sm (20px). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Pill } from '@katana-ui/react'

export function PillUsage() {
  const [filters, setFilters] = useState(['P/E < 20', 'Market cap > 10B'])
  const [editing, setEditing] = useState('')
  return (
    <>
      {filters.map((filter) => (
        <Pill
          key={filter}
          onClick={() => setEditing(filter)}
          onDismiss={() => setFilters((list) => list.filter((item) => item !== filter))}
          dismissLabel={`Remove ${filter}`}
        >
          {filter}
        </Pill>
      ))}
      <output>{editing}</output>
    </>
  )
}
```

## States

- 默认：actionable 底与 7% 白边，悬停提亮，按下整颗缩到 0.96。
- selected：aria-pressed，底换 --seg-on-bg、字 --seg-on-ink、700 粗（同 ChipGroup 选中的芯片）。
- 可关：本体右内距收到 2px，后面一个 20 见方的 ×（点按区外扩到 24 见方），悬停换 subtle 底；焦点在本体上按 Backspace / Delete 也关。
- sm：20 高、caption 字号，× 16 见方；md（默认）24 高。
- 禁用：整颗 35% 不透明度，两个按钮都不响应。
- 焦点：本体聚焦时焦点环套住整颗，× 聚焦时只套 ×。

## Don't

- 不要拿它做不可交互的标记：只展示用 Tag。
- 一组互相关联的开关筛选用 ChipGroup，不要摆一排 selected 的 Pill。
- 不要整颗点了就删（Salt 例子的写法）：改和删分开，× 只做删。
- × 的读屏名要说清删的是哪一条（「去掉条件 P/E < 20」），不要只写「关闭」。

## Composition

```
Pill（span）
  本体（button | span）
    图标（可选）
    文字
  ×（button，有 onDismiss 时）
```

## Keyboard

- `Tab`：先到本体，再到 ×
- `Enter / Space`：本体：主动作；×：去掉
- `Backspace / Delete`：焦点在本体上时去掉这颗（有 onDismiss 时）
