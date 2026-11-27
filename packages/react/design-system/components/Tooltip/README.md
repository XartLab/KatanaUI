# Tooltip

悬停或聚焦时出现的短说明，从触发处轻升；悬停停 500ms 才出，出了以后 400ms 内移到邻居立即出。

## Provide

`*` marks a required prop.

### TooltipProvider

悬停时间在这里统一：delayDuration 默认 500，skipDelayDuration 默认 400（导出为 TOOLTIP_DELAY_MS、TOOLTIP_SKIP_MS）；其余属性透传给 Radix Tooltip.Provider。

### Tooltip

其余属性透传给 Radix Tooltip.Root。

### TooltipTrigger

其余属性透传给 Radix Tooltip.Trigger。用 asChild 套在按钮上。

### TooltipContent

其余属性透传给 Radix Tooltip.Content。

### tooltipContentClass

提示的皮肤类名，应用里自己定位的提示（图表悬停）借它长一个样。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@katana-ui/react'

export function TooltipUsage() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Fill ratio = filled / touched</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

## States

- 触发器静止；悬停停满 500ms 浮出提示；聚焦立即浮出。
- 出过提示以后 400ms 内移到邻居：立即出、原地换字；离开超过 400ms 再进，重新等 500ms。按下触发器就收，指针离开前不再出。
- 浮出：最深底 + 1px 分隔线色边 + --k-overlay-tooltip-shadow，没有小箭头。
- 内容里有键帽（.k-kbd）：压成实心浅色块，字用最深底色。
- 移开或 Esc：直接消失，不播退场动画（#1849）。

## Don't

- 提示里不放可点的东西，要放用 Popover。
- 重要的信息不要只放在提示里。

## Composition

```
TooltipProvider
  Tooltip
    TooltipTrigger
    TooltipContent
```

## Keyboard

- `Tab`：聚焦触发器时出现
- `Esc`：收起
