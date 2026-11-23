# PinnedList

可置顶的列表（自选股、常用面板）：点一行把它钉到最上面，钉住的行落下时轻压一下，下面的行依次补位；左侧长出强调条，图钉转 45 度。置顶数有上限，满了其余行变灰不可点。键盘：方向键走、Home / End 到头尾、Enter / 空格 / P 切换。

## Provide

`*` marks a required prop.

### PinnedList

pinnedIds 受控；不传就用 items 里的 pinned 起头自己记。labels 四项必填（读屏名与空态）。renderItem 自画行内容，图钉与强调条仍是件画的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly PinnedListItem[]` | — | Every row, pinned or not; the list puts the pinned ones first. |
| `labels` * | `PinnedListLabels` | — | All the text the list needs; the package ships none. |
| `pinnedIds` | `readonly string[]` | — | Pinned ids (controlled); omit to let the list keep its own. |
| `onPinnedChange` | `(ids: string[]) => void` | — | Called with the new pinned ids after a pin or unpin. |
| `maxPinned` | `number` | `DEFAULT_MAX_PINNED` | How many rows can be pinned; the others stay disabled once reached. |
| `showDivider` | `boolean` | `true` | Draw a hairline between the pinned and the other rows. |
| `renderItem` | `(item: PinnedListItem, pinned: boolean) => ReactNode` | — | Draw a row yourself; the pin button and the accent rail stay. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PinnedList } from '@katana-ui/react'

export function PinnedListUsage() {
  return (
    <PinnedList
      items={[
        { id: 'btc', title: 'BTCUSDT', meta: '106,977.4' },
        { id: 'eth', title: 'ETHUSDT', meta: '3,814.2' },
      ]}
      labels={{
        list: 'Watchlist',
        pin: (title) => `Pin ${title}`,
        unpin: (title) => `Unpin ${title}`,
        emptyPinned: 'Pin a row to keep it on top',
      }}
    />
  )
}
```

## States

- 未钉住：透明底、线框，右侧灰图钉。
- 钉住：抬起（bg-300）、左侧强调条、图钉转 45 度填满；落下时压一下。
- 满额：其余行半透明、不可点，读屏为 aria-disabled。
- 没有钉住的：钉区显示 emptyPinned 虚线框。

## Don't

- 不要用来做多选：置顶是排序，不是选择；多选用 MultiSelect 或 ChipGroup。
- 不要放几百行：每行是 layout 动画；长列表用 DataGrid。

## Composition

```
PinnedList
  div
    ul
      motion.li（空态）
      motion.li
        motion.div（role=button）
      li（分隔线）
```

## Keyboard

- `↑ ↓ ← →`：在行间走（漫游 tabindex）
- `Home / End`：到第一行 / 最后一行
- `Enter / Space / P`：置顶或取消
