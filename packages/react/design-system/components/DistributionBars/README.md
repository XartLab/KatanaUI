# DistributionBars

把一批品种按涨跌幅分成 9 或 11 档（跌停…涨停），每档一根柱，柱顶标家数，底部一行汇总（涨 x / 平 y / 跌 z）。档的边界、档名与汇总的名字都由调用方传，件只按家数画柱、按色调汇总；没有数据显示空态，不画样本。

## Provide

`*` marks a required prop.

### DistributionBars

示例数据写死在页里，不是行情。柱高按最大档归一，有家数的至少 1px。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bins` * | `readonly DistributionBin[]` | — | The bins in display order (9 or 11 are typical); edges and names are the caller's. |
| `label` * | `string` | — | Screen-reader name of the whole chart (a full sentence). |
| `totals` | `DistributionTotals` | — | Names for the totals line (up / muted / down); the numbers are the counts summed by tone. |
| `formatCount` | `(count: number) => string` | `defaultFormat` | How a count is written; thousands separators by default. |
| `empty` | `ReactNode` | `'—'` | Text shown when there is no data; a dash by default. |
| `height` | `number` | `96` | Height of the bar area in px, including the count row; 96 by default. |
| `className` | `string` | — | Extra class names on the root. |

### distributionTotals

纯函数：各色调（up / muted / down）的家数之和，汇总行用它。

### distributionBarHeight

纯函数：柱高（px），按最大档归一并扣掉柱顶那一行。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DistributionBars } from '@katana-ui/react/quant'

export function DistributionBarsUsage() {
  return (
    <DistributionBars
      label="Change distribution"
      bins={[
        { key: 'a', label: '-5%', count: 320, tone: 'down' },
        { key: 'b', label: '0', count: 90, tone: 'muted' },
        { key: 'c', label: '+5%', count: 540, tone: 'up' },
      ]}
      totals={{ up: 'Up', muted: 'Flat', down: 'Down' }}
    />
  )
}
```

## States

- 有数据：每档一列，柱色跟档的色调（up / down / muted / accent），柱顶是家数。
- 某档没有数（count 为 null）：不画柱，柱顶写「—」。
- 汇总：给了 totals 才有，按 up / muted / down 的次序，没写名字的项不出现。
- 没有数据（空数组或全是 null）：只写 empty 的字，不画样本。

## Don't

- 不要给柱传色值：只选色调名。
- 不要在包里写档名或汇总的字：都由调用方传。
- 不要用它画连续分布（直方图拖区间用 RangeHistogramSlider）：它画的是已经分好档的家数。

## Composition

```
DistributionBars
  柱区（每档：家数 + 柱）
  档名行
  汇总行
```
