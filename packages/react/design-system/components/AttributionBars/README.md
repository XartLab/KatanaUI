# AttributionBars

今天（或选中区间）的钱从哪来：工作台顶行（宽体标题、维度与区间分段、表格 / 导出），点阵元信息与列头，每行编号加零轴条形（正在右、负在左，条是点阵纹理不用红绿，只有数字用涨跌色），已平仓的行整行删除线并在名称后挂点阵小标签，元信息行下面一行汇总（合计大号左带 2px 强调竖条，正负贡献小一号）；按 |贡献| 正负分组降序，超过 7 项折「其他 ×n」，费用·税永远在最底。对设计稿的 PnLAttribution 卡（卡明写不用瀑布图），语言同 SeriesExplorer。

## Provide

`*` marks a required prop.

### AttributionBars

数据只有 items；维度与区间切换由调用方做（换 items），组件只画分段并上报。文字全从 props 来。外观读 CSS 变量，见 theme/chart-kit.css 开头。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `{ key, label, value, kind?, detail? }[]` | — | kind 为 fee 的是费用·税，永远单独一行放最底；closed 是名称后的点阵小标签（整行删除线）；detail 是 tooltip 里多写的几行。 |
| `formatValue / formatShare` | `(n) => string` | — | 贡献与占比写成什么字。 |
| `labels` | `{ other: (n) => string, share: string }` | — | 「其他 ×n」与占比那一行的字。旧名 otherLabel / shareLabel 留一个版本（@deprecated）。 |
| `title / meta` | `string / (scale) => string` | — | 标题（宽体大写英文）与下一行点阵元信息；刻度 ±max 只在元信息里写一次。 |
| `dimensions / ranges` | `{ label, options, value, onValueChange }` | — | 顶行的两组分段；换了就换 items，同一位置的条长会过渡。旧名 onChange 留一个版本。 |
| `readouts` | `{ key, label, text, value? }[]` | — | 汇总行：第一个是合计（大号，左 2px 强调竖条），其余小一号跟在右边；标签点阵小字，value 决定涨跌色。 |
| `focusKey / onSelect` | `string / (key) => void` | — | 联动的品种：它的条转强调色纹理；点击或 Enter 写联动上下文。 |
| `footer` | `{ count, source?, note? }` | — | 页脚一行：左边点阵 SOURCE，右端「项数 · 声明」（研究账本不计入）。 |
| `actionLabels / heads` | `object` | — | 顶行按钮的读屏名与列头（编号、项、贡献、占比，可带 shareTitle 写明分母；点阵小字）；导出与全屏的回调不给就不画那个按钮，表格视图总有。 |
| `maxItems` | `number` | `7` | 超过几项折进「其他」（含「其他」这一行）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AttributionBars, type AttributionItem } from '@katana-ui/react/blocks'

const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

