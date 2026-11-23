# SwitchboardCard

一块小灯阵加标题与说明：灯按 lit 矩阵常亮，或按种子随机明灭（灭、中、亮三档，像交换机面板）。拿来做「市场活跃度」「在线品种」这类带装饰意味的总览卡。随机用带种子的线性同余，同一个种子同一串，可暂停。

## Provide

`*` marks a required prop.

### SwitchboardCard

给 onClick 整卡就是按钮（读屏名是 title）；不给就是静态卡。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` * | `string` | — | Heading of the card; also its accessible name when it is a button. |
| `subtitle` | `ReactNode` | — | One line under the heading. |
| `columns` | `number` | `18` | Lights per row. |
| `rows` | `number` | `5` | Number of rows of lights. |
| `lit` | `readonly number[] \| readonly (readonly number[])[]` | — | Lights that stay on: a flat array of columns × rows or a matrix of rows, 1 is on. |
| `random` | `boolean` | `false` | Let lights come and go by themselves instead (ignored when lit is given). |
| `seed` | `number` | `1` | Seed of the random lights; the same seed gives the same sequence. |
| `paused` | `boolean` | `false` | Freeze the random lights where they are. |
| `onClick` | `() => void` | — | Makes the whole card a button. |
| `className` | `string` | — | Extra class name on the card. |

### litIndexes

纯函数 (lit, columns, rows)：把一维或二维的 0/1 图案转成亮灯的序号。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SwitchboardCard } from '@katana-ui/react'

export function SwitchboardCardUsage() {
  return <SwitchboardCard title="Market activity" subtitle="1,204 of 5,312 symbols moving" random seed={7} />
}
```

## States

- lit 给定：图案常亮。
- random：每 200ms 让约 20% 的灯推进一档（灭、中、亮）。
- paused：随机的灯停在当下。

## Don't

- 不要拿灯阵读数：灯没有刻度，数要写在标题或说明里。
- 同一页别放超过两块随机的：同时闪会分散注意。

## Composition

```
SwitchboardCard
  button（有 onClick 时）
    div
      div（灯阵）
        span（一盏灯）
      h3
      p
```

## Keyboard

- `Enter / Space`：有 onClick 时点中整卡
