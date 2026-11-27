# Switch

34 × 18 的轨道画在 40 × 28 的布局盒里；开时轨道换强调色，圆钮挪过去。

## Provide

`*` marks a required prop.

### Switch

其余属性透传给 UI SDK Switch。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Switch } from '@katana-ui/react'

export function SwitchUsage() {
  const [on, setOn] = useState(true)
  return <Switch aria-label="Show grid" checked={on} onCheckedChange={setOn} />
}
```

## States

- 关：10% 白轨道 + 9% 白内描边，圆钮 ink-300（--k-selectable-track-* / -thumb-background）。
- 开：轨道换实心亮中性（--k-selectable-bold-background-selected），圆钮换深色并滑 16px（snappy）。
- 悬停：关时轨道提到 18% 白，开时实心降到 ink-200。
- 禁用关、禁用开：45% 不透明度，不响应指针。

## Don't

- 不要用开关做「提交」这类一次性动作。
- 不要把开关放进要点「保存」才生效的表单里，那用 Checkbox。
- 标签写开着时的意思（「显示成交量」），不要写成问句或「开 / 关」。

## Composition

```
Switch
```

## Keyboard

- `Tab`：聚焦
- `Space / Enter`：翻转
