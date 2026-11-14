# RangeHistogramSlider

一排柱子画出全体的分布，下面一条轨道两个把手：拖出来的区间里的柱子亮、区间外的暗。用在筛选器，在全市场分布上拖市值、涨幅、换手的区间。点柱子或轨道，最近的把手跳过去。功能参照 Arc Range histogram slider，实现原创。

## Provide

### RangeHistogramSlider

角色照 WAI-ARIA APG 的 Multi-Thumb Slider：两个 role=slider，各自带 aria-valuemin / max / now / valuetext；两个把手不交叉。值可受控也可不受控；文字全由 props 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `counts` | `number[]` | — | 每一箱的个数，等宽分箱铺满 [min, max]；用 histogramBins 算。 |
| `min / max` | `number` | — | 分布的范围。 |
| `step` | `number` | `(max - min) / 箱数` | 步长，拖动与键盘都取整到它。 |
| `value / defaultValue / onValueChange` | `[number, number]` | — | 当前区间；不给 value 就是不受控。 |
| `formatValue` | `(value: number) => string` | `String` | 数值怎么写（读数行与 aria-valuetext）。 |
| `labels` | `{ low: string; high: string }` | — | 两个把手的读屏名（必填）。 |
| `label` | `string` | — | 整条的读屏名（必填）。 |
| `describe` | `(range) => ReactNode` | — | 读数行；不给写「下限 – 上限」。 |

### histogramBins(values, min, max, bins)

把一列数分进等宽的箱，最后一箱含 max；范围外与非有限数丢掉。

## States

- 区间内的柱子用强调色，区间外的用暗色；区间那一段轨道也用强调色。
- 两个把手叠在一起时，按指针往哪边拖决定动哪个，不会互相夹死。
- 键盘聚焦的把手有焦点环。

## Don't

- 不要拿它选单个值：单值用 Slider。
- 不要把原始数据传进来：先用 histogramBins 分箱，箱数也别太多（柱子细到看不清就没有意义）。

## Composition

```
RangeHistogramSlider
  div role=group
    div（柱子，一箱一根）
    div（轨道与选中段）
    div role=slider × 2（把手）
  output（读数行）
```

## Keyboard

- `← / ↓`：当前把手减一个步长
- `→ / ↑`：当前把手加一个步长
- `PageDown / PageUp`：减 / 加十个步长
- `Home / End`：去最小 / 最大（不越过另一个把手）
