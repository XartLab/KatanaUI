# Command

一个输入框加一串过滤出来的行：焦点一直在输入框里，↑↓ 移动高亮，回车选中。底座是 cmdk（过滤、键盘、分组）；自己排名的传 shouldFilter={false}。

## Provide

`*` marks a required prop.

### Command

其余属性透传给 cmdk 的 Command（shouldFilter、filter、loop、value、onValueChange）。

### CommandItem

其余属性透传给 cmdk 的 Item。aria-selected 说的是当前高亮，不是已选。

### CommandDialog

其余属性透传给 Dialog。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` * | `string` | — | Title for screen readers (not shown, required). |
| `description` * | `string` | — | Description for screen readers (not shown, required). |
| `className` | `string` | — | Extra class name on the dialog content. |
| `commandProps` | `ComponentProps<typeof CommandPrimitive>` | — | Props passed to the Command inside. |

### CommandInput / CommandList / CommandEmpty / CommandGroup / CommandSeparator / CommandShortcut

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@katana-ui/react'

export function CommandUsage() {
  return (
    <Command label="Commands">
      <CommandInput placeholder="Search commands" />
      <CommandList aria-label="Commands">
        <CommandEmpty>No matching command</CommandEmpty>
        <CommandItem value="trend-line">Trend line</CommandItem>
        <CommandItem value="fib">Fibonacci retracement</CommandItem>
      </CommandList>
    </Command>
  )
}
```

## States

- 有输入：按行的 value 与 keywords 过滤；没有匹配显示 CommandEmpty。
- 高亮行 data-selected，aria-selected 说的是高亮不是已选。
- shouldFilter=false：由调用方自己排名，行序照传入的。

## Don't

- 不要不传 label 或标题，输入框需要可访问名。
- 不要拿它当长表单的下拉，用 Combobox 或 Select。
- 不要在包里写占位与空态文字，由调用方传。

## Composition

```
Command
  CommandInput
  CommandList
    CommandEmpty
    CommandGroup
      CommandItem
        CommandShortcut
    CommandSeparator
```

## Keyboard

- `↑ ↓`：移动高亮（首尾相接）
- `Home / End`：跳到首项、末项
- `Enter`：执行高亮的那一行
- `打字`：过滤；没有匹配显示 CommandEmpty
- `Esc`：（在 CommandDialog 里）关闭，焦点回打开前拿着它的元素
