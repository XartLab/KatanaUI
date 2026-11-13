# Command

一个输入框加一串过滤出来的行：焦点一直在输入框里，↑↓ 移动高亮，回车选中。底座是 cmdk（过滤、键盘、分组）；自己排名的传 shouldFilter={false}。

## Provide

### Command

其余属性透传给 cmdk 的 Command（shouldFilter、filter、loop、value、onValueChange）。

### CommandItem

其余属性透传给 cmdk 的 Item。aria-selected 说的是当前高亮，不是已选。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 过滤用的值，同一个 Command 里要唯一。 |
| `keywords` | `string[]` | — | 额外的搜索词（别名、拼音、英文名）。 |
| `onSelect` | `(value: string) => void` | — | 回车或点击选中。 |
| `disabled` | `boolean` | — | 不可选。 |

### CommandDialog

其余属性透传给 Dialog。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | — | 读屏用的标题（不显示，必填）。 |
| `description` | `string` | — | 读屏用的说明（不显示，必填）。 |
| `commandProps` | `ComponentProps<typeof Command>` | — | 给里面的 Command。 |

### CommandInput / CommandList / CommandEmpty / CommandGroup / CommandSeparator / CommandShortcut

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
