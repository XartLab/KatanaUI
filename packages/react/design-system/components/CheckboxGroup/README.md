# CheckboxGroup

一组勾选框，值是被选项的数组；带「全选」父项，部分选中时父项半选。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### CheckboxGroup

其余属性透传给 div（role=group）；读屏名用 aria-label。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `readonly string[]` | — | The selected item values (controlled). |
| `defaultValue` | `readonly string[]` | `[]` | The initially selected item values (uncontrolled). |
| `onValueChange` | `(value: string[]) => void` | — | Called with the new list of selected values. |
| `allValues` | `readonly string[]` | `[]` | Every child value; required when the group has a parent (select all) item. |
| `disabled` | `boolean` | `false` | Disables the whole group. |

### CheckboxGroupItem

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | The value of this item; omit it on the parent item. |
| `parent` | `boolean` | `false` | Makes this the select-all item. |
| `disabled` | `boolean` | — | Disables this item. |
| `children` * | `ReactNode` | — | The label next to the box (required, it is the accessible name). |
| `className` | `string` | — | Extra class name on the row. |
| `indicator` | `ComponentProps<typeof Checkbox>['indicator']` | — | Mark inside the box, see Checkbox. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CheckboxGroup, CheckboxGroupItem } from '@katana-ui/react'

const MARKETS = ['sh', 'sz', 'bj']

export function CheckboxGroupUsage() {
  return (
    <CheckboxGroup aria-label="Markets" allValues={MARKETS} defaultValue={['sh']}>
      <CheckboxGroupItem parent>All markets</CheckboxGroupItem>
      {MARKETS.map((market) => (
        <CheckboxGroupItem key={market} value={market}>
          {market.toUpperCase()}
        </CheckboxGroupItem>
      ))}
    </CheckboxGroup>
  )
}
```

## States

- 未选、已选、禁用项。
- 父项：全未选、部分选中（半选）、全选。

## Don't

- 只有一个勾选框不要包组。
- 「全选」要把所有子项的值传给 allValues，组不会自己扫 children。

## Composition

```
CheckboxGroup
  CheckboxGroupItem（parent）
  CheckboxGroupItem
```

## Keyboard

- `Tab`：在每个勾选框间走
- `Space`：翻转当前项；在父项上全选或清空
