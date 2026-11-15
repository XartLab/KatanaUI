# MultiSelect

触发器写已选项的名字，列表项前面一列勾；点一项只切这一项，列表不收。由 Popover 加勾选组出来。

## Provide

`*` marks a required prop.

### MultiSelect

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` * | `readonly string[]` | — | Ids of the selected options. |
| `options` * | `readonly (readonly [string, string])[]` | — | Options as [id, label] pairs, shown and reported in this order. |
| `onValuesChange` * | `(values: string[]) => void` | — | Called with the full list of selected ids after one option toggles. |
| `empty` * | `string` | — | Text on the trigger when nothing is selected. |
| `label` | `string` | — | Accessible name of the trigger. |
| `separator` * | `string` | — | Text placed between the selected option names. |
| `width` | `number` | — | Trigger width in px. |
| `triggerClassName` | `string` | — | Extra class name on the trigger, for app styles and tests to find it. |
| `contentClassName` | `string` | — | Extra class name on the popup, for app styles and tests to find it. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { MultiSelect } from '@katana-ui/react'

export function MultiSelectUsage() {
  const [values, setValues] = useState(['name'])
  return (
    <MultiSelect
      label="Columns"
      values={values}
      onValuesChange={setValues}
      options={[
        ['name', 'Name'],
        ['price', 'Price'],
        ['volume', 'Volume'],
      ]}
      empty="None"
      separator=", "
    />
  )
}
```

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
