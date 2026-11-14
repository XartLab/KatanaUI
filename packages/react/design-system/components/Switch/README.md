# Switch

34 × 18 的轨道画在 40 × 28 的布局盒里；开时轨道换强调色，圆钮挪过去。

## Provide

`*` marks a required prop.

### Switch

其余属性透传给 Radix Switch.Root。

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

- 关、开、禁用关、禁用开。

## Don't

- 不要用开关做「提交」这类一次性动作。

## Composition

```
Switch
```

## Keyboard

- `Tab`：聚焦
- `Space / Enter`：翻转
