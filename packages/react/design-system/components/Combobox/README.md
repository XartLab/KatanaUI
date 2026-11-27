# Combobox

Popover 加 Command 拼出来：触发器跟单选下拉一个样，打开后焦点在搜索框，打字过滤，回车选中。单选选了就收（受控 open），多选不收；每行用 selected 画勾。

## Provide

`*` marks a required prop.

### Combobox

其余属性透传给 Radix Popover.Root。open、onOpenChange 受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `closeOnScroll` | `boolean` | — | Closes the popover when the page or a container holding its trigger scrolls, so it never floats away open. |

### ComboboxContent

其余属性透传给 Radix Popover.Content。宽跟触发器一样（最窄 220）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `keyof typeof skin` | — | Skin of the popup. |
| `label` * | `string` | — | Accessible name of the search box and the list (required: cmdk names the combobox and the listbox with it). |
| `commandProps` | `ComponentProps<typeof Command>` | — | Props passed to the Command inside (for example shouldFilter: false to rank on your own). |

### ComboboxItem

同 CommandItem，另加三个可选属性：selected 画勾；prefix 是文字前的节点（头像、图标，纯装饰，读屏不读）；description 是文字下的第二行说明（带它时行自己长高，不带还是 30 高）。带 prefix 或 description 时 value 默认取主文字（children 是字符串时），说明不进搜索、onSelect 收到的也是主文字；要按说明搜就把它放进 keywords，children 不是字符串时一定要自己传 value。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `selected` | `boolean` | `false` | Selected: draws a check mark on the left and sets data-checked. |
| `prefix` | `ReactNode` | — | Node before the text (avatar, icon, flag). |
| `description` | `ReactNode` | — | Second line under the text (a role, an exchange). |

### ComboboxTrigger / ComboboxInput / ComboboxList / ComboboxEmpty / ComboboxGroup

## Usage

```tsx
// SPDX-License-Identifier: MIT
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@katana-ui/react'
import { useState } from 'react'

export function ComboboxUsage() {
  const [value, setValue] = useState('1h')
  const [open, setOpen] = useState(false)
  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <ComboboxTrigger aria-label="Timeframe">
        <span>{value}</span>
      </ComboboxTrigger>
      <ComboboxContent label="Search timeframes">
        <ComboboxInput placeholder="Search" />
        <ComboboxList>
          <ComboboxEmpty>No match</ComboboxEmpty>
          {['1m', '5m', '1h', '1d'].map((frame) => (
            <ComboboxItem
              key={frame}
              value={frame}
              selected={frame === value}
              onSelect={() => {
                setValue(frame)
                setOpen(false)
              }}
            >
              {frame}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
```

## States

- 关闭：触发器 role=combobox，aria-expanded=false。
- 打开：焦点在搜索框，列表可过滤。
- 单选：选中后收起；多选：点一项不收，触发器写已选个数。
- 已选的行 data-checked 且前面有勾。
- 带 prefix / description：前缀在勾与文字之间，说明在文字下一行，行长高到放得下两行。

## Don't

- 要在输入框里带标签的多选，用 TagCombobox，不要拿触发器写已选个数硬凑。
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
