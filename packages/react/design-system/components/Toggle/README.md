# Toggle

单个按下即开的按钮（aria-pressed）：外形是 Button，开时换分段选中的底与字；按下缩到 0.97。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### Toggle

其余属性透传给 Radix Toggle.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `ButtonSize \| 'default'` | — | Height: md (default) is 30px, sm is 26px, icon is a 28px square; `'default'` is the deprecated name of md. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Toggle } from '@katana-ui/react'

export function ToggleUsage() {
  return <Toggle defaultPressed>Follow latest</Toggle>
}
```

## States

- 关、开、禁用关、禁用开。
- md（默认）30 高，sm 是 26 高，icon 是 28 见方；旧名 size="default" 等于 md。

## Don't

- 互斥的几项用 ToggleGroup。
- 设置页里的开关用 Switch。

## Composition

```
Toggle
```

## Keyboard

- `Tab`：聚焦
- `Space / Enter`：翻转
