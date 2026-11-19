# Tooltip

悬停或聚焦时出现的短说明，从触发处轻升；默认没有延迟。

## Provide

`*` marks a required prop.

### TooltipProvider

其余属性透传给 Radix Tooltip.Provider。

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

- 触发器静止；悬停或聚焦后浮出提示（默认没有延迟）。
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
