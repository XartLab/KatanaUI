# Stack

竖排：子节点自上而下，之间留同一个间距。间距只收间距刻度名（space-1、space-3 …），不收数字。只管位置与间距，不画边框、不带底色。模式借自 Every Layout 的 Stack，代码自己写。什么时候用：一个面板里的几块、表单的几行、一列读数。

## Provide

`*` marks a required prop.

### Stack

其余属性（className、style、aria-*）透传给渲染出的元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gap` | `SpaceStep` | `'space-3'` | Gap between children, a spacing step name. |
| `as` | `LayoutTag` | `'div'` | Element to render. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Stack } from '@katana-ui/react'

export function StackUsage() {
  return (
    <Stack gap="space-3">
      <span>名称</span>
      <span>读数</span>
      <span>说明</span>
    </Stack>
  )
}
```

## States

- 默认：间距 space-3（12px）。
- as 换成 ul、ol、section 等语义元素。

## Don't

- 不要给它加边框或底色：它只管位置与间距。
- 不要传数字间距：只收刻度名。

## Composition

```
Stack
  任意子节点
```
