# Progress

4 高的细条，填充走 snappy 弹簧滑到新位置；不知道进度（不给 value）是一块来回滑的不确定条。

## Provide

`*` marks a required prop.

### Progress

其余属性透传给 Radix Progress.Root。读屏要一个名字：传 aria-label。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `Severity \| 'default' \| null` | — | Fill color: neutral (default), ok, warn or danger. |
| `value` | `number \| null` | — | From 0 to max; omitted or null is the indeterminate state. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Progress } from '@katana-ui/react'

export function ProgressUsage() {
  return <Progress aria-label="Import progress" value={60} />
}
```

## States

- 确定：按 value 填充，aria-valuenow 跟值。
- 不确定：value 缺省，来回滑动的条，不带 aria-valuenow。
- tone（Severity）：neutral（默认，亮中性）、ok、warn、danger 换填充颜色；旧名 default 等于 neutral。

## Don't

- 不要在不知道进度时传一个假的 value。
- 不要用它表示库存或额度的满格，用 Meter。
- 不要省掉可访问名。

## Composition

```
Progress
  （内部：Progress.Indicator）
```
