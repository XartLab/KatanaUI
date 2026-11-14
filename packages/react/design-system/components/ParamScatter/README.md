# ParamScatter

参数扫描的结果图：两个参数为横纵轴，一个点是一组参数，颜色是目标值（夏普、净利润……），点选看这组参数的读数，最优点加琥珀环并有「跳到最优」。颜色：目标值跨过 0 用涨跌发散阶（中灰为中点，负跌色、正涨色），否则用暗灰到亮灰的单色阶，都不用橙与蓝。没有结果的点（如约束不成立）画空心灰点。TradingView 没有这张图，照通用的参数扫描做法；数据是固定种子合成的演示数据。

## Provide

### ParamScatter

文字全由 props 传。每个点是 role=button 的圆，读屏名是整句（两个参数、目标值，最优再加一句）；图右上有表格视图、导出、全屏三件（表格视图总有）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | `ParamPoint[]` | — | { id, x, y, value }；value 是目标值，没跑出结果传 null。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `axes` | `{ x: string; y: string }` | — | 两个参数的名字。 |
| `valueName` | `string` | — | 目标值叫什么（色条、读数）。 |
| `formatX / formatY / formatValue` | `(value: number) => string` | `String` | 刻度与读数怎么写。 |
| `goal` | `'max' \| 'min'` | `max` | 目标值越大越好还是越小越好，决定哪个点是最优。 |
| `ramp` | `'auto' \| 'sequential' \| 'diverging'` | `auto` | 色阶；auto 在目标值跨过 0 时用发散阶。 |
| `bestLabel / jumpLabel / noValue / idle` | `string \| ReactNode` | — | 「最优」「跳到最优」「没有结果」与没选点时读数区的字。 |
| `selected / onSelect` | `string \| null` | — | 选中点的 id；不给 selected 用内部状态。 |
| `extra` | `(point) => ReactNode` | — | 选中后读数里多加什么（这组参数的其他指标）。 |
| `actionLabels / tableLabel / tableHead / source / onExport / onFullscreen` | `ChartViewProps` | — | 同其他图：三个图工具的名字、表格视图的读屏名与表头、来源一行、导出与全屏的回调。 |

## States

- 点按目标值着色；最优点琥珀环，选中点白环加粗，悬停与聚焦描白边。
- 点选后读数区写两个参数与目标值；选中的就是最优时再标「最优」。
- 没有选点时读数区写 idle；没有有效的目标值时不画色条。

## Don't

- 不要只靠颜色分高低：读数区与表格视图里都有数。
- 不要把它当时间序列用：连线与时间顺序用 ConnectedScatter。
- 不要超过几千个点：每个点是一个 SVG 圆，更多的点请先在调用方聚合。

## Composition

```
ParamScatter
  图右上三件（表格视图 · 导出 · 全屏）
  svg role=group
    g（刻度线与轴名）
    circle role=button × 点
  色条（目标值名 · 最小值 · 渐变 · 最大值）
  output（选中点的读数）
  「跳到最优」按钮
```

## Keyboard

- `Tab`：进图，停在一个点上
- `方向键`：到该方向最近的点
- `Home / End`：到最左 / 最右的点
- `Enter / 空格`：选中当前点
- `Esc`：取消选中
