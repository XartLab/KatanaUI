# NotificationBell

带未读数的铃：数变多时铃从顶端摆一下，角标弹出，数字按增减方向滚；0 时角标收起。学自 rare-ui。

## Provide

`*` marks a required prop.

### NotificationBell

其余属性透传给 button。角标对读屏隐藏，数变了由名字（label）播报。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | `0` | Unread count; a non-finite number counts as 0. |
| `max` | `number` | `99` | Highest number the badge shows; above it writes "<max>+". |
| `variant` | `'count' \| 'dot'` | `'count'` | count draws the number, dot draws only a dot. |
| `label` * | `string` | — | Accessible name (required); include the unread count, for example "Alerts, 3 unread", and change the string when the count changes. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { NotificationBell } from '@katana-ui/react'

export function NotificationBellUsage() {
  return <NotificationBell count={3} label="Alerts, 3 unread" />
}
```

## States

- 0：角标收起。
- 有未读：角标弹出，数字按增减方向滚。
- 数变多：铃从顶端摆一下。

## Don't

- 铃是图标，label 必须传（读屏名字），而且要带未读数：数变了就换这个字符串。
- 不要拿角标数表示别的量（价格、进度）：它只表示未读条数，超过 max 写「99+」。
- 不需要数字的场合用 variant=dot，不要传 1 假装。

## Composition

```
NotificationBell
  svg（铃，转轴在上）
  span（角标）
  span（role=status 播报）
```

## Keyboard

- `Enter / Space`：点击（按钮）
