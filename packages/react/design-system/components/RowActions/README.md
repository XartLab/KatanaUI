# RowActions

所有带品种的行（DataGrid、连板天梯、报价表）与格子（市场热力图）共用的一套：悬停或键盘落到一行时，行右端浮出前几颗无边框图标按钮，浮在行上、不挤列宽；右键（菜单键、Shift+F10）出同一份菜单。件不认识「图表」「自选」，只认 { key, label, icon?, shortcut?, onSelect }，文案与动作都由调用方传；symbolMenu 把标准四项（开图、加自选、新建告警、复制代码，固定次序）拼成这样的数组，调用方的项接在后面。DataGrid、LimitLadder、MarketHeatmap 各有一个可选 prop 接它，不传就没有，旧用法不变。功能参照 TradingView 品种搜索结果行的悬停操作，自选行的细节待核对。样子照连板天梯：按钮无边框、悬停灰底，不加橙色。

## Provide

`*` marks a required prop.

### RowActions

按钮条绝对定位在宿主行右端，宿主行要 position: relative（单独用时给行加 k-row-host，悬停与焦点在行内都出现）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `RowAction[]` | — | 全部项；按钮条只画带 icon 的前 max 个，没有图标的项只在菜单里。 |
| `label` | `string` | — | 屏幕阅读器念的组名。 |
| `max` | `number` | `3` | 最多画几颗按钮。 |
| `focusable` | `boolean` | `true` | 按钮能不能用 Tab 走到。行自己管键盘的表与列表（DataGrid、LimitLadder）传 false，用菜单键开完整菜单。 |
| `role` | `string` | `'group'` | 宿主行是表里的一格时给 gridcell。 |
| `pointerOnly` | `boolean` | — | 按钮画成不可聚焦、对读屏隐藏的 span（宿主行是 option 这类里面不许有可聚焦子项的角色时用，连板天梯就是）；键盘与读屏走菜单键开的整份菜单。 |

### RowAction

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | — | 稳定的名字（DOM 上是 data-action）。 |
| `label` | `string` | — | 菜单文字，按钮的读屏名与悬停提示。 |
| `icon` | `ReactNode` | — | 按钮图标；不给就只出现在菜单里。 |
| `shortcut` | `string` | — | 快捷键的字（写好的）：菜单行尾显示，按钮悬停提示里跟在名字后。 |
| `disabled` | `boolean` | — | 禁用。 |
| `onSelect` | `() => void` | — | 点按钮或选菜单项。 |

### symbolMenu(input)

纯函数，返回 RowAction[]。没传的标准项跳过；标准项没传 icon 用包里的默认图标。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `openChart` | `{ label, onSelect, icon?, shortcut?, disabled? }` | — | 打开图表（key open-chart）。 |
| `addToWatchlist` | `同上` | — | 加入自选（add-to-watchlist）。 |
| `newAlert` | `同上` | — | 新建告警（new-alert）。 |
| `copyCode` | `同上` | — | 复制代码（copy-code）。 |
| `extra` | `RowAction[]` | — | 调用方自己的项，排在标准四项后面。 |

### RowContextMenu

给一组行包上同一份右键菜单（连板天梯、热力图内部就用它）；自己不画盒子（display: contents）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `actionsFor` | `(key: string) => RowAction[]` | — | 按行的键给这一行的项；空数组不出菜单；不传就原样画孩子。 |
| `label` | `string` | — | 菜单的读屏名。 |
| `keyAttribute` | `string` | `'data-code'` | 行元素上带键的属性名。 |

### RowActionMenuItems

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `RowAction[]` | — | 在当前菜单（右键或下拉）里画整份项：图标在名字前，快捷键在行尾。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RowActions, symbolMenu } from '@katana-ui/react'

export function RowActionsUsage() {
  const [log, setLog] = useState('')
  const items = (code: string) =>
    symbolMenu({
      openChart: { label: 'Open chart', onSelect: () => setLog(`Open chart · ${code}`) },
      addToWatchlist: { label: 'Add to watchlist', onSelect: () => setLog(`Add to watchlist · ${code}`) },
      newAlert: { label: 'New alert', onSelect: () => setLog(`New alert · ${code}`) },
      copyCode: { label: 'Copy code', onSelect: () => setLog(`Copy code · ${code}`) },
    })
  return (
    <div className="gal-wide" style={{ maxWidth: 420 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {['ALFA', 'BRAV', 'CHAR'].map((code) => (
          <li
            key={code}
            className="k-row-host"
            style={{ display: 'flex', alignItems: 'center', height: 30, padding: '0 8px', fontSize: 12 }}
          >
            <span>{code}</span>
            <RowActions items={items(code)} label={`${code} actions`} />
          </li>
        ))}
      </ul>
      <p className="gal-note">{log ? `Last action: ${log}` : 'Last action: none yet'}</p>
    </div>
  )
}
```

## States

- 默认：按钮条透明、不接指针。悬停宿主行、键盘落到这一行（DataGrid 的当前行、连板天梯的焦点行）、按钮自己聚焦时淡入。
- 按钮：无边框，悬停 10% 白底；禁用 40% 不透明度。

## Don't

- 不要在件里写死「图表」「自选」的文案或动作：由调用方传。
- 不要在悬停按钮里放超过三颗：多的进右键菜单。
- 不要用橙色：橙色只给状态灯与选中条。

## Composition

```
RowActions
  span（group）
    button × 最多 3（图标）
RowContextMenu
  ContextMenu
    RowActionMenuItems（图标 | 名字 | 快捷键）
```

## Keyboard

- `菜单键 / Shift+F10`：在焦点所在的行或格子上开同一份菜单
- `↑ / ↓`：在行间移动（DataGrid、连板天梯），当前行的按钮条跟着出现
