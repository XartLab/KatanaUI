# ThemeSelector

每个主题一张缩略预览（迷你控制台），选中的那张加一圈环，环在选项之间用弹簧滑过去。缩略颜色由调用方传，所以能同时预览别的主题。学自 rare-ui。

## Provide

`*` marks a required prop.

### ThemeSelector

role=radiogroup；tab 只停在选中那张。value 传 null 表示受控但还没选。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `themes` * | `readonly ThemeOption[]` | — | The themes to choose from, each with value, label and preview colors (required). |
| `value` | `string \| null` | — | The current theme; null means controlled but nothing selected. |
| `defaultValue` | `string` | — | Initial theme when uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Called with the chosen theme value. |
| `onChange` | `(value: string) => void` | — | Old name of onValueChange, kept for one release. |
| `label` * | `string` | — | Accessible name of the whole group (required). |
| `showLabels` | `boolean` | `true` | Whether to write the name under each thumbnail (accessible names are not affected). |
| `disabled` | `boolean` | — | Disable the whole group. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ThemeSelector, type ThemeOption } from '@katana-ui/react'

const colors = { rail: '#111', panel: '#181818', line: '#333', strong: '#eee', muted: '#888', tile: '#222' }
const THEMES: readonly ThemeOption[] = [
  { value: 'console', label: 'Console', colors },
  { value: 'graphite', label: 'Graphite', colors },
]

export function ThemeSelectorUsage() {
  return <ThemeSelector themes={THEMES} label="Theme" defaultValue="console" />
}
```

## States

- 选中的那张加一圈环，环在选项之间用弹簧滑过去。
- 禁用：不响应。

## Don't

- 缩略颜色由调用方传，不要在包里写死主题色。
- 不要拿它选主题以外的东西：缩略图画的是一块控制台，别的选项用 ToggleGroup 或 Select。
- 主题超过四五个时别全摆成缩略：改成下拉，缩略只放常用的。

## Composition

```
ThemeSelector
  button role=radio（缩略 SVG + 选中环）
  span（名字）
```

## Keyboard

- `Tab`：进入 / 离开整组（停在选中那张）
- `← → ↑ ↓`：移到上一张 / 下一张并选中，到头循环
- `Home / End`：第一张 / 最后一张
