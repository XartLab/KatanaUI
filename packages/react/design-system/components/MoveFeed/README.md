# MoveFeed

盘口异动的流：一行一条，时间 · 名称（带代码）· 类型胶囊 · 数值；按时间从新到旧排，新来的从顶上进（淡入一下，reduced-motion 时不播）。类型胶囊按涨 / 跌 / 量 / 板着色（涨跌读 --pnl-up / --pnl-down 跟 data-updown，量是中性强调，板是警示色），顶上一排类型多选筛（点一个只看它、再点取消，一个都没选是全部，带条数）。点行触发 onSelect 联动个股页，selectedId 标出联动的那一行。随包认识十三种类型（火箭发射、封涨停板、大笔卖出、5 分钟涨幅 / 跌幅…），也可以传自己的类型表。加密市场的用法（#245，照 OKX 的「市场异动」）：条目的 symbol 写币对，传 currentSymbol 就多一个「只看当前品种」开关（onlyCurrent 受控或 defaultOnlyCurrent 不受控），类型文字走 labels.types（「5 分钟涨幅」「15 分钟跌幅」…，没有的窗口用 types 自定）。条目由调用方给。与 NewsFeed（新闻阅读器）、EventTimeline（公司事件）不同。

## Provide

`*` marks a required prop.

### MoveFeed

渲染一个 section；类型筛选可受控也可不受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly MoveItem[]` | — | The moves, in any order; the feed sorts them newest first and animates rows that were not there on the last render. |
| `types` | `readonly MoveTypeDef[]` | — | Own move types (key, label, tone) on top of the built-in ones; a type with the same key overrides the built-in one. |
| `selectedTypes` | `readonly string[]` | — | Selected type keys (controlled); empty means all types. |
| `defaultSelectedTypes` | `readonly string[]` | `[]` | Initial selected types when uncontrolled; none by default. |
| `onSelectedTypesChange` | `(types: string[]) => void` | — | Called with the new selected types. |
| `currentSymbol` | `string \| null` | — | The symbol on screen (`BTC-USDT-SWAP`). |
| `onlyCurrent` | `boolean` | — | Show only rows of `currentSymbol` (controlled). |
| `defaultOnlyCurrent` | `boolean` | `false` | Initial state of the switch when uncontrolled; off by default. |
| `onOnlyCurrentChange` | `(onlyCurrent: boolean) => void` | — | Called with the new state of the switch. |
| `onSelect` | `(item: MoveItem) => void` | — | Called when a row is picked; without it the rows are plain. |
| `selectedId` | `string \| null` | `null` | The id of the row currently linked elsewhere (highlighted). |
| `limit` | `number` | `200` | The most rows drawn; 200 by default. |
| `height` | `number` | `320` | Height of the scrolling list in px; 320 by default. |
| `labels` | `MoveFeedLabels` | `cnLabelsZh.moveFeed` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### MoveItem

一条异动：id、time、name、type，可选 code、value 与 unit（percent / amount / price）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable id; new rows are told from old ones by it. |
| `time` * | `string` | — | Time of the move ("09:31" or "09:31:05"); one that cannot be read sinks to the bottom. |
| `name` * | `string` | — | Stock name. |
| `code` | `string` | — | Stock code. |
| `symbol` | `string` | — | Symbol the row belongs to (`BTC-USDT-SWAP`), compared with `currentSymbol` when only the current symbol is shown. |
| `type` * | `string` | — | Key of the move type. |
| `value` | `number \| null` | — | The figure; a dash when missing. |
| `unit` | `'percent' \| 'amount' \| 'price'` | — | How the figure is written: percent (signed, with direction colour), amount (wan / yi) or price; percent by default. |

### MoveTypeDef

自定义类型：key、label、tone（up / down / volume / board）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `key` * | `string` | — | Stable key of the move type. |
| `label` * | `string` | — | Text written on the capsule. |
| `tone` * | `MoveTone` | — | Up, down, volume or board. |

### moveTone(type, defs)

纯函数：类型的色调；自定义表优先，不认识的按 volume。

### sortFeed(items)

纯函数：按时间从新到旧排，同一时刻后传入的在上，写不对的时刻沉底。

### filterMoves(items, selected)

纯函数：按选中的类型筛，一个都没选是全部。

### filterBySymbol(items, symbol)

纯函数：只留属于这个品种的行（symbol，再 code，再 name），不分大小写；symbol 为空不筛。

### typeCounts(items, defs)

纯函数：各类型的条数，没出现的不列。

### toggleType(selected, type)

纯函数：切换一个类型的选中状态。

### moveValue(item)

纯函数：数值的字与方向；取不到写「—」。

### clockText(time)

纯函数：时刻写成 HH:MM:SS。

### freshIds(previous, items)

纯函数：这一轮新出现的 id；首次渲染没有。

### MOVE_TYPE_TONES

随包类型的色调表。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MoveFeed } from '@katana-ui/react/cn'

export function MoveFeedUsage() {
  return (
    <MoveFeed
      items={[
        { id: '1', time: '09:31:05', name: 'Example A', code: '600101', type: 'rocket', value: 3.2 },
        {
          id: '2',
          time: '09:33:40',
          name: 'Example B',
          code: '000102',
          type: 'bigBuy',
          value: 23_500_000,
          unit: 'amount',
        },
        { id: '3', time: '09:36:12', name: 'Example C', code: '300103', type: 'sealUp', value: 20.01 },
        { id: '4', time: '09:41:50', name: 'Example D', code: '600104', type: 'dive', value: -4.6 },
      ]}
      onSelect={() => {}}
      labels={{
        region: 'Intraday moves',
        filter: 'Filter by move type',
        all: 'All',
        onlyCurrent: 'Current symbol',
        types: {
          rocket: 'Rocket',
          dive: 'Dive',
          bigBuy: 'Big buy',
          sealUp: 'Limit-up sealed',
        },
        typeChip: (name, count) => `${name} ${count}`,
        summary: (count) => `${count} moves`,
        empty: 'No moves',
        row: (time, name, type, value) => `${time} ${name} ${type} ${value}`,
        unavailable: 'Not available',
      }}
    />
  )
}
```

## States

- 默认：全部类型，按时间从新到旧排；顶上写总条数。
- 选了类型：只列选中的（可多选），按钮标按下，条数是筛后的。
- 新条目进来：排到该在的位置，新出现的那一行淡入；首次渲染不播。
- 数值：百分数带正负号与涨跌色，金额写万 / 亿，取不到写「—」。
- 给了 onSelect 行是按钮；selectedId 那一行高亮并标 aria-pressed。
- 给了 currentSymbol 顶栏多一个「只看当前品种」勾选：勾上只列这个品种的行，类型条数与总条数都按筛后的算；currentSymbol 换了，筛的对象跟着换。
- 没有条目：写一行空态文字。

## Don't

- 不要拿它读新闻或公告：用 NewsFeed；公司事件用 EventTimeline。
- 不要传色值：类型胶囊只靠 tone。
- 不要在包里取数或轮询：条目由调用方推进来。

## Composition

```
MoveFeed
  顶栏（类型多选筛 · 只看当前品种（可选）· 总条数）
  ul
    li（时间 · 名称 + 代码 · 类型胶囊 · 数值）
```

## Keyboard

- `Tab`：到类型筛选按钮与行（给了 onSelect 时）
- `Enter / Space`：切换类型、勾选「只看当前品种」，或选中一行
