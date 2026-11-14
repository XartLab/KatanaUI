# Tooltip

悬停或聚焦时出现的短说明，从触发处轻升；默认没有延迟。

## Provide

### TooltipProvider

其余属性透传给 Radix Tooltip.Provider。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `delayDuration` | `number` | `0` | 悬停多少毫秒后出现。 |

### Tooltip

其余属性透传给 Radix Tooltip.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `defaultOpen / open` | `boolean` | — | 初始或受控的开合。 |

### TooltipTrigger

其余属性透传给 Radix Tooltip.Trigger。用 asChild 套在按钮上。

### TooltipContent

其余属性透传给 Radix Tooltip.Content。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sideOffset` | `number` | `6` | 离触发器的距离。 |

### tooltipContentClass

提示的皮肤类名，应用里自己定位的提示（图表悬停）借它长一个样。

## States

- 触发器静止；悬停或聚焦后浮出提示（默认没有延迟）。

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
