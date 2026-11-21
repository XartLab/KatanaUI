# DataGrid

拼面板用的数据表：TanStack Table 管排序、列宽、顺序、显隐，虚拟滚动只画看得见的行；列声明一个类型（价格、数量、盈亏、涨跌幅、方向、时间、品种……），格式化、对齐、着色、排序由类型给。列的状态受控（调用方存）；应用的能力经 DataGridHost 注入。

## Provide

`*` marks a required prop.

### DataGrid

示例数据写死在页里，不是行情。行高档：compact 20、default 24、relaxed 32。没有 DataGridHost 时能点、能排序、能键盘选行，只是没有快捷键与标准右键项。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `columns` * | `readonly GridColumn<Row>[]` | — | Column definitions, a module-level constant (column objects must be stable). |
| `layout` * | `readonly GridColumnLayout[]` | — | How the columns are laid out: order, visibility, width and header text; stored by the caller. |
| `rows` * | `readonly Row[]` | — | The rows. |
| `rowId` * | `(row: Row) => string` | — | Returns the stable id of a row. |
| `label` * | `string` | — | Table name read by screen readers. |
| `sort` | `SortSpec \| null` | `null` | Current sort; omit for unsorted. |
| `onSortChange` | `(next: SortSpec \| null) => void` | — | Without it sorting is off and headers are plain text, not buttons. |
| `sortRemovable` | `boolean` | `true` | When false the third click goes back to ascending (a table with a default sort cannot be unsorted). |
| `onLayoutChange` | `(next: GridColumnLayout[]) => void` | — | Layout changed (column menu pin / hide / move, header drag reorder): gets the whole new layout; the caller stores it. |
| `onResize` | `(id: string, width: number) => void` | — | Called after a column width drag; without it there are no drag handles and no reset-columns item. |
| `onResetColumns` | `() => void` | — | Reset columns (menu item and shortcut): the caller puts order, visibility, width and sort back to defaults. |
| `onOpen` | `(row: Row) => void` | — | What a plain click on a row does. |
| `restoreRow` | `string \| null` | — | Row to put keyboard focus back on when returning from a detail view (WCAG 2.4.3); only works at mount. |
| `isOpened` | `(row: Row) => boolean` | — | Whether a row is the one currently open (an accent stripe on its left). |
| `rowClass` | `(row: Row) => string \| undefined` | — | Extra class name for a row. |
| `rowActions` | `(row: Row) => readonly RowAction[]` | — | Row quick actions (usually the result of symbolMenu(...)): hovering or keyboard-focusing a row floats the first few icon buttons at its right end; the whole list also leads the context menu when it opens on a single row. |
| `rowProps` | `(row: Row) => GridRowProps \| undefined` | — | Extra attributes for a row (class name, tooltip, data-*, aria-*), so state and test hooks need no wrapper. |
| `renderSubRow` | `(row: Row) => ReactNode` | — | Expandable detail row spanning the full width; return null, undefined or false for a row without one. |
| `expanded` | `ReadonlySet<string>` | — | Expanded row ids (controlled); when given, expanding and collapsing only notify through onExpandedChange. |
| `onExpandedChange` | `(id: string, expanded: boolean) => void` | — | Called when a row is expanded or collapsed. |
| `defaultExpanded` | `(row: Row) => boolean` | — | Uncontrolled: whether a row the user has not toggled starts expanded; omit for collapsed. |
| `menu` | `(rows: Row[]) => readonly GridMenuEntry[]` | — | Items appended after the standard ones in the context menu, acting on the selected rows. |
| `extrasFirst` | `boolean` | — | Put the items from menu before the standard ones (copy, export, reset columns) instead of after. |
| `menuTail` | `() => readonly GridMenuEntry[]` | — | Items placed after the standard ones when extrasFirst is set. |
| `panelMenu` | `() => readonly GridMenuEntry[]` | — | Items added to the menu when the click lands on empty space. |
| `rowInfo` | `(row: Row) => string` | — | Gray text at the bottom of the context menu for a row (an id, say). |
| `askText` | `(rows: Row[]) => string \| null` | — | Summary text of the selected rows for "Ask the agent" (null when there is nothing to write); needs askAgent from the host. |
| `exportName` | `string` | `'table'` | File name for the export, without extension. |
| `onExport` | `(csv: string, fileName: string) => void` | — | Called with the CSV text and file name; without it there is no export item. |
| `foot` | `ReactNode` | — | A line of text under the table. |
| `presorted` | `boolean` | — | Rows are already sorted by the caller (group rows with children): the header still shows the sort marker but the table does not sort. |
| `rowTree` | `(row: Row) => { level: number; expanded?: boolean }` | — | Tree rows: the table reads as an ARIA treegrid and rows carry aria-level and aria-expanded. |
| `timeZone` | `string` | — | Time zone of time columns: 'local' (default), 'utc' or an IANA name. |
| `sortLocale` | `string` | — | Locale for sorting text columns (Intl.Collator); follows the runtime when omitted. |
| `collapseColumns` | `boolean` | `true` | Priority columns (default true): at standard and hero emphasis, when the visible columns do not fit the container, the lowest-priority columns (GridColumn.priority; undeclared ones count up in declaration order) are collapsed and a "+N cols" capsule appears at the right end of the header; clicking it switches to horizontal scrolling with every column. |
| `containerWidth` | `number` | — | Container width in px for the priority columns; measured with a ResizeObserver when omitted. |
| `density` | `GridDensity` | `'default'` | Row height tier. |
| `hideHeader` | `boolean` | — | Do not draw the header (a two-column metrics table, say). |
| `headExtra` | `(columnId: string) => ReactNode` | — | Extra content after the sort button in each column head (a search icon on the Symbol head, say): given per column id, null for none. |
| `headEnd` | `ReactNode` | — | Content at the far right of the header (the "+ add column" button, wired to ColumnPicker); floats over the header end and takes no column. |
| `autoRowHeight` | `boolean` | — | Row height follows the content (multi-line cells, buttons in rows): the density height is a minimum and the measured height wins; cell text may wrap. |
| `ruled` | `boolean` | — | Draw a thin rule between rows. |
| `selectable` | `boolean` | `true` | When false, clicking a row neither selects nor opens it and there is no hover tint; only keyboard movement and expanding remain (for tables of mostly buttons). |
| `interactive` | `boolean` | `true` | Interactive (default true): rows can be clicked, selected and moved with the keyboard, with a context menu. |
| `stretch` | `boolean` | — | Treat column widths as proportions: when the container is wider than the sum, the extra space is shared by width ratio; by default widths are fixed pixels. |
| `fit` | `boolean` | — | Height follows the content (a small table in a dialog): no scrollbar up to maxHeight px. |
| `maxHeight` | `number` | — | Largest height in px when fit is set. |
| `classNames` | `Partial<Record<GridSlot, string>>` | `{}` | Extra class names per part. |

