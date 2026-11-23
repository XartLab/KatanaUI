# Cluster

横排，放不下就换行，行与行、块与块用同一个间距。align 管同一行里上下对齐（居中、基线……），justify 管左右分布（靠左、居中、靠右、两端）。什么时候用：一排标签、一排按钮、一排筛选芯片、标题加读数。只管位置与间距。

## Provide

`*` marks a required prop.

### Cluster

其余属性透传给渲染出的元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gap` | `SpaceStep` | `'space-3'` | Gap between children, both across and down, a spacing step name. |
| `align` | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'` | `'center'` | Cross-axis alignment of the children in a row. |
| `justify` | `'start' \| 'center' \| 'end' \| 'between'` | `'start'` | Main-axis distribution of the children in a row. |
| `as` | `LayoutTag` | `'div'` | Element to render. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Cluster } from '@katana-ui/react'

export function ClusterUsage() {
  return (
    <Cluster gap="space-2" justify="between">
      <span>涨停</span>
      <span>连板</span>
      <span>龙头</span>
    </Cluster>
  )
}
```

## States

- 默认：间距 space-3，纵向居中，靠左。
- justify 为 between 时首尾贴边、中间均分（两个子节点就是左右各一个）。

## Don't

- 不要用它做整页的栅格：等宽的格用 Grid。
- 不要给它加边框或底色。

## Composition

```
Cluster
  任意子节点
```
