# FlowGauges

订单流四个仪表一行：Market Pressure、Price Change（零轴居中，−100…+100）、DOM Pressure（前 N 档买卖挂单柱）、Delta Divergence（多周期 LED 矩阵）；只收算好的数，窗口不足写 N/A。

## Provide

### FlowGauges

口径（窗口、逐笔方向、档位怎么算）不在包里，由调用方（应用的 Worker）算好传入。一屏最多放一行（仪器预算）。不做声音、不做闪烁。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gauges` | `readonly FlowGaugeData[]` | — | 每格一个，kind 是 pressure | priceChange | dom | divergence。 |
| `label` | `string` | — | 整行的读屏名。 |
| `naText` | `string` | `'N/A'` | 没有数的位置写什么。 |
| `estimateText` | `string` | `'est.'` | 估算标记的字。 |

### pressure / priceChange 格

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `number \| null` | — | −100 到 +100；窗口不足传 null，不填零。 |
| `valueText` | `string` | — | 已格式化的带符号数。 |
| `estimated` | `boolean` | — | 无逐笔方向、数是估的：灰显并标估算。 |
| `title / note` | `string / ReactNode` | — | 点阵小标题（含周期）与一行说明。 |

### dom 格

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bids / asks` | `readonly number[]` | — | 各档的量，从最优价往外；两边都空是 N/A。 |
| `summary` | `string` | — | 读屏用的整句，柱子本身对读屏是空的。 |

### divergence 格

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `{ window, cells, summary }[]` | — | cells 是 off | on | ok | warn 的一行 LED；null 是 N/A（数据不足）；summary 是读屏整句。 |

## States

- 正常：压力条从中线往右（series-1）或往左（series-2），数字带符号。
- 窗口不足：写 N/A，条不画，不填零。
- 估算：数与条灰显，旁边写估算字。
- 压力不是盈亏：不用涨跌色，data-updown 对它不起作用。

## Don't

- 不要把算法放进组件，传算好的数。
- 窗口不足不要传 0。
- 不要加声音或闪烁；告警走告警中心。
- 一屏不要放两行。

## Composition

```
FlowGauges
  每格 section（点阵标题、读数、一行说明）
```
