# RichPopover

点触发器弹出的一张小卡：标题（可带外链）、一段说明、一枚元信息小标和一个主动作，带小尖角；入场是模糊加缩放一起收敛。品种悬停预览用 HoverCard，需要带动作、要点开的用它。

## Provide

`*` marks a required prop.

### RichPopover

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trigger` * | `ReactNode` | — | The element that opens the popover (rendered as the trigger itself). |
| `title` * | `string` | — | Heading of the card. |
| `href` | `string` | — | Makes the title an external link. |
| `hrefLabel` | `string` | — | Spoken name of the external-link mark (required with href). |
| `icon` | `ReactNode` | — | Icon in front of the title. |
| `description` | `ReactNode` | — | The paragraph under the heading. |
| `meta` | `ReactNode` | — | A small chip at the bottom left, e.g. |
| `actionLabel` | `string` | — | Label of the primary action; leave it out for no action. |
| `actionIcon` | `ReactNode` | — | Icon in front of the action label. |
| `onAction` | `() => void` | — | Called when the primary action is pressed. |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Which side of the trigger it opens on. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | How it aligns to the trigger. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Button, RichPopover } from '@katana-ui/react'

export function RichPopoverUsage() {
  return (
    <RichPopover
      trigger={<Button>NVDA</Button>}
      title="NVIDIA Corp"
      description="Data-centre revenue guides the sector; earnings are due after the close."
      meta="Earnings 16:05"
      actionLabel="Open chart"
    />
  )
}
```

## States

- 关闭：只有触发器。
- 打开：卡从触发处收敛进场，指向触发器的尖角。
- 没有 actionLabel：不画主动作；没有 meta：左边留空。

## Don't

- 不要放表单：它是预览卡加一个动作。
- 不要用它代替 Tooltip：一句话的提示用 Tooltip。
- 不要放需要读屏读到的唯一信息：重要信息在页面里另有一份。

## Composition

```
RichPopover
  Radix Popover.Root
    Popover.Trigger（你的元素）
    Popover.Content
      标题 · 说明 · meta · Button
      Popover.Arrow
```

## Keyboard

- `Enter / Space`：在触发器上打开
- `Esc`：关闭
