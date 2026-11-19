# CountBadge

贴在任何元素角上的角标：点、数字、状态点三种；数字变了按增减方向上下滚，0 时淡出，超过上限写「99+」；可选向外扩散的一圈。与 NotificationBell 的分工：铃是「铃 + 未读数」一个整件，CountBadge 是通用的、贴在头像、标签页、图标按钮上的那一颗。

## Provide

`*` marks a required prop.

### CountBadge

label 必填且要带数字（「3 条未读」），变了会播报；不给 children 就只画角标。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The thing the badge sits on; omit to draw the badge alone. |
| `variant` | `'dot' \| 'count' \| 'status'` | `'dot'` | dot is a plain dot, count shows the number, status shows a coloured dot. |
| `count` | `number` | `0` | The number for the count variant; 0 hides the badge unless showZero. |
| `max` | `number` | `99` | Highest number written in full; above it the badge reads "<max>+". |
| `showZero` | `boolean` | `false` | Keep the badge on screen when the count is 0. |
| `status` | `CountBadgeStatus` | `'online'` | Which colour the status variant uses. |
| `ping` | `boolean` | `false` | Send an expanding ring out of the badge to draw the eye. |
| `position` | `CountBadgePosition` | `'top-right'` | Which corner of the children the badge sits on. |
| `label` * | `string` | — | Accessible name of the badge, for example "3 unread alerts"; required when the badge carries meaning. |
| `className` | `string` | — | Extra class name on the badge. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Bell } from 'lucide-react'
import { CountBadge } from '@katana-ui/react'

export function CountBadgeUsage() {
  return (
    <CountBadge variant="count" count={7} label="7 unread alerts">
      <Bell aria-hidden="true" />
    </CountBadge>
  )
}
```

## States

- count：数字，0 时淡出（showZero 保留）；增减时数字上下滚。
- dot：纯点，ping 时外扩一圈。
- status：online 绿、away 琥珀、busy 红、offline 灰，带底色描边。

## Don't

- 不要只用颜色传状态：label 里写出状态词。
- 不要在同一个元素上叠两颗角标。

## Composition

```
CountBadge
  span
    children
    motion.span（role=status）
      span（数字）
      span（ping）
```
