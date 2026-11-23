# ListBox

常驻页面的选项列表（listbox 角色）：单选或多选、可分组、每项可带图标、第二行说明与右端数值，选中的项右端出对勾。项高 28、圆角 --radius-inner，bordered 时外面一圈 container 的边与底；maxHeight 之后自己滚。行为底座是 react-aria 的 ListBox。

## Provide

`*` marks a required prop.

### ListBox

数据驱动：items 里有 options 的是分组。选中照统一约定 value / defaultValue / onValueChange，给出整份 id。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly (ListBoxOption \| ListBoxGroup)[]` | — | Options, or titled groups of options; the two can be mixed. |
| `label` * | `string` | — | Accessible name of the list. |
| `selectionMode` | `'single' \| 'multiple'` | `'single'` | single (default): exactly one stays selected once picked; multiple: each click toggles. |
| `value` | `readonly string[]` | — | Selected option ids (controlled). |
| `defaultValue` | `readonly string[]` | — | Selected option ids at first (uncontrolled). |
| `onValueChange` | `(value: string[]) => void` | — | Called with the whole list of selected ids. |
| `onAction` | `(id: string) => void` | — | Called when an option is activated with Enter or a double click (open the layout, switch the account). |
| `bordered` | `boolean` | `false` | Draw an edge and a fill around the list (a standalone list); without it the list blends into its container. |
| `maxHeight` | `number \| string` | — | Height after which the list scrolls inside itself (px or any CSS length). |
| `emptyLabel` | `string` | — | Shown in place of the options when items is empty. |
| `className` | `string` | — | Extra class names on the list. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ListBox } from '@katana-ui/react'

export function ListBoxUsage() {
  const [account, setAccount] = useState<string[]>(['a'])
  return (
    <div style={{ width: 260 }}>
      <ListBox
        label="Account"
        bordered
        value={account}
        onValueChange={setAccount}
        items={[
          { id: 'a', label: 'Account A', description: 'Cash', trailing: '182,400.00' },
          { id: 'b', label: 'Account B', description: 'Margin', trailing: '56,120.50' },
          { id: 'sim', label: 'Paper', description: 'Local', trailing: '1,000,000.00' },
        ]}
      />
    </div>
  )
}
```

## States

- 悬停：selectable 的 hover 底、字提到 primary。
- 选中：selectable 的 selected 底、字 primary、右端对勾（不只靠底色）。
- 单选不许选空：点已选的项不取消；多选点一项切换。
- 给了 onAction：点一下只选这一项（多选按 Ctrl / Shift 扩），Enter 或双击触发 onAction（打开布局、切账户）。
- 分组：组名是 caption 600、secondary 色，组与组之间一道 secondary 的分隔线。
- 空：items 为空且给了 emptyLabel 时居中显示这句话。
- 禁用的项：40% 不透明度、跳过不选。

## Don't

- 五个以内的单选用 RadioGroup；不需要一直摆着的用 Select；选项多又要搜的用 Combobox。
- 不要拿它做导航：侧栏导航用 SideNav。
- 项里不要再放可聚焦的东西（按钮、链接）：listbox 的项里不许有可交互的子项。

## Composition

```
ListBox（listbox）
  分组（section，可选）
    组名（header）
  项（option）× n
    图标 | 文字 + 说明 | 右端数值 | 对勾
```

## Keyboard

- `↑ ↓`：在项之间移动
- `Home / End`：到第一项 / 最后一项
- `字母`：跳到以它开头的项
- `Space / Enter`：选中（给了 onAction 时 Enter 是激活）
- `Shift + ↑ ↓`：多选时连选
- `Ctrl + A`：多选时全选
