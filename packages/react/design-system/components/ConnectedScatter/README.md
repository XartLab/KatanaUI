# ConnectedScatter

每个点是一个时刻的 (x, y)，按时间顺序连成轨迹，看一个对象在两个量之间怎么走（如策略的波动 vs 收益按月的路径、风格漂移）。时间方向不单靠颜色：起点空心圈、终点强调色实心圈加箭头、中间的点按时间取 seq 色阶（越晚越亮）。多条轨迹各取 series 色板的一个色。功能参照 Arc Connected scatter，实现原创。

## Provide

### ConnectedScatter

文字全由 props 传：每个点的整句在 point.label 里，轴名在 axes。图是一个 role=group，每条轨迹一个 role=group，每个点一个带整句名的 role=img。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `series` | `ScatterSeries[]` | — | { id, label, points: { x, y, label }[] }；点按时间从早到晚排。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `axes` | `{ x: string; y: string }` | — | 两根轴的名字。 |
| `formatX / formatY` | `(value: number) => string` | `String` | 刻度怎么写。 |
| `xDomain / yDomain` | `[number, number]` | — | 轴范围；不给取全体数据放宽 5%。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### scatterLayout(series, frame, options)

点到像素的纯函数：返回刻度位置、每个点的像素坐标与终点箭头的三个顶点。

## States

- 起点空心圈、中间小点、终点大实心圈加箭头；中间的点取 seq-200 到 seq-600（按时间分档），终点用强调色加辉光。
- 悬停或聚焦一个点：该点描白边，别的轨迹变暗，读数行写这个点的整句。
- 单点的轨迹只画一个点，没有连线与箭头。

## Don't

- 不要在没有时间顺序的数据上用它：连线表示先后。
- 不要放太多条轨迹（超过七条色板就循环、颜色重复）：轨迹交叠时看不清。
- 不要只靠颜色认哪条是哪条：图例与每个点的整句里都写了名字。

## Composition

```
ConnectedScatter
  svg role=group
    g（刻度线与轴名）
    g role=group（一条轨迹：折线 · 终点箭头 · 各点 circle role=img）
  ul（图例）
  output（读数行）
```

## Keyboard

- `← / →`：沿时间在同一条轨迹的点上走，到头不绕回
- `↑ / ↓`：去上一条 / 下一条轨迹的同一位置（不够长落在最后一个点）
- `Home / End`：去这条轨迹的第一个 / 最后一个点
