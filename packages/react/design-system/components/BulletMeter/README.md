# BulletMeter

限额板用的横向仪表：一根条是已用，底上三段是正常、接近、越限，两根刻度是软限与硬限，右上角写已用与状态词。对设计稿的 Meter 卡。功能参照 Arc 的 Budget variance。

## Provide

### BulletMeter

角色是 meter。状态按「达到」算：已用 ≥ 软限是接近，≥ 硬限是越限。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `number` | — | 已用。 |
| `max` | `number` | — | 满刻度；不给取已用、软限、硬限里最大的（不加余量）。超出的条画满。 |
| `soft / hard` | `number` | — | 软限与硬限；都可以不给（没给的那根刻度与那一段底不画）。 |
| `label` | `string` | — | 量的是什么：左上角的字，也是读屏名。 |
| `valueText` | `string` | — | 读屏整句（已用、软限、硬限怎么说），调用方按界面语言写。 |
| `formatValue` | `(value: number) => string` | — | 右上角已用写成什么字。 |
| `stateLabels` | `{ ok?, warn?, breach? }` | — | 三种状态的词，写在已用后面；不给就不写。 |
| `tickLabels` | `{ soft?, hard? }` | — | 刻度下面的小字；不给就不写。 |

## States

- 正常：条用中性色，底上只有一段。
- 接近（已用 ≥ 软限）：条与状态词换成琥珀色。
- 越限（已用 ≥ 硬限）：条与状态词换成红色，超出满刻度的画满。
- 没给软限或硬限：对应那根刻度与那一段底不画，状态只按给了的算。

## Don't

- 不要只靠颜色表示状态：给 stateLabels，或让 valueText 带上状态。
- 不要在包里决定软限、硬限是多少：限额由风控设置传进来。
- 不要拿它当进度条：进度（不分档）用 Progress，带档位词的用 GaugeBar。

## Composition

```
BulletMeter
  标题行（label · 已用 · 状态词）
  div[role=meter]（三段底 · 已用条 · 软限刻度 · 硬限刻度）
  刻度小字
```
