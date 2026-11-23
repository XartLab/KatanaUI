# ThresholdGap

一只票一行：上面是 Meter 的条（累计偏离值的绝对值对阈值，阈值是硬限红线、预警线是琥珀细线，越线条跟着变色），名字后面跟偏离口径的小字；下面是档位标签（监控中 / 临近 / 已触发 / 监管期结束）与「差 0.04%」「超出 1.20%」，末尾可放一句备注（监管期到哪天）。功能参照开盘啦「异动提醒」：列表显示离阈值差多少、已触发、监管期结束分开标。阈值与预警线是交易所规则与调用方的口径，包里不带；偏离值由调用方算好（百分点，可正可负，按绝对值比）。

## Provide

`*` marks a required prop.

### ThresholdGap

渲染一个 div：Meter（role=meter）加底行。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `ReactNode` | — | Name of the stock (a node, often name plus code). |
| `value` * | `number \| null` | — | Cumulative price deviation over the rule's window in percentage points, signed; null when not available. |
| `threshold` * | `number` | — | The trigger threshold in percentage points (positive), compared with the absolute deviation. |
| `warnAt` | `number` | — | Warning line in percentage points; reaching it reads as near. |
| `ended` | `boolean` | `false` | The supervision period has ended (the caller knows the dates). |
| `period` | `ReactNode` | — | Which window the deviation covers, such as "3-day deviation"; written after the name. |
| `note` | `ReactNode` | — | A short note at the end of the bottom line, such as the end of the supervision period. |
| `labels` | `ThresholdGapLabels` | `cnLabelsZh.thresholdGap` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### thresholdGap(value, threshold)

纯函数：阈值 − |偏离值|；正数是还差，负数是超出。排序用它。

### thresholdState(value, threshold, warnAt, ended)

纯函数：档位；偏离值取不到返回 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ThresholdGap } from '@katana-ui/react/cn'

export function ThresholdGapUsage() {
  return <ThresholdGap label="Example Tech" value={19.96} threshold={20} warnAt={16} period="3-day deviation" />
}
```

## States

- 监控中：条是中性灰，写「差 x%」。
- 临近（达到预警线）：条与「差 x%」转琥珀，标签「临近」。
- 已触发（达到阈值）：条转红，写「超出 x%」。
- 监管期结束（ended）：不再按线变色，阈值只留一根刻度，标签描边。
- 偏离值取不到：写「暂无数据」，不出档位标签。

## Don't

- 不要在包里写死阈值：各板块规则不同，由调用方传。
- 不要用它显示涨跌幅本身：它只说离规则阈值还差多少。

## Composition

```
ThresholdGap
  Meter（名字 · 偏离口径 · 偏离值，阈值红线 · 预警线）
  底行（档位 Tag · 差 x% / 超出 x% · 备注）
```
