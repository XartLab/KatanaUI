# DataGrid

拼面板用的数据表：TanStack Table 管排序、列宽、顺序、显隐，虚拟滚动只画看得见的行；列声明一个类型（价格、数量、盈亏、涨跌幅、方向、时间、品种……），格式化、对齐、着色、排序由类型给。列的状态受控（调用方存）；应用的能力经 DataGridHost 注入。

## Provide

### DataGrid

示例数据写死在页里，不是行情。行高档：compact 20、default 24、relaxed 32。没有 DataGridHost 时能点、能排序、能键盘选行，只是没有快捷键与标准右键项。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `columns` | `GridColumn<Row>[]` | — | 列的定义，模块级常量：id、type、value、format、text、sort、tone、fill、render、csv。 |
| `layout` | `GridColumnLayout[]` | — | 列怎么摆：次序就是显示次序，每项 id、label、width、visible、align、fixed。 |
| `rows / rowId` | `Row[] / (row) => string` | — | 行与稳定的行 id。 |
| `label` | `string` | — | 屏幕阅读器念的表名。 |
| `sort / onSortChange` | `SortSpec \| null / (next) => void` | — | 排序受控；点表头在升序、倒序、不排之间转。 |
| `sortRemovable` | `boolean` | `true` | false 时第三下回到升序。 |
| `onResize / onResetColumns` | `function` | — | 拖完列宽 / 重置列；没给就没有拖动把手与「重置列」。 |
| `onOpen / restoreRow / isOpened` | `function` | — | 点一行、从详情返回时放回键盘所在行、正开着的行（左边强调色）。 |
| `menu / panelMenu / menuTail / rowInfo / extrasFirst` | `function` | — | 右键菜单里标准项之外追加的项与次序。 |
| `askText / onExport` | `function` | — | 问 Agent 的摘要文字（需宿主 askAgent）/ 导出 CSV 交给宿主存。 |
| `timeZone` | `'local' \| 'utc' \| string` | `'local'` | time 列的时区。 |
| `density` | `'compact' \| 'default' \| 'relaxed'` | `'default'` | 行高档。 |
| `hideHeader` | `boolean` | `false` | 不画表头。 |
| `interactive` | `boolean` | `true` | false 是只读展示表（ARIA table），行不响应点击。 |
| `fit / maxHeight` | `boolean / number` | — | 高度跟着内容走（对话框里的小表），maxHeight 像素以内不出滚动条。 |
| `foot / presorted / rowTree / classNames` | `various` | — | 表下说明、调用方已排好、树形行、各部分额外类名。 |

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

### DataGridHost（经 DataGridHostProvider 提供）

应用才有的能力；包里不带语言，文案都是宿主传的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `matchKey / keysOf` | `function` | — | 按键对应表的哪个动作（copy、save、resetColumns、contextMenu、askAgent）/ 动作的快捷键写法。 |
| `texts` | `Partial<DataGridTexts>` | — | 菜单项与可访问名称的文案；copy、save、resetColumns 三项都给了菜单里才有标准项。 |
| `renderMenu` | `(entries) => ReactNode` | — | 宿主的菜单项比包里的多时自己画；省略时包里画 item / 二级 / 分隔线。 |
| `askAgent` | `(text \| null) => void` | — | 问 Agent：给了它，又给了 askText，菜单多一项、表获得焦点时按键也一样。 |

### tableCsv(header, rows)

导出的 CSV：含逗号、引号、换行的格子加引号，公式开头的补单引号。

## States

- 无行：显示 emptyText 或空白，表头仍在。
- 有选中行：一整行底色，Esc 清掉。
- 键盘所在行：焦点环；排序列：表头带升降箭头。
- 只读（interactive=false）：table 语义，表头不是按钮。

## Don't

- 不要把例子里的数据当真实行情；调用方要传真实行。
- 不要给数值列自己写 text-align；列类型决定对齐。
- 不要靠颜色以外没有符号的方式表达涨跌。

## Composition

```
DataGrid
  ContextMenu（行与空白处的右键菜单）
  表头行（列头按钮、拖动把手）
  虚拟滚动的行（单元格：文字 | ToneText | 品种两段 | 调用方 render）
  foot
```

## Keyboard

- `↑ / ↓`：移一行；Home / End 到头尾
- `Enter`：打开键盘所在的行（onOpen）
- `Shift / Ctrl 点击`：选一段 / 点选加减
- `Esc`：清掉选择（右键菜单开着时归菜单）
- `菜单键 / Shift+F10`：开右键菜单（宿主的 matchKey 提供）
- `Ctrl+C / Ctrl+S / Ctrl+R`：复制所选行 / 导出 CSV / 重置列（宿主的键位表）
