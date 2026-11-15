# FilterBar

选股器的顶部过滤行：一行可换行的胶囊，每个胶囊是一个字段；点开浮层有标题与垃圾桶（把这个过滤从条上拿掉）、搜索框、预设条件列表（主文字加灰色副标题）、底部「手动设置」（运算符加值）。最后是「+」（按分组列出所有字段，进组再选）与「⋯」（重置全部条件）。照 TradingView 选股器（主会话 2026-11-15 登录态实测），实现原创。字段、运算符、预设与文字都由调用方定义；条件受控，件不过滤数据，调用方用 applyFilters 或自己的方式过滤。

## Provide

`*` marks a required prop.

### FilterBar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `fields` | `FilterField[]` | — | { key, label, group?, input?（number / text）, operators: {value,label}[], presets?: {key,label,hint?,op,value}[], shown? }。 |
| `value` | `FilterCondition[]` | — | { id, field, op, value, label? }；同一字段只留最后设的一条。 |
| `onChange` | `(next: FilterCondition[]) => void` | — | 条件变了（设、清除、移除字段、重置）。 |
| `labels` | `FilterBarLabels` | — | 全部文字，由调用方传。传了 undo 与 redo 两个读屏名，条的最左多一对撤销 / 重做按钮（件自己记它改过的条件快照，最多 50 步；从外面换掉条件不进栈）。 |
| `defaultShown` | `string[]` | — | 条上一开始有哪些字段；不给取 shown 为真的，再没有取前 6 个。 |

### ViewSwitcher

标题位置的「已保存的视图」下拉（选股器标题的保存的筛选、新闻流标题的 Full feed）；件不存视图，列表与当前项由调用方传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `views` | `ViewOption[]` | — | { key, label }；下拉里按这个顺序列。 |
| `value` | `string` | — | 当前视图的键。 |
| `onValueChange` | `(key: string) => void` | — | 选了另一个视图。 |
| `onSave` | `() => void` | — | 给了，列表底部多一项「另存为」（文字 labels.save）；命名对话框与存哪里归调用方。 |
| `labels` | `{ trigger: string; save?: string }` | — | 读屏名与「另存为」文字。 |

### applyFilters / matchCondition

纯函数；约定的运算符名：gt、gte、lt、lte、eq、neq、between（值写成「下限..上限」）、contains、in（逗号分隔）。别的运算符名调用方自己匹配。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `applyFilters(rows, conditions, getCell)` | `Row[]` | — | 所有条件都满足（且）；getCell 按字段键取这一行的值。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FilterBar, type FilterBarLabels, type FilterCondition, type FilterField } from '@katana-ui/react'

const OPS = [
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
]

const FIELDS: readonly FilterField[] = [
  {
    key: 'price',
    label: '价格',
    group: '市场数据',
    shown: true,
    operators: OPS,
    presets: [{ key: 'p-high', label: '高于 100', hint: '高价股', op: 'gt', value: '100' }],
  },
  { key: 'pe', label: '市盈率', group: '估值', shown: true, operators: OPS },
]

const LABELS: FilterBarLabels = {
  bar: '过滤条',
  add: '添加过滤',
  more: '更多',
  reset: '重置全部过滤',
  search: '搜索',
  noMatch: '没有匹配项',
  presets: '预设条件',
  manual: '手动设置',
  operator: '运算符',
  value: '值',
  apply: '应用',
  remove: '移除过滤',
  clear: '清除条件',
  back: '返回',
  otherGroup: '其他',
  undo: '撤销',
  redo: '重做',
}

export function FilterBarUsage() {
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  return <FilterBar fields={FIELDS} value={conditions} onChange={setConditions} labels={LABELS} />
}
```

## States

- 设了条件的胶囊：底色加深，字提亮并带条件文字。
- 字段被移除：从条上拿掉，它的条件一并清除。

## Don't

- 不要把过滤逻辑写进件：件只出条件，数据由调用方过滤。
- 字段很多时别全摆在条上：用「+」加。

## Composition

```
FilterBar
  胶囊 × n（Popover：标题 + 垃圾桶、搜索、预设列表、手动设置）
  「+」（Popover：搜索、分组列表带计数）
  「⋯」（重置）
```

## Keyboard

- `Tab`：在胶囊、「+」、「⋯」间移动
- `Enter`：打开浮层或选中预设
