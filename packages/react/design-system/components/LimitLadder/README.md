# LimitLadder

按板位从高到低分层的涨停梯队：层头是点阵层号、只数与晋级率（晋级 1/3 加一条细条），层里列个股；炸板、跌停、没涨停的整行淡显并带状态标签。数据与文字都由调用方传，件不认数据集。

## Provide

### LimitLadder

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `levels` | `LadderLevel[]` | — | { board, promoted?: [已晋级, 候选], items }；件自己按 board 从高到低排。空数组画空态。 |
| `levels[].items` | `LadderItem[]` | — | { code, name, change（百分数）, firstSeal?, sealAmount?（元）, opens?, industry?, status }；没有的值写「—」。 |
| `labels` | `LimitLadderLabels` | — | 层号单位、晋级率与只数文字、状态名、列名、读屏名、空态文字，由调用方传。 |
| `selected` | `string \| null` | — | 选中个股的代码；选中行左侧画 2px 强调条。 |
| `onSelect` | `(code: string) => void` | — | 点击或 Enter / Space 选一行。 |

## States

- 封住：状态标签取涨色（pnl-up，data-updown 互换时跟着换）。
- 炸板：整行 60% 不透明，标签琥珀。跌停：整行淡显，标签跌色。没涨停：整行淡显，标签灰。
- 选中：行底 6.5% 白，左侧 2px 强调条。

## Don't

- 不要把橙色用在数据上，它只给选中条。
- 不要在件里写死中文或数据集字段；文字与数据由调用方传。
- 没有数据时不要放样本行，传空数组。

## Composition

```
LimitLadder
  列头
  listbox
    层（group）：层号（点阵）| 单位 | 只数 | 晋级率 + 细条
      行（option）：名称 + 代码 | 涨跌幅 | 首封 | 封单额 | 开板 | 行业 | 状态标签
```

## Keyboard

- `↑ / ↓`：在行间移动焦点
- `Enter / Space`：选中当前行
