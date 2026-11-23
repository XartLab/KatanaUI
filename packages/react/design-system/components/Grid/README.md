# Grid

等宽格：每格至少 min 宽（默认 240，照 KATANAview 的「面板最小 240」），放得下几列就几列；最后一行不够也保持同宽。容器比一格还窄时一列、不溢出。什么时候用：一排题材卡、一组指标卡。预览里的框右下角能拖宽窄。

## Provide

`*` marks a required prop.

### Grid

其余属性透传给渲染出的元素。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `min` | `number` | `GRID_MIN` | Smallest width of a cell in pixels; as many columns as fit are used. |
| `gap` | `SpaceStep` | `'space-3'` | Gap between cells, a spacing step name. |
| `as` | `LayoutTag` | `'div'` | Element to render. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Grid } from '@katana-ui/react'

export function GridUsage() {
  return (
    <Grid min={240} gap="space-3">
      <div>卡 1</div>
      <div>卡 2</div>
      <div>卡 3</div>
    </Grid>
  )
}
```

## States

- 宽的时候多列，窄的时候少列，最窄一列。
- 格数不是列数的整数倍：最后一行靠左，格宽不变。

## Don't

- 不要拿它做表格：对齐靠列的是 DataGrid。
- 不要给格子写死宽度：宽度由 min 与容器定。

## Composition

```
Grid
  任意子节点（一个一格）
```
