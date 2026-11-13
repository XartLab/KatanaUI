# Treemap

一格一项，面积按大小，颜色按涨跌分七档（跟涨跌配色走），格子够大才写名字和数；点组头下钻，底部是色例。排布用 d3-hierarchy 的 squarify。从应用的分析视图提来。

## Provide

### Treemap

排布由调用方先用 layoutTreemap 算好再传 blocks；工具条（下拉、返回钮）从 toolbar 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blocks` | `TreemapBlock<T>[]` | — | layoutTreemap 的结果。 |
| `heads` | `boolean` | `false` | 画组头（可点下钻）；下钻之后传 false。 |
| `describe` | `(data: T) => { name, text, change }` | — | 一格上写的名字与数，change 是颜色用的涨跌数（小数，null 是没有数）。 |
| `limit` | `number` | `0.03` | 色例两端是多少（小数）：涨跌幅按 ±limit 切成 −3 到 +3 七档。 |
| `legendText` | `(step: number) => string` | — | 色例上每一档写的字。 |
| `toolbar` | `ReactNode` | — | 格子上面一行。 |
| `onGroup / onItem` | `function` | — | 点组头、点格子（给了 onItem 格子才是可聚焦的按钮，回车触发）。 |
| `classes` | `TreemapClasses` | — | 各部位额外的类名。 |

### layoutTreemap(items, grouped)

items 是 { data, size, group }；size 不是正数的项不画；grouped 为 false 整张一块。colorStep(change, limit) 返回 −3 到 3 或 null。

## States

- 默认：一格一项，面积按大小，颜色七档。
- 分组下钻：点组头只剩那一组，工具条里自己放返回钮。
- 格子太小时只留色块，不写字。
- 没有涨跌数的格子用中性色。

## Don't

- 不要用于项目数很多又没法下钻的场景，小格会糊成一片。
- 不要把排布放进渲染里重算：先用 layoutTreemap 排好再传 blocks。

## Composition

```
Treemap
  div（工具条）
  div（画布）
    div（一组）
      button（组头）
      div（一格：名字 · 数）
  ol（色例，七档）
```

## Keyboard

- `Tab`：到可点的格子与组头
- `Enter`：点开格子（组头是原生按钮，Enter / Space 都行）
