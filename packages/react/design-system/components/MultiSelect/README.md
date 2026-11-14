# MultiSelect

触发器写已选项的名字，列表项前面一列勾；点一项只切这一项，列表不收。由 Popover 加勾选组出来。

## Provide

### MultiSelect

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` | `readonly string[]` | — | 已选项的 id。 |
| `options` | `readonly (readonly [string, string])[]` | — | [id, 显示的字]，按这个顺序显示与上报。 |
| `onValuesChange` | `(values: string[]) => void` | — | 切了一项后的整组 id。 |
| `empty` | `string` | — | 一个都没选时触发器上写的字。 |
| `separator` | `string` | — | 已选项名字之间的分隔。 |
| `label` | `string` | — | 触发器的读屏名字。 |
| `width` | `number` | — | 触发器宽度（px）。 |
| `triggerClassName / contentClassName` | `string` | — | 应用里的样式与测试按这两个类找触发器与弹层。 |

## States

- 一个都没选：写 empty。
- 已选若干：按选项的顺序写名字，separator 隔开。
- 点一项只切这一项，列表不收。

## Don't

- 不要在包里写死分隔符与空态文案，由调用方传。

## Composition

```
MultiSelect（内部：Popover + PopoverTrigger + PopoverContent，列表项为 role=option）
```

## Keyboard

- `Enter / Space / ↓`：在触发器上打开；焦点落在第一个已选项
- `↑ ↓`：在项之间走，首尾相接
- `Home / End`：跳到首项、末项
- `Space / Enter`：切换当前项
- `打字`：跳到以它开头的项
- `Esc`：收起，焦点回触发器
