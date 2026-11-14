# AttributionBars

今天（或选中区间）的钱从哪来：零轴水平条形，正在右、负在左，条是点阵纹理不用红绿，只有数字用涨跌色；按 |贡献| 正负分组降序，超过 7 项折「其他 ×n」，费用·税永远在最底。对设计稿的 PnLAttribution 卡（卡明写不用瀑布图）。

## Provide

### AttributionBars

数据只有 items；维度切换（品种 / 账户 / 策略）由调用方做，换 items 即可。文字全从 props 来。外观读 CSS 变量，见 theme/chart-kit.css 开头。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `{ key, label, value, kind?, detail? }[]` | — | kind 为 fee 的是费用·税，永远单独一行放最底；detail 是 tooltip 里多写的几行。 |
| `formatValue / formatShare` | `(n) => string` | — | 贡献与占比写成什么字。 |
| `otherLabel / shareLabel` | `(n) => string / string` | — | 「其他 ×n」与占比那一行的标签。 |
| `total` | `{ value, text, tag? }` | — | 顶行右侧的合计，数字按正负用涨跌色；tag 是 EST 之类小标。 |
| `focusKey / onSelect` | `string / (key) => void` | — | 联动的品种：它的条转强调色纹理；点击或 Enter 写联动上下文。 |
| `footer` | `{ count, scale, note? }` | — | 页脚：项数说明、对称刻度（拿到 ±max）、来源或声明（研究账本不计入）。 |
| `actionLabels / tableHeads` | `object` | — | 右上角三件与表格视图的文字；导出与全屏的回调不给就不画那个按钮，表格视图总有。 |
| `maxItems` | `number` | `7` | 超过几项折进「其他」（含「其他」这一行）。 |

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
  顶行（合计 LCD · 表格视图 / 导出 / 全屏）
  ul 每行（标签 · 零轴 + 条 · 数字；悬停出 LCD tooltip）
  页脚（项数 · ±max 刻度 · 声明）
```

## Keyboard

- `Enter`：点击当前行（写联动）
- `Esc`：收起 tooltip
