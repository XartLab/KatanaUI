# LimitStatus

封板 / 炸板 / 回封 / 跌停 / 一字 / 竞价涨停六种状态胶囊，涨停一族可带封单额（按万 / 亿写）。状态不只靠颜色，字就是状态名；色调：涨停涨色（跟 data-updown）、炸板警示、跌停跌色。也是 DataGrid 的列类型 limitStatus，可按状态排序。

## Provide

`*` marks a required prop.

### LimitStatus

渲染一个 span，不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` * | `LimitStatusValue \| null \| undefined` | — | The status key, or an object with the seal amount (yuan) and a reason; null status means unavailable. |
| `labels` | `LimitStatusLabels` | `cnLabelsZh.limitStatus` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### LimitStatusValue

状态名，或 { status, sealAmount?, reason? }；status 为 null 是取不到。

### limitStatusText(status, labels)

屏幕上的字：「封板」「封板 3.20亿」；取不到「—」。

### limitStatusTone(status)

up / warn / down。

### normalizeLimitStatus(status)

规整成 { status, sealAmount, reason }；炸板不带封单额。

### LIMIT_STATUS_ORDER

排序次序：竞价涨停、一字、封板、回封、炸板、跌停。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { LimitStatus } from '@katana-ui/react/cn'

export function LimitStatusUsage() {
  return (
    <>
      <LimitStatus status="broken" />
      <LimitStatus status={{ status: 'sealed', sealAmount: 3.2e8 }} />
    </>
  )
}
```

## States

- 涨停一族（封板、回封、一字、竞价涨停）：涨色淡底；炸板：警示色；跌停：跌色。
- 带封单额：字后接「3.20亿」，悬停写「封单 3.20亿」；炸板不带封单额。
- 取不到：写「—」，悬停写 reason。

## Don't

- 不要只靠颜色区分状态：胶囊里的字就是状态名。
- 不要给炸板传封单额：件会忽略。

## Composition

```
LimitStatus
  状态名
  封单额（可选）
```
