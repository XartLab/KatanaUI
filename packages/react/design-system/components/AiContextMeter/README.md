# AiContextMeter

上下文窗口用掉了多少：一个小环加「已用/总量」；越过 80% 变琥珀、越过 95% 变红，几何不变只换色相。悬停、聚焦或点按弹出分项（什么在占窗口）。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiContextMeter

label 必传（读屏名，如「上下文已用 62%」）；有 breakdown 才可展开。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `used` * | `number` | — | Tokens currently used. |
| `limit` * | `number` | — | Total size of the context window in tokens. |
| `label` * | `string` | — | Accessible name (required), such as "Context 62% used, 79k of 128k tokens". |
| `breakdown` | `readonly AiContextBreakdownItem[]` | — | Optional split of what is filling the window; makes the meter open a popover. |
| `warningAt` | `number` | `DEFAULT_WARNING_AT` | Fraction at which the ring turns amber. |
| `dangerAt` | `number` | `DEFAULT_DANGER_AT` | Fraction at which the ring turns red. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiContextMeter } from '@katana-ui/react'

export function AiContextMeterUsage() {
  return (
    <AiContextMeter
      used={62_000}
      limit={128_000}
      label="上下文已用 48%"
      breakdown={[
        { label: '对话历史', tokens: 28_000 },
        { label: '工具结果', tokens: 34_000 },
      ]}
    />
  )
}
```

## States

- 常态：环与读数。
- 越过 warningAt：环变琥珀；越过 dangerAt：变红。
- 有分项：悬停、聚焦或点按弹出。

## Don't

- 越线不要放大环：放大读成「进展不错」。
- 没有分项数据就别给 breakdown，按钮会保持禁用。

## Composition

```
AiContextMeter
  button（环 + 读数）
  div（分项，弹出时）
```

## Keyboard

- `Tab`：聚焦，键盘聚焦时弹出分项
- `Enter / Space`：切换分项
