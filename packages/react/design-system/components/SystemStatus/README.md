# SystemStatus

贴在应用顶上、占满宽的系统消息：维护、断线重连、数据延迟、新功能。最低 36 高，语气色 10% 叠在实底上、底下 1px 语气色的边；图标、可选的粗体标题、一两行字、末尾动作、可选的关闭钮。照 Salt SystemStatus（Apache-2.0，只取结构）。

## Provide

`*` marks a required prop.

### SystemStatus

其余属性透传给 div；children 是消息正文。给了 onDismiss 必须给 dismissLabel。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tone` | `SystemStatusTone` | `'info'` | info (default), neutral, ok, warn or danger: the color of the bar and the shape of its icon. |
| `title` | `ReactNode` | — | A short bold lead before the message, for example "Scheduled maintenance". |
| `actions` | `ReactNode` | — | Buttons or links at the end of the bar (a small Button, a Link). |
| `icon` | `ReactNode` | — | Replace the tone's icon; pass null for no icon. |
| `onDismiss` | `() => void` | — | Given: a close button at the right end calls it. |
| `dismissLabel` | `string` | — | Accessible name of the close button; required with onDismiss (the package ships no text). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, SystemStatus } from '@katana-ui/react'

export function SystemStatusUsage() {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <SystemStatus
      tone="warn"
      title="Delayed data"
      actions={<Button size="sm">Details</Button>}
      onDismiss={() => setOpen(false)}
      dismissLabel="Dismiss"
    >
      HK quotes are delayed by 15 minutes.
    </SystemStatus>
  )
}
```

## States

- tone：info（默认，蓝）、ok、warn、danger、neutral；图标形状各不同（信息 i、对勾、三角感叹、八角感叹，neutral 同 info），不只靠颜色。
- role 默认按语气：warn、danger 是 alert，其余是 status；页面一打开就在的传 role="note"。
- 底是语气色叠在 container-primary 的实底上：吸顶时下面的内容不会透上来。
- 有动作时动作靠右；容器窄到放不下时动作换到下一行仍靠右，关闭钮固定在右上。
- icon={null} 不画图标；传别的节点换掉默认图标。

## Don't

- 只管全站的事：跟当前任务有关的提示用 Alert，要打断操作的用 Dialog，一次性的结果用 Toast。
- 一屏只放一条：多条同时来时由调用方挑最要紧的一条，其余收进通知中心。
- 不要放长段落：一两行字，详情放进动作里的链接。
- 关掉以后要不要再出现，是调用方记、调用方定；件不记。

## Composition

```
SystemStatus（div）
  图标（span，aria-hidden）
  内容
    标题（strong，可选）
    正文
  动作（div，可选）
  关闭（button，有 onDismiss 时）
```

## Keyboard

- `Tab`：走到动作与关闭钮
