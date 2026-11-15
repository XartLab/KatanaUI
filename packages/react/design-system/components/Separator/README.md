# Separator

1px 的线，取 line 色（跟菜单里的分隔线一条白线）；默认只是装饰，读屏不报。

## Provide

`*` marks a required prop.

### Separator

其余属性透传给 Radix Separator.Root。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Separator } from '@katana-ui/react'

export function SeparatorUsage() {
  return (
    <div>
      <span>Above</span>
      <Separator />
      <span>Below</span>
    </div>
  )
}
```

## States

- 横：1px 高；竖：1px 宽，取 line 色。
- decorative 默认真，读屏不报；decorative=false 才是 separator。

## Don't

- 不要用它占位留白，用间距。
- 不要在读屏需要知道分组的地方用装饰分隔，改 decorative=false 或用分组标题。

## Composition

```
Separator
```
