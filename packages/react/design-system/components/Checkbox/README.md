# Checkbox

14px 凹陷方框；选中后中心一块 6px 方块，框换亮中性底，符号弹进来。半选画 2px 横杠。可选 indicator="check"：一笔写出来的勾（改自 SmoothUI，MIT）。

## Provide

`*` marks a required prop.

### Checkbox

其余属性透传给 UI SDK Checkbox。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `indicator` | `'square' \| 'check'` | `'square'` | Mark inside the box: the default 6px square, or a tick (and dash when indeterminate) that draws itself with a stroke. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Checkbox } from '@katana-ui/react'

export function CheckboxUsage() {
  return <Checkbox aria-label="Confirm before ordering" defaultChecked />
}
```

## States

- 未勾、已勾、半选（indeterminate）、禁用、禁用已勾、错误（aria-invalid）。
- indicator="check"：勾的路径从头画到尾，半选画横杠。

## Don't

- 不要让勾选框单独承载状态而不带文字。
- 不要用勾选框做立刻生效的开关（那是 Switch），勾选框配「保存 / 应用」。
- 半选只给「部分子项已勾」的父项用，不要拿它表示「未知」。

## Composition

```
Checkbox
```

## Keyboard

- `Tab`：聚焦
- `Space`：翻转选中
