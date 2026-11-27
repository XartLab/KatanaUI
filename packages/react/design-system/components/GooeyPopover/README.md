# GooeyPopover

圆钮点开，一块「液体」从圆钮里长出来变成内容面板，收起时缩回去；SVG goo 滤镜只画形状，文字在滤镜上层不糊。装饰件：适用首页、营销页的小彩蛋式入口；交易主界面的弹层用 Popover。

## Provide

`*` marks a required prop.

### GooeyPopover

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | The panel's content. |
| `trigger` * | `ReactNode` | — | Icon in the round trigger. |
| `triggerLabel` * | `string` | — | Spoken name of the trigger (required). |
| `open` | `boolean` | — | Whether the panel is open (controlled). |
| `onOpenChange` | `(open: boolean) => void` | — | Called when it opens or closes. |
| `side` | `'top' \| 'bottom'` | `'top'` | Open above or below the trigger. |
| `sideOffset` | `number` | `24` | Gap between trigger and panel in px. |
| `contentWidth` | `number` | `240` | Panel width in px. |
| `triggerSize` | `number` | `44` | Diameter of the trigger in px. |
| `speed` | `number` | `0.25` | Duration of the morph in seconds. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MessageCircle } from 'lucide-react'
import { GooeyPopover } from '@katana-ui/react'

export function GooeyPopoverUsage() {
  return (
    <div style={{ paddingTop: 120 }}>
      <GooeyPopover trigger={<MessageCircle size={18} />} triggerLabel="Open chat">
        Questions about the strategy? Ask here.
      </GooeyPopover>
    </div>
  )
}
```

## States

- 收起：一个圆钮。
- 展开：形状从圆钮长到面板大小，内容在 57% 处淡入。
- 点外面或按 Esc：缩回。

## Don't

- 不要放进交易主界面：圆钮到面板的形变没有语义。
- 不要放要填的长表单：面板靠点外面收起。

## Composition

```
GooeyPopover
  svg（goo 滤镜）
  div（滤镜层）
  button（圆钮）
  motion.div（面板）
  div（隐藏镜像，量高度）
```
