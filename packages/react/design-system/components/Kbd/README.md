# Kbd

把一个快捷键组合画成一串小方块：20 高、圆角 4、6% 白底 12% 白边。

## Provide

`*` marks a required prop.

### Kbd

怎么把「Mod+Shift+H」拆成块、Mod 在这个平台叫什么，是调用方的事。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `parts` * | `readonly string[]` | — | The text on each key cap. |
| `label` * | `string` | — | The whole shortcut as read by screen readers (required). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Kbd } from '@katana-ui/react'

export function KbdUsage() {
  return <Kbd parts={['Ctrl', 'Shift', 'H']} label="Ctrl+Shift+H" />
}
```

## States

- 一个组合画成一串小方块；单键与多键。
- 读屏读 label（整串，如「Ctrl+Shift+H」），不逐块读。

## Don't

- 不要把快捷键写成普通文字加方括号。
- 不要在件里拆「Mod」：平台上叫 Ctrl 还是 ⌘ 由调用方定好再传 parts。
- 不要拿它画可点的按钮：它只是标注，按键录入用 ShortcutRecorder。

## Composition

```
Kbd
```
