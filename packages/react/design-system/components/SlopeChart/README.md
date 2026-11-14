# SlopeChart

每项一条线连「前」「后」两列，看再平衡前后的权重、因子排名的变化。线按变化涂涨跌色（跟 data-updown 走），两侧写名字与数，标签互相不重叠；rank 模式纵轴是名次，涨跌看名次升降。悬停或聚焦一条，其余变暗。功能参照 Arc Slope chart，实现原创。

## Provide

### SlopeChart

文字全由 props 传：列头在 columns、每一项的整句在 describe 里。图是一个 role=group，每项一个带整句名的 role=img。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `SlopeItem[]` | — | { id, label, before, after }。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `columns` | `{ before: string; after: string }` | — | 两列的列头。 |
| `describe` | `(item, change) => string` | — | 一项的整句；change 在 value 模式是 after − before，rank 模式是名次升了几位。 |
| `mode` | `'value' \| 'rank'` | `'value'` | value：纵轴是数值，值大在上；rank：纵轴是名次，第 1 名在上、等距。 |
| `formatValue` | `(value: number) => string` | `String` | 两侧标签里的数怎么写。 |
| `height` | `number` | — | 图高（viewBox 单位）；默认按条数每条 18 高、至少 160。 |
| `onSelect` | `(item) => void` | — | 给了才可点（Enter 也触发）。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### slopeLayout(items, options) / spreadLabels(ys, gap, lo, hi) / ranks(values)

spreadLabels 让标签保持上下次序、相邻至少隔 gap、整体落在 [lo, hi] 里；装不下时均匀铺满。ranks 值大的排前、从 1 起、相同按输入顺序。

## States

- 涨：value 模式 after 大于 before，rank 模式名次升；跌相反；相等用中性色。
- 悬停或聚焦一条：其余变暗，这一条加粗并画在最上面，读数行写它的整句。
- 点挨得很近时线重叠，但标签被推开，各自对着自己的端点；端点旁的数仍是真值。

## Don't

- 不要放很多条（超过约二三十）：标签推开后离端点太远，读不出对应。
- 不要拿它画随时间的连续走势：那是折线图；斜率图只比两个时点。
- rank 模式下不要再把数值当纵轴理解：线的斜率只表示名次变化。

## Composition

```
SlopeChart
  svg role=group
    text（两个列头）
    g role=img（一项：命中线 · 线 · 两个端点 · 两侧标签）
    g aria-hidden（当前项的副本，画在最上）
  output（读数行）
```

## Keyboard

- `↑ / ↓`：焦点按左侧端点从上到下在项间移动，到头不绕回
- `Home / End`：跳到最上 / 最下一项
- `Enter`：给了 onSelect 时选中当前项
