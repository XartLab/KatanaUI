# PortfolioRunGrid

前向测试的主表：一个策略跑在一组品种上，每个品种一行——持仓、浮动盈亏、已实现盈亏、占用风险资金、权益贡献、状态（灯加文字：运行 / 暂停 / 停新开 / 断流），行内「暂停 / 恢复」与「平掉这个品种」；顶上一行组合汇总（权益、可用资金、购买力、回撤，LCD 读数）。暂停的行整行变琥珀色、按钮换成「恢复」，「平掉」仍可点；空仓的行「平掉」灰掉。底座是 DataGrid 的只读表。动作只把被点的那一行交给调用方，件不下单、不认识任何引擎或交易所。功能参照 MultiCharts Portfolio Trader 的 Forward Testing 窗口（2026-11-21 读官方页面，界面细节未实看，待核对）。演示数据是编的。

## Provide

`*` marks a required prop.

### PortfolioRunGrid

数据、数字格式与全部文字由调用方传，包里没有语言与币种。onPause / onResume / onClose 收到被点的那一行（PortfolioRunRow）；没给对应回调，那个按钮灰掉。format 与 labels 要稳定的引用，换了就重建列。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` * | `readonly PortfolioRunRow[]` | — | One row per symbol. |
| `summary` * | `PortfolioRunSummary` | — | Portfolio totals shown above the table; a null item shows a dash. |
| `format` * | `PortfolioRunFormat` | — | How numbers are written as text (amount, quantity, percent). |
| `labels` * | `PortfolioRunLabels` | — | All text; the package has no language of its own. |
| `onPause` | `(row: PortfolioRunRow) => void` | — | Called with the clicked row when its Pause button is clicked; without it the button is disabled. |
| `onResume` | `(row: PortfolioRunRow) => void` | — | Called with the clicked row when its Resume button is clicked. |
| `onClose` | `(row: PortfolioRunRow) => void` | — | Called with the clicked row when its Close button is clicked; confirming the close is the caller's job. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PortfolioRunGrid, type PortfolioRunRow } from '@katana-ui/react'

// 最小用法：下面的品种与数字都是编的演示数据。
const ROWS: PortfolioRunRow[] = [
  {
    id: 'a',
    symbol: 'DEMO-A',
    position: 3,
    unrealizedPnl: 142.5,
    realizedPnl: 310,
    riskAmount: 1200,
    equityContribution: 452.5,
    status: 'running',
  },
  {
    id: 'b',
    symbol: 'DEMO-B',
    position: -2,
    unrealizedPnl: -86,
    realizedPnl: 40,
    riskAmount: 900,
    equityContribution: -46,
    status: 'paused',
  },
  {
    id: 'c',
    symbol: 'DEMO-C',
    position: 0,
    unrealizedPnl: 0,
    realizedPnl: -120,
    riskAmount: 0,
    equityContribution: -120,
    status: 'disconnected',
  },
]

export function PortfolioRunGridUsage() {
  return (
    <PortfolioRunGrid
      rows={ROWS}
      summary={{ equity: 100_373.5, availableFunds: 86_200, buyingPower: 172_400, drawdown: -0.0342 }}
      format={{
        amount: (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        quantity: String,
        percent: (v) => `${(v * 100).toFixed(2)}%`,
      }}
      labels={{
        grid: '组合运行表',
        summary: '组合汇总',
        equity: '权益',
        availableFunds: '可用资金',
        buyingPower: '购买力',
        drawdown: '回撤',
        columns: {
          symbol: '品种',
          position: '持仓',
          unrealizedPnl: '浮动盈亏',
          realizedPnl: '已实现盈亏',
          riskAmount: '占用风险资金',
          equityContribution: '权益贡献',
          status: '状态',
          actions: '操作',
        },
        status: { running: '运行', paused: '暂停', noNewEntries: '停新开', disconnected: '断流' },
        pause: '暂停',
        resume: '恢复',
        closePosition: '平掉',
      }}
      onPause={() => {}}
      onResume={() => {}}
      onClose={() => {}}
    />
  )
}
```

## States

- 运行：绿灯加「运行」，行是普通底色。
- 暂停：琥珀灯、行底与左条变琥珀，按钮由「暂停」换成「恢复」；「平掉」照常可点。
- 停新开：强调色灯，行左一道强调色条；不再开新仓、已有仓位照常管理。
- 断流：红灯，行底与左条变红；暂停与平掉仍可点。
- 空仓：持仓为 0 的行「平掉」灰掉。
- 汇总项为 null：读数写「—」；回撤为负数时走跌色。
- 没有品种：表下面写 labels.empty。

## Don't

- 不要指望件去下单或平仓：它只发回调，下单与确认在调用方。
- 不要只靠灯色表达状态：状态格永远带文字。
- 要看回测结果用 StrategyReport；这里是正在运行的品种。
- 不要把品种之外的东西（账户、策略）塞进行里；一行就是一个品种。

## Composition

```
PortfolioRunGrid
  div（汇总，role=group）
    Lcd × 4
  DataGrid（只读表）
    Led + 状态文字
    Button × 2（暂停 / 恢复、平掉）
```

## Keyboard

- `Tab`：在各行的按钮间依次移动
- `Enter / Space`：触发聚焦的按钮
