# Combobox

Popover 加 Command 拼出来：触发器跟单选下拉一个样，打开后焦点在搜索框，打字过滤，回车选中。单选选了就收（受控 open），多选不收；每行用 selected 画勾。

## Provide

### Combobox

其余属性透传给 Radix Popover.Root。open、onOpenChange 受控。

### ComboboxContent

其余属性透传给 Radix Popover.Content。宽跟触发器一样（最窄 220）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 搜索框与列表的读屏名（必填）。 |
| `commandProps` | `ComponentProps<typeof Command>` | — | 给里面的 Command（例：shouldFilter: false，自己排名）。 |

### ComboboxItem

同 CommandItem。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `selected` | `boolean` | `false` | 已选：左边画勾，data-checked。 |

### ComboboxTrigger / ComboboxInput / ComboboxList / ComboboxEmpty / ComboboxGroup

## States

- 关闭：触发器 role=combobox，aria-expanded=false。
- 打开：焦点在搜索框，列表可过滤。
- 单选：选中后收起；多选：点一项不收，触发器写已选个数。
- 已选的行 data-checked 且前面有勾。

## Don't

- 不要少于十来项就用它，少的用 Select。
- 不要忘了给搜索框与列表传 label。
- 行的 aria-selected 是高亮不是已选，已选用 selected。

## Composition

```
Combobox
  ComboboxTrigger
  ComboboxContent
    ComboboxInput
    ComboboxList
      ComboboxEmpty
      ComboboxItem
```

## Keyboard

- `Enter / Space / ↓`：在触发器上打开；焦点落在搜索框
- `打字`：过滤
- `↑ ↓`：移动高亮
- `Enter`：选中
- `Esc`：收起，焦点回触发器