### 列类型 ColumnType

数字类默认靠右，用等宽数字；pnl、change、side 用 ToneText 跟 data-updown 着色（红涨绿跌时互换）。bar 是以 0 为中线的居中条（正在右用涨色、负在左用跌色，长度按本列绝对值最大者归一，数字写在条旁；format 的 digits 与 suffix 同 pnl）。pill 是一格多枚短标签（值是字符串或 { label, tone } 的数组，tone 只有 up / down / muted / accent 四种，不传色值），一行放不下的按格子宽度收成「+n」、悬停的 title 写全部，format.maxPills 可再限个数。progress 是分子 / 分母加一条 3px 细条（值是 { done, total } 或 [done, total]，分母不是正数不画条，排序按比例）。任何列都可以再声明 heat: { domain, rank? }：格子底色按值深浅（跨 0 的 domain 里正数用涨色、负数用跌色，不跨 0 的按单边从最小到最大），rank 给了就在格子右上角写名次小字，不占行高行宽；颜色只由 token 给，不传色值。

### DataGridHost（经 DataGridHostProvider 提供）

应用才有的能力；包里不带语言，文案都是宿主传的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `matchKey` | `(event: KeyboardEvent<HTMLElement>) => GridAction \| null` | — | Which table action a key press stands for; null if none. |
| `keysOf` | `(action: GridAction) => string \| undefined` | — | How an action's shortcut is written (shown at the right of menu items and in the table name). |
| `texts` | `Partial<DataGridTexts>` | — | Texts of the menu items and accessible names; the standard menu items appear only when copy, save and resetColumns are all given. |
| `renderMenu` | `(entries: readonly GridMenuEntry[]) => ReactNode` | — | What to draw in the menu: use it when the host's items go beyond GridMenuEntry; by default the package draws item, submenu and separator. |
| `askAgent` | `(text: string \| null) => void` | — | Ask the agent: when given together with askText, rows get a context menu item and the key works while the table is focused. |

### ColumnPicker

触发按钮加弹层：上面列集芯片（整套列一键切换，亮着哪个由看得见的列恰好等于它的列推出来），下面逐列勾选。不存状态，layout 受控；最后一列看得见的不许藏。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `layout` * | `readonly GridColumnLayout[]` | — | The same layout as DataGrid's. |
| `onLayoutChange` * | `(next: GridColumnLayout[]) => void` | — | Called with the whole new layout after a column set is chosen or a column is toggled. |
| `sets` | `readonly ColumnSet[]` | `[]` | Column sets; omit or leave empty for ticks only. |
| `labels` * | `ColumnPickerLabels` | — | Copy for the trigger and the two group headings (the package carries no language). |
| `iconOnly` | `boolean` | — | Icon-only trigger (the read-aloud name stays labels.trigger), for the "+" slot at the far right of the header. |
| `className` | `string` | — | Extra class name on the root. |

### usePersistedState(key, initial, { version, storage?, validate? })

像 useState，值存进存储（默认 localStorage，读写包 try/catch）；版本不符、坏了、validate 不过都当没存过，不写迁移。返回 [值, 设值, 重置]。

