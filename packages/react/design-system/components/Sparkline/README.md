# Sparkline

一列数从旧到新，整宽铺开、上下按这列的高低，一根线。线色按头尾涨跌（涨跌色跟涨跌配色走），没有数据只留「—」。从应用的分析视图提来。

## Provide

`*` marks a required prop.

### Sparkline

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` * | `readonly number[]` | — | The values from oldest to newest; fewer than two draws a dash. |
| `label` * | `string` | — | Accessible name as a whole sentence, including how "no data" is said; written by the caller in the UI language (required). |
| `tone` | `QuoteTone` | — | Color tone; follows the first-to-last change when omitted. |
| `className` | `string` | — | Extra class name on the svg, written before is-<tone>. |
| `emptyClassName` | `string` | — | Extra class name on the dash shown when there is no data. |

### 纯函数

sparkPoints(values, width, height) 给 polyline 的点；sparkTone(values) 取头尾三态；quoteTone(change) 由一个涨跌数取三态（报价类的件共用）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Sparkline } from '@katana-ui/react'

export function SparklineUsage() {
  return <Sparkline values={[10, 10.4, 10.2, 11, 11.8]} label="Price trend, up" />
}
```

## States

- 有数据：一根折线，线色按头尾涨跌（涨、跌、平）。
- 没有数据（少于两个数）：只留「—」，读屏名说清没有数据。

## Don't

- 不要在折线上读具体数值：它只表达走势，要数请配价格文字。
- 不要把读屏名写死在包里，由调用方按界面语言传。

## Composition

```
Sparkline
  svg role=img
    polyline（vector-effect: non-scaling-stroke，线宽不随拉伸变）
```
