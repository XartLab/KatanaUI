# LimitLadder

A 股专有件（连板、涨停、炸板是 A 股的概念）。按板位从高到低分层的涨停梯队：顶上一行汇总读数（涨停只数、最高板、整体晋级率），下面按层：层头是粗体板位、只数与晋级率（加 2px 细进度条），层间留白；层里列个股：徽标、代码（主）、名称（次）。炸板、跌停、没涨停的文字淡显，状态胶囊保持全亮。数据与文字都由调用方传，件不认数据集。

## Provide

`*` marks a required prop.

### LimitLadder

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `levels` | `LadderLevel[]` | — | { board, promoted?: [已晋级, 候选], items }；件自己按 board 从高到低排。空数组画空态。 |
| `levels[].items` | `LadderItem[]` | — | { code, name, change（百分数）, firstSeal?, sealAmount?（元，写成 520.00 M）, opens?, industry?, logo?, status }；没有的值写「—」。 |
| `labels` | `LimitLadderLabels` | — | 板位单位、晋级率与只数文字、状态名、汇总读数名、列名、读屏名、空态文字，由调用方传。 |
| `selected` | `string \| null` | — | 选中个股的代码；选中行左侧画 2px 强调条。 |
| `onSelect` | `(code: string) => void` | — | 点击或 Enter / Space 选一行。 |
| `rowActions` | `(item: LadderItem) => RowAction[]` | — | 行快捷操作（#23，一般传 symbolMenu(...)）：悬停或键盘落到这一行时右端浮出前三颗带图标的按钮，右键、菜单键、Shift+F10 出整份菜单。不传就没有。按钮条与菜单的读屏名取 labels.rowActions、labels.rowMenu（可选，省略用英文）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import { LimitLadder, type LadderLevel, type LimitLadderLabels } from '@katana-ui/react/quant'

const LADDER_LEVELS: readonly LadderLevel[] = [
  {
    board: 5,
    promoted: [1, 1],
    items: [
      {
        code: '600001',
        name: '示例科技',
        change: 10,
        firstSeal: '09:30',
        sealAmount: 5.2e8,
        opens: 0,
        industry: '软件',
        status: 'sealed',
      },
    ],
  },
  {
    board: 4,
    promoted: [1, 2],
    items: [
      {
        code: '600002',
        name: '示例电力',
        change: 10.01,
        firstSeal: '09:41',
        sealAmount: 2.1e8,
        opens: 1,
        industry: '电力',
        status: 'sealed',
      },
      {
        code: '000003',
        name: '示例传媒',
        change: 3.2,
        firstSeal: '09:36',
        sealAmount: 0,
        opens: 3,
        industry: '传媒',
        status: 'broken',
      },
    ],
  },
  {
    board: 3,
    promoted: [2, 4],
    items: [
      {
        code: '300004',
        name: '示例机器人',
        change: 19.98,
        firstSeal: '09:33',
        sealAmount: 3.6e8,
        opens: 0,
        industry: '机器人',
        status: 'sealed',
      },
      {
        code: '002005',
        name: '示例医药',
        change: 10.02,
        firstSeal: '10:12',
        sealAmount: 8.8e7,
        opens: 2,
        industry: '医药',
        status: 'sealed',
      },
      {
        code: '601006',
        name: '示例港口',
        change: 5.4,
        firstSeal: '09:50',
        sealAmount: 0,
        opens: 4,
        industry: '交运',
        status: 'broken',
      },
      { code: '603007', name: '示例化工', change: -10, opens: 0, industry: '化工', status: 'down' },
    ],
  },
  {
    board: 1,
    promoted: [6, 31],
    items: [
      {
        code: '000008',
        name: '示例半导体',
        change: 10.03,
        firstSeal: '09:45',
        sealAmount: 1.5e8,
        opens: 0,
        industry: '半导体',
        status: 'sealed',
      },
      {
        code: '002009',
        name: '示例食品',
        change: 6.1,
        firstSeal: '13:20',
        sealAmount: 0,
        opens: 2,
        industry: '食品',
        status: 'broken',
      },
      { code: '600010', name: '示例零售', change: 2.3, industry: '零售', status: 'none' },
    ],
  },
]

const LADDER_LABELS: LimitLadderLabels = {
  board: '板',
  promoted: (done, total) => `晋级 ${done}/${total}`,
  count: (n) => `${n} 只`,
  status: { sealed: '封住', broken: '炸板', down: '跌停', none: '没涨停' },
  columns: { name: '名称', change: '涨跌幅', firstSeal: '首封', sealAmount: '封单额', opens: '开板', industry: '行业' },
  summary: { sealed: '涨停', highest: '最高板', promoteRate: '晋级率' },
  list: '连板天梯',
  empty: '这一天没有涨停',
}

export function LimitLadderUsage() {
  const [selected, setSelected] = useState<string | null>('300004')
  return (
    <div style={{ width: '100%', maxWidth: 640, height: 660 }}>
      <PanelFrame focused aria-label="连板天梯">
        <PanelFrameHeader heading="连板天梯" object="演示数据" />
        <PanelFrameBody>
          <LimitLadder levels={LADDER_LEVELS} labels={LADDER_LABELS} selected={selected} onSelect={setSelected} />
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

// 市场热力图（#15）的演示数据：全是编出来的，不是真实品种，也不是行情。固定种子，每次打开一样。
```

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