### readPersisted(key, { version, storage?, validate? })

读 usePersistedState 存的值；没有、坏了、版本不符、validate 不过都返回 undefined。

### useSavedViews({ key, version, storage?, recentLimit? })

命名视图的快照仓库（值由调用方定，件只当不透明 JSON）：saveAs 另存、save 覆盖、remove、setDefault、use（记进最近并返回值）、recent、exportJson / importJson。

### reorderColumn / moveColumn / setColumnVisible / setColumnFixed / applyColumnSet / activeColumnSet

列摆法（layout）的纯函数，列头菜单、拖动重排与 ColumnPicker 用的同一份，都返回新数组。reorderColumn(layout, from, to) 拖到目标位置；moveColumn(layout, id, ±1) 跳过藏起来的列移一格；setColumnVisible 不许藏最后一列；setColumnFixed 固定的列挨着排在最前；applyColumnSet(layout, columns) 套列集；activeColumnSet(layout, sets) 返回看得见的列恰好等于的那个列集 id。

### tableCsv(header, rows)

导出的 CSV：含逗号、引号、换行的格子加引号，公式开头的补单引号。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DataGrid, type GridColumn, type GridColumnLayout, type SortSpec } from '@katana-ui/react/blocks'

type Row = { id: string; symbol: string; pnl: number }

const ROWS: readonly Row[] = [
  { id: 'a', symbol: 'BTCUSDT', pnl: 125.4 },
  { id: 'b', symbol: 'ETHUSDT', pnl: -31.75 },
]
const COLUMNS: readonly GridColumn<Row>[] = [
  { id: 'symbol', type: 'text', value: (row) => row.symbol },
  { id: 'pnl', type: 'pnl', value: (row) => row.pnl },
]
const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: 'Symbol', width: 120, visible: true },
  { id: 'pnl', label: 'PnL', width: 100, visible: true },
]

export function DataGridUsage() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  return (
    <DataGrid
      columns={COLUMNS}
      layout={LAYOUT}
      rows={ROWS}
      rowId={(row) => row.id}
      label="Positions"
      sort={sort}
      onSortChange={setSort}
    />
  )
}
```

## States

- 无行：显示 emptyText 或空白，表头仍在。
- 有选中行：一整行底色，Esc 清掉。
- 键盘所在行：焦点环；排序列：表头带升降箭头。
- 只读（interactive=false）：table 语义，表头不是按钮。
- 子行：有子行的行带 aria-expanded（true 摊开、false 收起）；没有子行的行没有这个属性，按 → 没反应。
- custom 列没有 text 时复制与导出是空字；有按钮的格子别指望整行点击。
- 列优先级（standard 与 hero 分量，有表头）：可见列放不下容器时按 GridColumn.priority 从低到高收起（没写的按声明顺序，第一列 1、第二列 2……），至少留两列，固定在左边的列不收；表头右端出「+N 列」胶囊（文案 texts.moreColumns，默认英文 +N cols），点了切成横向滚动、显示全部列，胶囊变 texts.collapseColumns，再点收起。出胶囊时表头与数据行在右端让出它的宽度，不盖住最后一列（stretch 的表，保留的列撑满的是容器宽减胶囊宽）。状态只在组件里，不存；容器变宽放得下了胶囊就消失。只影响显示：复制与导出仍是全部可见列。compact 分量与不画表头的表不走这一套；collapseColumns={false} 关掉，一直横向滚动。

## Don't

- 不要把例子里的数据当真实行情；调用方要传真实行。
- 不要为了放进窄容器自己去藏列或截断：给列写 priority，放不下的由表收起并写出收了几列。
- 不要给数值列自己写 text-align；列类型决定对齐。
- 不要靠颜色以外没有符号的方式表达涨跌。
- 不要在 custom 列里重画 price、pnl 这类有类型的格子；有类型的用类型，custom 留给类型表达不了的。
- 不要把整张子表塞进子行；子行放一两段说明或一个表单，更多的另开页面。

## Composition

```
DataGrid
  ContextMenu（行与空白处的右键菜单）
  表头行（列头按钮、拖动把手）
  虚拟滚动的行（单元格：文字 | ToneText | 品种两段 | 调用方 render / cell）
  子行（renderSubRow，展开的行后面）
  foot
```

## Keyboard

- `↑ / ↓`：移一行；Home / End 到头尾
- `Enter`：打开键盘所在的行（onOpen）
- `→ / ←`：展开 / 收起键盘所在行的子行（renderSubRow）
- `Shift / Ctrl 点击`：选一段 / 点选加减
- `Esc`：清掉选择（右键菜单开着时归菜单）
- `列头右键`：列头菜单：排序、固定、隐藏、左右移、重置列
- `拖动列头`：重排列（放在目标列的位置）
- `菜单键 / Shift+F10`：开右键菜单（宿主的 matchKey 提供）
- `Ctrl+C / Ctrl+S / Ctrl+R`：复制所选行 / 导出 CSV / 重置列（宿主的键位表）
