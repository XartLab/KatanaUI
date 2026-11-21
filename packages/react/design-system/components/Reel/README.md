# Reel

一行横向滚动：子节点不缩、不换行，放不下就滚。滚动条照 KATANAview 已定的 4px、平时不可见，悬停或键盘聚焦时才显出来。自己是可聚焦的滚动区（方向键能滚），所以要用 aria-label 给它一个名字。什么时候用：一排题材卡、一排报价卡。预览里的框右下角能拖宽窄。

## Provide

`*` marks a required prop.

### Reel

其余属性透传给渲染出的元素；tabIndex 默认 0。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gap` | `SpaceStep` | `'space-2'` | Gap between children, a spacing step name. |
| `as` | `LayoutTag` | `'div'` | Element to render. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Reel } from '@katana-ui/react'

export function ReelUsage() {
  return (
    <Reel aria-label="题材卡" gap="space-2">
      <div style={{ width: 120 }}>锂电</div>
      <div style={{ width: 120 }}>光伏</div>
      <div style={{ width: 120 }}>算力</div>
    </Reel>
  )
}
```

## States

- 放得下：不滚，没有滚动条。
- 放不下：横向滚动，滚动条 4px，悬停或聚焦才显出。
- 焦点：键盘聚焦时画焦点环，方向键滚动。

## Don't

- 不要给它写死高度去裁内容。
- 不要嵌套横向滚动：里面再放一个 Reel 滚不动。

## Composition

```
Reel
  任意子节点（每个不缩）
```

## Keyboard

- `Tab`：聚焦滚动区，画焦点环
- `← →`：横向滚动
