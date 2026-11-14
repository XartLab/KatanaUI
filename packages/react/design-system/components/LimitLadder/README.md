# LimitLadder

A 股专有件（连板、涨停、炸板是 A 股的概念）。按板位从高到低分层的涨停梯队：顶上一行汇总读数（涨停只数、最高板、整体晋级率），下面按层：层头是粗体板位、只数与晋级率（加 2px 细进度条），层间留白；层里列个股：徽标、代码（主）、名称（次）。炸板、跌停、没涨停的文字淡显，状态胶囊保持全亮。数据与文字都由调用方传，件不认数据集。

## Provide

### LimitLadder

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `levels` | `LadderLevel[]` | — | { board, promoted?: [已晋级, 候选], items }；件自己按 board 从高到低排。空数组画空态。 |
| `levels[].items` | `LadderItem[]` | — | { code, name, change（百分数）, firstSeal?, sealAmount?（元，写成 520.00 M）, opens?, industry?, logo?, status }；没有的值写「—」。 |
| `labels` | `LimitLadderLabels` | — | 板位单位、晋级率与只数文字、状态名、汇总读数名、列名、读屏名、空态文字，由调用方传。 |
| `selected` | `string \| null` | — | 选中个股的代码；选中行左侧画 2px 强调条。 |
| `onSelect` | `(code: string) => void` | — | 点击或 Enter / Space 选一行。 |
| `rowActions` | `(item: LadderItem) => RowAction[]` | — | 行快捷操作（#23，一般传 symbolMenu(...)）：悬停或键盘落到这一行时右端浮出前三颗带图标的按钮，右键、菜单键、Shift+F10 出整份菜单。不传就没有。按钮条与菜单的读屏名取 labels.rowActions、labels.rowMenu（可选，省略用英文）。 |

## States

- 封住：状态标签取涨色（pnl-up，data-updown 互换时跟着换）。
- 炸板：文字 55% 不透明，胶囊琥珀、全亮。跌停：文字淡显，胶囊跌色。没涨停：文字淡显，胶囊灰。
- 选中：行底 6.5% 白，左侧 2px 强调条。

## Don't

- 不要把橙色用在数据上，它只给选中条。
- 不要在件里写死中文或数据集字段；文字与数据由调用方传。
- 没有数据时不要放样本行，传空数组。

## Composition

```
LimitLadder
  汇总读数（涨停 | 最高板 | 晋级率）
  列头
  listbox
    层（group）：板位（粗体）| 单位 | 只数 | 晋级率 + 细条
      行（option）：徽标 + 代码 + 名称 | 涨跌幅 | 首封 | 封单额 | 开板 | 行业 | 状态标签
```

## Keyboard

- `↑ / ↓`：在行间移动焦点
- `Enter / Space`：选中当前行
