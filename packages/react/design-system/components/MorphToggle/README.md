# MorphToggle

带仪式感的单个开关：圆钮滑动时形状跟着变（方块变圆），或钮里两个图标转着换。底座是 Radix Switch，尺寸与颜色同 Switch。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### MorphToggle

其余属性透传给 Radix Switch.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aria-label` * | `string \| undefined` | — | Defines a string value that labels the current element. |
| `variant` | `'plain' \| 'morph' \| 'icon'` | `'morph'` | Thumb motion: morph changes the thumb shape while it slides, icon swaps the icons inside it, plain only slides. |
| `size` | `keyof typeof SIZES` | `'default'` | default matches Switch; lg is bigger so an icon fits in the thumb. |
| `icons` | `{ on: ReactNode; off: ReactNode }` | — | Icons shown in the thumb for the on and off states (icon variant). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MorphToggle } from '@katana-ui/react'

export function MorphToggleUsage() {
  return <MorphToggle aria-label="Live trading" variant="morph" defaultChecked />
}
```

## States

- plain、morph、icon 三种变体 × 关、开。
- lg 尺寸给带图标的圆钮。
- 禁用降到 45%。

## Don't

- 设置页里成排的开关用 Switch，别都换成它。
- icon 变体的两个图标要一眼分得清开与关。

## Composition

```
MorphToggle
  span（轨道）
    motion.span（圆钮）
      图标（icon 变体）
```

## Keyboard

- `Tab`：聚焦
- `Space / Enter`：翻转
