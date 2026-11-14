# DataGrid

拼面板用的数据表：TanStack Table 管排序、列宽、顺序、显隐，虚拟滚动只画看得见的行；列声明一个类型（价格、数量、盈亏、涨跌幅、方向、时间、品种……），格式化、对齐、着色、排序由类型给。列的状态受控（调用方存）；应用的能力经 DataGridHost 注入。

## Provide

### DataGrid

示例数据写死在页里，不是行情。行高档：compact 20、default 24、relaxed 32。没有 DataGridHost 时能点、能排序、能键盘选行，只是没有快捷键与标准右键项。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `columns` | `GridColumn<Row>[]` | — | 列的定义：id、type、value、format、text、sort、tone、fill、cell（custom 列的内容）、render、csv、rowHeader。列对象要稳定，别每次渲染新建。 |
| `layout` | `GridColumnLayout[]` | — | 列怎么摆：次序就是显示次序，每项 id、label、width、visible、align、fixed。 |
| `rows / rowId` | `Row[] / (row) => string` | — | 行与稳定的行 id。 |
| `label` | `string` | — | 屏幕阅读器念的表名。 |
| `sort / onSortChange` | `SortSpec \| null / (next) => void` | — | 排序受控；点表头在升序、倒序、不排之间转。没给 onSortChange 就不能排序，表头是普通的字。 |
| `sortRemovable` | `boolean` | `true` | false 时第三下回到升序。 |
| `onLayoutChange` | `(next: GridColumnLayout[]) => void` | — | 列摆法变了（列头右键菜单的固定 / 隐藏 / 左右移、拖动列头重排）：给出整份新 layout，调用方存。没给就没有这些菜单项，列头不能拖。列头右键菜单的文案走 DataGridHost 的 texts.columnMenu。 |
| `onResize / onResetColumns` | `function` | — | 拖完列宽 / 重置列；没给就没有拖动把手与「重置列」。 |
| `onOpen / restoreRow / isOpened` | `function` | — | 点一行、从详情返回时放回键盘所在行、正开着的行（左边强调色）。 |
| `rowProps` | `(row) => GridRowProps \| undefined` | — | 给一行加属性：className（并进行的类名）、title、data-*、aria-*。状态、测试钩子从这里来，不用在外面再包一层。 |
| `renderSubRow` | `(row) => ReactNode` | — | 可展开的子行，跨满整行宽、高度跟着内容走；返回 null / undefined / false 是这一行没有子行。表按 treegrid 读，有子行的行带 aria-expanded。 |
| `expanded / onExpandedChange / defaultExpanded` | `Set<string> / (id, expanded) => void / (row) => boolean` | — | 展开状态：给了 expanded 就受控（展开收起只通知 onExpandedChange）；不给时表自己记，没动过的行看 defaultExpanded（省略是收起）。 |
| `menu / panelMenu / menuTail / rowInfo / extrasFirst` | `function` | — | 右键菜单里标准项之外追加的项与次序。 |
| `askText / onExport` | `function` | — | 问 Agent 的摘要文字（需宿主 askAgent）/ 导出 CSV 交给宿主存。 |
| `timeZone` | `'local' \| 'utc' \| string` | `'local'` | time 列的时区。 |
| `density` | `'compact' \| 'default' \| 'relaxed'` | `'default'` | 行高档。 |
| `hideHeader` | `boolean` | `false` | 不画表头。 |
| `autoRowHeight` | `boolean` | `false` | 行高跟着内容走：多行的格子、行里有按钮的表。density 的行高是最小高度，格子里的字可以折行。 |
| `ruled` | `boolean` | `false` | 行与行之间画一道细线。 |
| `selectable` | `boolean` | `true` | false：点行不选、不打开，没有悬停底色，只留键盘移动与展开（行里主要是按钮的表）。 |
| `interactive` | `boolean` | `true` | false 是只读展示表（ARIA table），行不响应点击。 |
| `fit / maxHeight` | `boolean / number` | — | 高度跟着内容走（对话框里的小表），maxHeight 像素以内不出滚动条。 |
| `foot / presorted / rowTree / classNames` | `various` | — | 表下说明、调用方已排好、树形行、各部分额外类名（含 subrow）。 |