const money = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`

const ATTR_SYMBOLS: AttributionItem[] = [
  {
    key: '300750',
    label: '300750 宁德时代',
    value: 73_920,
    icon: {},
    detail: [
      { label: '持仓', value: '3' },
      { label: '账户', value: 'A B' },
    ],
  },
  { key: '00700', label: '00700 腾讯控股', value: 14_300, icon: {} },
  { key: '002475', label: '002475 立讯精密', value: 8_760, icon: {}, closed: '已平 09-18' },
  // 示意图标：自绘的 SVG，演示有图的样子。
  { key: 'BTC', label: 'BTC 比特币', value: 3_100, icon: { src: SAMPLE_MARK_SRC } },
  { key: '601012', label: '601012 隆基绿能', value: 1_640, icon: {} },
  { key: '688981', label: '688981 中芯国际', value: 480, icon: {} },
  { key: '000333', label: '000333 美的集团', value: 200, icon: {} },
  { key: '600519', label: '600519 贵州茅台', value: -11_200, icon: {} },
  { key: 'IF2510', label: 'IF2510 沪深300 期货', value: -32_580, icon: {} },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_ACCOUNTS: AttributionItem[] = [
  { key: 'A', label: '账户 A', value: 38_200 },
  { key: 'B', label: '账户 B', value: 9_400 },
  { key: 'F', label: '账户 F', value: -1_160 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_STRATEGIES: AttributionItem[] = [
  { key: 'trend', label: '趋势跟随', value: 52_300 },
  { key: 'mean', label: '均值回归', value: 4_200 },
  { key: 'hedge', label: '对冲', value: -9_600 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_CLASSES: AttributionItem[] = [
  { key: 'stock', label: '股票', value: 63_400 },
  { key: 'future', label: '期货', value: -17_000 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]

const ATTR_BY_DIM: Record<string, AttributionItem[]> = {
  symbol: ATTR_SYMBOLS,
  account: ATTR_ACCOUNTS,
  strategy: ATTR_STRATEGIES,
  asset: ATTR_CLASSES,
}

export function AttributionBarsUsage() {
  const [dim, setDim] = useState('symbol')
  const [range, setRange] = useState('today')
  const [focus, setFocus] = useState<string | undefined>('300750')
  const items = ATTR_BY_DIM[dim] ?? ATTR_SYMBOLS
  const pos = items.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  const neg = items.reduce((sum, item) => sum + Math.min(0, item.value), 0)
  return (
    <>
      <div className="gal-wide" data-gallery-attribution style={{ maxWidth: 760 }}>
        <AttributionBars
          items={items}
          title="P&L ATTRIBUTION"
          meta={(max) => `归因 · 今日 · 账户 A B · CNY · 刻度 ±${max.toLocaleString('en-US')}`}
          label="今日盈亏归因（示例）"
          dimensions={{
            label: '维度',
            value: dim,
            onValueChange: (key) => key && setDim(key),
            options: [
              { key: 'symbol', label: '品种' },
              { key: 'account', label: '账户' },
              { key: 'strategy', label: '策略' },
              { key: 'asset', label: '资产类别' },
            ],
          }}
          ranges={{
            label: '区间',
            value: range,
            onValueChange: (key) => key && setRange(key),
            options: [
              { key: 'today', label: '今日' },
              { key: 'week', label: '本周' },
              { key: 'month', label: '本月' },
            ],
          }}
          formatValue={money}
          labels={{ other: (n) => `其他 ×${n}`, share: '占比' }}
          formatShare={(x) => `${(x * 100).toFixed(1)}%`}
          readouts={[
            { key: 'sum', label: '今日合计', text: money(pos + neg), value: pos + neg },
            { key: 'pos', label: '正贡献', text: money(pos), value: pos },
            { key: 'neg', label: '负贡献', text: money(neg), value: neg },
          ]}
          focusKey={focus}
          onSelect={setFocus}
          heads={{ index: 'IDX', item: '品种', value: '贡献', share: '占比 |贡献|', shareTitle: '占总贡献绝对值之和' }}
          footer={{
            count: `${items.length} 项`,
            source: 'SOURCE · 台账成交 + 行情估值 · 演示数据',
            note: '研究账本不计入',
          }}
          actionLabels={{ group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
          onExport={() => {}}
        />
      </div>
    </>
  )
}
```

## States

- 默认：正组在上、负组在下，各按 |贡献| 降序；刻度 ±max 写在页脚。
- 焦点：focusKey 对应的条转强调色纹理。
- 悬停或聚焦一行：LCD tooltip 写数值、占比与明细。
- 表格视图：右上角第一个按钮切到表格，键盘可达（无障碍兜底）。

## Don't

- 不要用瀑布图：阅读要跟踪累计基线，认知负荷高。
- 不要用颜色区分账户或策略：标签说清楚就够。
- 不要在条上用涨跌色：涨跌色不上面积，只有右侧数字用。
- 不要在这里拆已实现 / 未实现：这里只回答「谁贡献了多少」。
- 不要做庆祝性反馈（实时更新只让数字滚动、条跟随）。

## Composition

```
AttributionBars
  Toolbar 顶行（标题 · 维度 / 区间分段 · 表格 / 导出 / 全屏）
  点阵元信息
  汇总行（合计 · 正贡献 · 负贡献）
  列头 + ul 每行（编号 · 标签 + 平仓小标签 · 零轴 + 条 · 数字 · 占比；悬停出 LCD tooltip）
  页脚一行（SOURCE · 项数与声明）
```

## Keyboard

- `Enter`：点击当前行（写联动）
- `Esc`：收起 tooltip
