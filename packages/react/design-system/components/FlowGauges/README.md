# FlowGauges

订单流四个仪表一行：Market Pressure、Price Change（零轴居中，−100…+100）、DOM Pressure（前 N 档买卖挂单柱）、Delta Divergence（多周期 LED 矩阵）；只收算好的数，窗口不足写 N/A。

## Provide

`*` marks a required prop.

### FlowGauges

口径（窗口、逐笔方向、档位怎么算）不在包里，由调用方（应用的 Worker）算好传入。一屏最多放一行（仪器预算）。不做声音、不做闪烁。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gauges` | `readonly FlowGaugeData[]` | — | 每格一个，kind 是 pressure \| priceChange \| dom \| divergence。 |
| `label` | `string` | — | 整行的读屏名。 |
| `labels` | `{ na?, estimate? }` | — | 没有数的位置写什么（默认 'N/A'）、估算标记的字（默认 'est.'）；旧名 naText / estimateText 留一个版本。 |

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
| `rows` | `{ window, cells, summary }[]` | — | cells 是 off \| on \| ok \| warn 的一行 LED；null 是 N/A（数据不足）；summary 是读屏整句。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FlowGauges, type FlowGaugeData } from '@katana-ui/react/blocks'

const flowGauges: readonly FlowGaugeData[] = [
  {
    kind: 'pressure',
    id: 'mp',
    title: 'MARKET PRESSURE · 1m',
    value: 62,
    valueText: '+62',
    note: '买方 · 近 60s 逐笔',
  },
  { kind: 'priceChange', id: 'pc', title: 'PRICE CHANGE · 5m', value: -18, valueText: '−18', note: '−100 … +100' },
  {
    kind: 'dom',
    id: 'dom',
    title: 'DOM PRESSURE · 10 档',
    bids: [60, 80, 100, 70],
    asks: [40, 30, 50, 20],
    summary: '前 10 档：买盘 71%，卖盘 29%',
    note: 'Bid 71% · Ask 29%',
  },
  {
    kind: 'divergence',
    id: 'dd',
    title: 'DELTA DIVERGENCE',
    rows: [
      { window: '5s', cells: ['off', 'off', 'ok', 'ok', 'on', 'on'], summary: '近期两格同向，其余无背离' },
      { window: '1m', cells: ['off', 'ok', 'ok', 'ok', 'ok', 'warn'], summary: '末格背离预警' },
      { window: '5m', cells: ['off', 'off', 'off', 'ok', 'ok', 'ok'], summary: '近三格同向' },
      { window: '20m', cells: null, summary: '数据不足' },
    ],
    note: '20m · N/A（数据不足）',
  },
]

export function FlowGaugesUsage() {
  return (
    <>
      <div style={{ width: 620 }}>
        <FlowGauges label="订单流仪表" gauges={flowGauges} />
      </div>

      <div style={{ width: 620 }}>
        <FlowGauges
          label="订单流仪表（缺数据）"
          gauges={[
            {
              kind: 'pressure',
              id: 'mp',
              title: 'MARKET PRESSURE · 1m',
              value: null,
              valueText: '',
              note: '窗口不足',
            },
            {
              kind: 'priceChange',
              id: 'pc',
              title: 'PRICE CHANGE · 5m',
              value: 24,
              valueText: '+24',
              estimated: true,
              note: '无逐笔方向',
            },
          ]}
          labels={{ estimate: '估算' }}
        />
      </div>
    </>
  )
}
```

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