### 列类型 ColumnType

数字类默认靠右，用等宽数字；pnl、change、side 用 ToneText 跟 data-updown 着色（红涨绿跌时互换）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | — | 字符串，按字排序（自然序）。 |
| `number` | `number \| 十进制字符串` | — | 数值排序（十进制字符串不转双精度）；format.digits 定小数位。 |
| `price` | `number` | — | formatPrice：format.precision 或 tick 定小数位。 |
| `quantity` | `number` | — | formatQuantity：format.units（base | usd）与 size 缩写。 |
| `pnl` | `number` | — | 带符号的盈亏，format.digits（默认 2）、suffix（单位），按方向着色。 |
| `change` | `number（百分数）` | — | +1.23% 写法，按方向着色。 |
| `side` | `'buy' \| 'sell'` | — | 买卖文字加方向色；format.labels 传文案。 |
| `time` | `毫秒时间戳` | — | YYYY-MM-DD HH:MM:SS，时区取 timeZone；format.timeStyle 可只写时间或日期。 |
| `symbol` | `string \| { code, venue? }` | — | 代码加场所两段，场所写淡。 |
| `custom` | `cell(row) => ReactNode` | — | 格子里画什么都行（多行的字、使用度条、按钮）；复制、导出与排序用 text 与 sort。放在里面的按钮自己管点击。 |

### DataGridHost（经 DataGridHostProvider 提供）

应用才有的能力；包里不带语言，文案都是宿主传的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `matchKey / keysOf` | `function` | — | 按键对应表的哪个动作（copy、save、resetColumns、contextMenu、askAgent）/ 动作的快捷键写法。 |
| `texts` | `Partial<DataGridTexts>` | — | 菜单项与可访问名称的文案；copy、save、resetColumns 三项都给了菜单里才有标准项。 |
| `renderMenu` | `(entries) => ReactNode` | — | 宿主的菜单项比包里的多时自己画；省略时包里画 item / 二级 / 分隔线。 |
| `askAgent` | `(text \| null) => void` | — | 问 Agent：给了它，又给了 askText，菜单多一项、表获得焦点时按键也一样。 |

### ColumnPicker

触发按钮加弹层：上面列集芯片（整套列一键切换，亮着哪个由看得见的列恰好等于它的列推出来），下面逐列勾选。不存状态，layout 受控；最后一列看得见的不许藏。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `layout / onLayoutChange` | `GridColumnLayout[] / (next) => void` | — | 同 DataGrid 的 layout。 |
| `sets` | `{ id, label, columns: string[] }[]` | — | 列集：集里的列显示并按集的次序排前面，其余藏起来。省略就只有勾选。 |
| `labels` | `{ trigger, sets, columns }` | — | 文案由调用方传，包里没有语言。 |

### usePersistedState(key, initial, { version, storage?, validate? })

像 useState，值存进存储（默认 localStorage，读写包 try/catch）；版本不符、坏了、validate 不过都当没存过，不写迁移。返回 [值, 设值, 重置]。

### useSavedViews({ key, version, storage?, recentLimit? })

命名视图的快照仓库（值由调用方定，件只当不透明 JSON）：saveAs 另存、save 覆盖、remove、setDefault、use（记进最近并返回值）、recent、exportJson / importJson。

### tableCsv(header, rows)

导出的 CSV：含逗号、引号、换行的格子加引号，公式开头的补单引号。

## States

- 无行：显示 emptyText 或空白，表头仍在。
- 有选中行：一整行底色，Esc 清掉。
- 键盘所在行：焦点环；排序列：表头带升降箭头。
- 只读（interactive=false）：table 语义，表头不是按钮。
- 子行：有子行的行带 aria-expanded（true 摊开、false 收起）；没有子行的行没有这个属性，按 → 没反应。
- custom 列没有 text 时复制与导出是空字；有按钮的格子别指望整行点击。

## Don't

- 不要把例子里的数据当真实行情；调用方要传真实行。
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
